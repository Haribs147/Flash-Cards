from typing import Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text

from app.api.schemas import CommentOut, CommentsDataOut
from app.db.models import Comment

def get_comment_by_id(
    db: Session,
    comment_id: int
) -> Comment | None:
    return db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

def get_comment_by_id_with_details(
    db: Session,
    comment_id: int
) -> Comment | None:
    return db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.replies)
    ).filter(Comment.id == comment_id).first()

def get_comments_for_set(
    db: Session,
    comment_id: int,
    set_id: int,
    user_id: int | None,
) -> CommentsDataOut:
    query = text("""
        SELECT
            c.id,
            c.text,
            c.created_at,
            c.parent_comment_id,
            u.email AS author_email,
            COALESCE(SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 ELSE 0 END), 0) AS upvotes,
            COALESCE(SUM(CASE WHEN v.vote_type = 'downvote' THEN 1 ELSE 0 END), 0) AS downvotes,
            (SELECT vote_type FROM votes WHERE votable_id = c.id AND votable_type = 'comment' AND user_id = :user_id) AS user_vote
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN votes v on v.votable_id = c.id AND v.votable_type = 'comment'
        WHERE c.material_id = :set_id
        GROUP BY c.id, u.email
        ORDER BY c.path;
    """)
    comment_results = db.execute(query, {"set_id": set_id, "user_id": user_id})

    comments = {}
    top_level_comment_ids = []

    for row in comment_results:
        comment_dict = dict(row._mapping)
        comment_dict['parent_id'] = comment_dict.pop('parent_comment_id')
        comments[row.id] = CommentOut(**comment_dict, replies=[])

    for comment_id, comment in comments.items():
        if comment.parent_id:
            if comment.parent_id in comments:
                comments[comment.parent_id].replies.append(comment_id)
        else:
            top_level_comment_ids.append(comment_id)
    
    return CommentsDataOut(
        comments=comments,
        top_level_comment_ids=top_level_comment_ids,
    )

def create_comment(
    db: Session,
    text: str,
    user_id: int,
    material_id: int,
    parent_comment_id: Optional[int] = None
) -> Comment:
    new_comment = Comment(
        text=text,
        user_id=user_id,
        material_id=material_id,
        parent_comment_id=parent_comment_id
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

def delete_comment_with_replies(
    db: Session,
    comment: Comment,
):
    parent_comment_path = comment.path
    db.query(Comment).filter(
        Comment.path.descendant_of(parent_comment_path)
    ).delete(synchronize_session=False)
    db.commit()

def update_comment(
    db: Session,
    comment: Comment,
    text: str,
) -> Comment:
    comment.text = text
    db.commit()
    db.refresh(comment)
    return comment
