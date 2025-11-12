from fastapi import APIRouter, Depends, HTTPException, Response, status

from sqlalchemy.orm import Session, joinedload

from app.api.routes.materials import process_vote
from app.api.schemas import CommentCreate, CommentOut, CommentUpdate, VoteData
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import Material, User, VoteTypeEnum, Vote, Comment


router = APIRouter(tags=["Comments"])

@router.post("/materials/{material_id}/comments", status_code=status.HTTP_201_CREATED, response_model=CommentOut)
def new_comment(material_id: int, comment_data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    if material.item_type not in ["set"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Material of type `{material.item_type}` cannot be commented on"
        )

    if comment_data.parent_comment_id:
        parent_comment = db.query(Comment).filter(comment_data.parent_comment_id == Comment.id).first()
        if not parent_comment:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent comment not found")
        if parent_comment.parent_comment_id is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="U cannot make a reply to a reply")        

    new_commment = Comment(
        text=comment_data.text,
        user_id=current_user.id,
        material_id=material_id,
        parent_comment_id=comment_data.parent_comment_id
    )

    db.add(new_commment)
    db.commit()
    db.refresh(new_commment)
    
    return CommentOut(
        id=new_commment.id,
        text=new_commment.text,
        author_email=current_user.email,
        created_at=new_commment.created_at,
        upvotes=0,
        downvotes=0,
        user_vote=None,
        parent_id=new_commment.parent_comment_id,
        replies=[]
    )

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment_to_delete = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if comment_to_delete.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    parent_comment_path = comment_to_delete.path

    db.query(Comment).filter(
        Comment.path.descendant_of(parent_comment_path)
    ).delete(synchronize_session=False)

    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.patch("/comments/{comment_id}", status_code=status.HTTP_200_OK)
def update_comment(comment_id: int, comment_data: CommentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment_to_update = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.replies)
    ).filter(Comment.id == comment_id).first()

    if not comment_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if comment_to_update.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this comment")
    
    comment_to_update.text = comment_data.text

    db.commit()
    db.refresh(comment_to_update)

    upvotes = db.query(Vote).filter(Vote.votable_id==comment_id, Vote.votable_type=="comment", Vote.vote_type==VoteTypeEnum.upvote).count()
    downvotes = db.query(Vote).filter(Vote.votable_id==comment_id, Vote.votable_type=="comment", Vote.vote_type==VoteTypeEnum.downvote).count()
    user_vote_obj = db.query(Vote).filter(Vote.votable_id==comment_id, Vote.votable_type=="comment", Vote.user_id==current_user.id).first()
    user_vote = user_vote_obj.vote_type if user_vote_obj else None

    reply_ids = [reply.id for reply in comment_to_update.replies]

    return CommentOut(
        id=comment_to_update.id,
        text=comment_to_update.text,
        author_email=comment_to_update.author.email,
        created_at=comment_to_update.created_at,
        upvotes=upvotes,
        downvotes=downvotes,
        user_vote=user_vote,
        parent_id=comment_to_update.parent_comment_id,
        replies=reply_ids
    )

@router.post("/comments/{comment_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_comment(comment_id: int, vote_data: VoteData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    return process_vote(
        votable_id=comment_id,
        votable_type="comment",
        vote_type=vote_data.vote_type,
        db=db,
        current_user=current_user
    )
