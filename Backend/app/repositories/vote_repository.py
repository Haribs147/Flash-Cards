from sqlalchemy.orm import Session

from app.db.models import Vote, VoteTypeEnum

def get_vote_count(
    db: Session,
    votable_id: int,
    votable_type: str,
    vote_type: VoteTypeEnum
) -> int:
    return db.query(Vote).filter(
        Vote.votable_id==votable_id,
        Vote.votable_type==votable_type,
        Vote.vote_type==vote_type
    ).count()

def get_user_vote_type(
    db: Session,
    votable_id: int,
    votable_type: str,
    user_id: int,
) -> VoteTypeEnum | None:
    vote = db.query(Vote.vote_type).filter(
        Vote.votable_id==votable_id,
        Vote.votable_type==votable_type, 
        Vote.user_id==user_id
        ).first()
    return vote.vote_type if vote else None

def find_user_vote(
    db: Session,
    votable_id: int,
    votable_type: str,
    user_id: int,
) -> Vote | None:
    return db.query(Vote).filter(
        Vote.user_id==user_id,
        Vote.votable_id==votable_id,
        Vote.votable_type==votable_type,
    ).first()

def create_vote(
    db: Session,
    votable_id: int,
    votable_type: str,
    vote_type: VoteTypeEnum,
    user_id: int,
) -> Vote:
    new_vote = Vote(
        user_id=user_id,
        votable_id=votable_id,
        votable_type=votable_type,
        vote_type=vote_type,
    )
    db.add(new_vote)
    return new_vote

def delete(
    db: Session,
    vote: Vote,
):
    db.delete(vote)