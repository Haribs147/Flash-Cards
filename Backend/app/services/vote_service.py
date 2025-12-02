from sqlalchemy.orm import Session

from app.db.models import Comment, Material, User, VoteTypeEnum
from app.repositories import vote_repository
from app.services.exceptions import NotFoundError

class VoteService:
    def process_vote(
        self,
        db: Session,
        user: User,
        votable_id: int,
        votable_type: str,
        vote_type: VoteTypeEnum
    ) -> dict:
        if votable_type == "material":
            if not db.query(Material). filter(Material.id == votable_id).first():
                raise NotFoundError("Material not found")
        if votable_type == "comment":
            if not db.query(Comment). filter(Comment.id == votable_id).first():
                raise NotFoundError("Comment not found")

        existing_vote = vote_repository.find_user_vote(db, votable_id, votable_type, user.id)
        new_user_vote = None

        if existing_vote:
            if existing_vote.vote_type == vote_type:
                vote_repository.delete(existing_vote)
            else:
                existing_vote.vote_type = vote_type
                new_user_vote = vote_type
        else:
            vote_repository.create_vote(db, votable_id, votable_type, vote_type, user.id)
            new_user_vote = vote_type

        db.commit()

        upvotes = vote_repository.get_vote_count(db, votable_id, votable_type, VoteTypeEnum.upvote)
        downvotes = vote_repository.get_vote_count(db, votable_id, votable_type, VoteTypeEnum.downvote)

        return {
            "message": "Vote Processed",
            "upvotes": upvotes,
            "downvotes": downvotes,
            "user_vote": new_user_vote
        }