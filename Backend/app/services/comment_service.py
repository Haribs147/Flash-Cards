from sqlalchemy.orm import Session

from app.api.schemas import CommentCreate, CommentOut, CommentUpdate
from app.db.models import User, VoteTypeEnum
from app.repositories import comment_repository, material_repository, vote_repository
from app.services.exceptions import NotFoundError, PermissionDeniedError, ValidationError

class CommentService:
    def create_comment(self, db: Session, material_id: int, comment_data: CommentCreate, user: User) -> CommentOut:
        material = material_repository.get_all_materials_by_id(db, material_id)
        if not material: 
            raise NotFoundError("Material not found")
        if material.item_type not in ["set"]:
            raise ValidationError(f"Material of type `{material.item_type}` cannot be commented on")

        if comment_data.parent_comment_id:
            parent_comment = comment_repository.get_comment_by_id(db, comment_data.parent_comment_id)
            if not parent_comment:
                raise ValidationError("Parent comment not found")
            if parent_comment.parent_comment_id is not None:
                raise ValidationError("You cannot make a reply to a reply")
        
        new_comment = comment_repository.create_comment(
            db, comment_data.text, user.id, material_id, comment_data.parent_comment_id
        )
        
        return CommentOut(
            id=new_comment.id,
            text=new_comment.text,
            author_email=user.email,
            created_at=new_comment.created_at,
            upvotes=0,
            downvotes=0,
            user_vote=None,
            parent_id=new_comment.parent_comment_id,
            replies=[]
        )

    def delete_comment(self, db: Session, comment_id: int, user: User):
        comment_to_delete = comment_repository.get_comment_by_id(db, comment_id)
        if not comment_to_delete:
            raise NotFoundError("Comment not found")
        if comment_to_delete.user_id != user.id:
            raise PermissionDeniedError("Not authorized to delete this comment")
        
        comment_repository.delete_comment_with_replies(db, comment_to_delete)

    def update_comment(self, db: Session, comment_id: int, comment_data: CommentUpdate, user: User) -> CommentOut:
        comment_to_update = comment_repository.get_comment_by_id_with_details(db, comment_id)
        if not comment_to_update:
            raise NotFoundError("Comment not found")
        if comment_to_update.user_id != user.id:
            raise PermissionDeniedError("Not authorized to update this comment")
        
        updated_comment = comment_repository.update_comment(db, comment_to_update, comment_data.text)
        
        upvotes = vote_repository.get_vote_count(db, comment_id, "comment", VoteTypeEnum.upvote)
        downvotes = vote_repository.get_vote_count(db, comment_id, "comment", VoteTypeEnum.downvote)
        user_vote = vote_repository.get_user_vote_type(db, comment_id, "comment", user.id)
        reply_ids = [reply.id for reply in updated_comment.replies]

        return CommentOut(
            id=updated_comment.id,
            text=updated_comment.text,
            author_email=updated_comment.author.email,
            created_at=updated_comment.created_at,
            upvotes=upvotes,
            downvotes=downvotes,
            user_vote=user_vote,
            parent_id=updated_comment.parent_comment_id,
            replies=reply_ids
        )