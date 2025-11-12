from datetime import datetime, timedelta, timezone
from typing import Optional
from bs4 import BeautifulSoup
from elasticsearch import Elasticsearch
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import and_, case, func, text
from sqlalchemy.orm import Session, joinedload
from app.core.security import get_current_user, get_optional_current_user
from app.db.database import get_db
from app.db.models import FlashcardSet, Material, User, VoteTypeEnum, Flashcard, MaterialShare, PermissionEnum, Vote
from app.external.elastic import get_es_client
from app.external.gemini import generate_tags
from app.api.routes.materials import  check_permission
from app.api.schemas import FlashcardSetUpdate, FlashcardSetUpdateAndCreate, MaterialOut, BasePublicSetOut, CommentOut, CommentsDataOut, CopySet, FlashcardSetOut, LastViewedSet, LastViewedSetsOut, MostLikedSetsOut, MostViewedSetsOut, PublicSetSearchOut, SharedUser, TimePeriod

router = APIRouter(tags=["Flashcard Sets"])

async def generate_and_save_tags(set_id: int, db: Session, elastic_search: Elasticsearch):
    set_material = db.query(Material).options(
        joinedload(Material.flashcard_set).joinedload(FlashcardSet.flashcards),
        joinedload(Material.owner)
    ).filter(Material.id == set_id).first()

    if not set_material or not set_material.flashcard_set or not set_material.owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Set not found")

    flashcard_set = set_material.flashcard_set

    flashcard_content = []
    for card in flashcard_set.flashcards:

        soup = BeautifulSoup(card.front_content, "html.parser")
        front_content_stripped = soup.get_text(separator=" ", strip=True)
        flashcard_content.append(front_content_stripped)

        soup = BeautifulSoup(card.back_content, "html.parser")
        back_content_stripped = soup.get_text(separator=" ", strip=True)
        flashcard_content.append(back_content_stripped)
    
    combined_flashcard_content = " ".join(flashcard_content)

    tags = generate_tags(
        name=set_material.name,
        description=flashcard_set.description,
        flashcards_content=combined_flashcard_content,
    )

    if not tags:
        print(f"No tags generated for set: {set_id}")

    document = {
        "set_id": set_id,
        "name": set_material.name,
        "description": flashcard_set.description,
        "tags": tags,
        "is_public": flashcard_set.is_public,
        "creator_email": set_material.owner.email,
        "created_at": set_material.created_at,
    }

    elastic_search.index(
        index="flashcard_sets_tags",
        id=set_id,
        document=document,
    )

@router.post("/sets", status_code=status.HTTP_201_CREATED, response_model=MaterialOut)
def create_new_set(
    set_data: FlashcardSetUpdateAndCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    elastic_search: Elasticsearch = Depends(get_es_client),
):
    new_material = Material(
        name=set_data.name,
        parent_id=set_data.parent_id,
        item_type="set",
        owner_id=current_user.id,
    )

    db.add(new_material)
    db.commit()
    db.refresh(new_material)

    new_flashcard_set = FlashcardSet(
        id=new_material.id,
        description=set_data.description,
        is_public=set_data.is_public,
    )

    for card_data in set_data.flashcards:
        new_card = Flashcard(
            set_id=new_material.id,
            front_content=card_data.front_content,
            back_content=card_data.back_content
        )
        db.add(new_card)

    db.add(new_flashcard_set)
    db.commit()

    background_tasks.add_task(
        generate_and_save_tags,
        set_id=new_material.id,
        db=db,
        elastic_search=elastic_search,
    )

    return new_material

@router.patch("/sets/{set_id}", status_code=status.HTTP_200_OK, response_model=MaterialOut)
def update_set(
    set_id: int,
    update_set_data: FlashcardSetUpdate,
    background_tasks: BackgroundTasks,
    db: Session=Depends(get_db),
    current_user: User = Depends(get_current_user),
    elastic_search: Elasticsearch = Depends(get_es_client),
):
    check_permission(item_id=set_id, req_access=PermissionEnum.editor.value, current_user=current_user, db=db)

    set_material = db.query(Material).options(
        joinedload(Material.flashcard_set).joinedload(FlashcardSet.flashcards)
    ).filter(Material.id == set_id).first()

    if not set_material:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    
    set_material.name = update_set_data.name

    flashcard_set = set_material.flashcard_set
    flashcard_set.description = update_set_data.description
    flashcard_set.is_public = update_set_data.is_public
    
    existing_cards = {card.id: card for card in flashcard_set.flashcards}
    incoming_cards = {card.id for card in update_set_data.flashcards if card.id is not None}

    for card_id, card in existing_cards.items():
        if card_id not in incoming_cards:
            db.delete(card)

    for card in update_set_data.flashcards:
        if card.id is not None and card.id in existing_cards:
            card_to_update = existing_cards[card.id]
            card_to_update.front_content = card.front_content
            card_to_update.back_content = card.back_content
        elif card.id is None:
            new_flashcard = Flashcard(
                set_id=set_id,
                front_content=card.front_content,
                back_content=card.back_content,
            )
            db.add(new_flashcard)
    # Mozna dodać updated at i to zrobić
    db.commit()
    db.refresh(set_material)

    background_tasks.add_task(
        generate_and_save_tags,
        set_id=set_material.id,
        db=db,
        elastic_search=elastic_search,
    )

    return set_material

@router.get("/sets/{set_id}", response_model=FlashcardSetOut)
def get_set(set_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_current_user), elastic_search: Elasticsearch = Depends(get_es_client)):
    # flashcard_set = db.query(FlashcardSet).options(
    #     joinedload(FlashcardSet.material).joinedload(Material.owner),
    #     joinedload(FlashcardSet.flashcards)
    # ).filter(FlashcardSet.id == set_id).first()

    # if not flashcard_set:
    #     raise HTTPException(status_code=404, detail="Flashcard set not found")

    # if flashcard_set.material.owner_id != current_user.id:
    #     raise HTTPException(status_code=403, detail="Not authorized to get this flashcard set")

    set_material = check_permission(item_id=set_id, req_access=PermissionEnum.viewer.value, current_user=current_user, db=db)
    if(set_material.item_type == "link"):
        set_material = db.query(Material).filter(Material.id == set_material.linked_material_id).first()
        set_id = set_material.id

    flashcard_set = db.query(FlashcardSet).filter(FlashcardSet.id == set_id).first()
    creator = db.query(User).filter(User.id == set_material.owner_id).first()
    shares = db.query(MaterialShare, User).join(User, MaterialShare.user_id == User.id).filter(MaterialShare.material_id == set_id).all()
    shared_with = [SharedUser(user_id=user.id, email=user.email, permission=share.permission) for share, user in shares]

    upvotes = db.query(Vote).filter(Vote.votable_id==set_id, Vote.votable_type=="material", Vote.vote_type==VoteTypeEnum.upvote).count()
    downvotes = db.query(Vote).filter(Vote.votable_id==set_id, Vote.votable_type=="material", Vote.vote_type==VoteTypeEnum.downvote).count()

    user_vote = None
    if current_user:
        user_vote_obj = db.query(Vote).filter(Vote.votable_id==set_id, Vote.votable_type=="material", Vote.user_id==current_user.id).first()
        user_vote = user_vote_obj.vote_type if user_vote_obj else None

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
    user_id = current_user.id if current_user else None
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
    
    comments_data = CommentsDataOut(
        comments=comments,
        top_level_comment_ids=top_level_comment_ids,
    )

    # Add the event to elastic search
    user_id = current_user.id if current_user else -1
    try:
        elastic_search.index(
            index="view_events",
            document={
                "user_id": user_id,
                "set_id": set_id,
                "timestamp": datetime.now(timezone.utc)
            },
        )
    except Exception as e:
        print(f"Error logging event view_events to elastic_search (set_id: {set_id}) error: {e}")


    flashcard_data = {
        "id": set_id,
        "name": set_material.name,
        "description": flashcard_set.description,
        "is_public": flashcard_set.is_public,
        "creator": creator.email,
        "flashcards": flashcard_set.flashcards,
        "shared_with": shared_with,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "user_vote": user_vote,
        "comments_data": comments_data,
    }
    return flashcard_data

@router.post("/sets/{set_id}/copy", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def copy_flashcard_set(set_id: int, copy_data: CopySet, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=set_id, req_access=PermissionEnum.viewer.value, db=db, current_user=current_user)
    
    original_material = db.query(Material).options(
        joinedload(Material.flashcard_set).joinedload(FlashcardSet.flashcards)
    ).filter(Material.id == set_id).first()

    if not original_material or not original_material.flashcard_set:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcardset not found")
    
    original_set = original_material.flashcard_set

    new_material = Material(
        name=f"{original_material.name} (copy)",
        item_type="set",
        owner_id=current_user.id,
        parent_id=copy_data.target_folder_id
    )

    db.add(new_material)
    db.flush()

    new_set = FlashcardSet(
        id=new_material.id,
        description=original_set.description,
        is_public=False,
    )

    db.add(new_set)

    new_flashcards = [Flashcard(front_content=card.front_content, back_content=card.back_content, set_id=new_material.id,) for card in original_set.flashcards]

    db.add_all(new_flashcards)
    db.commit()
    db.refresh(new_material)

    return new_material

@router.get("/public/sets/most_viewed", response_model=list[MostViewedSetsOut])
def get_most_viewed_sets(period: TimePeriod, db: Session = Depends(get_db), elastic_search: Elasticsearch = Depends(get_es_client)):
    public_set_ids_tuple = db.query(FlashcardSet.id).filter(FlashcardSet.is_public == True).all()
    if not public_set_ids_tuple:
        return []
    
    public_set_ids = [set[0] for set in public_set_ids_tuple]

    now = datetime.now(timezone.utc)
    if period == TimePeriod.day:
        cutoff_date = now - timedelta(days=1)
    elif period == TimePeriod.week:
        cutoff_date = now - timedelta(weeks=1)
    elif period == TimePeriod.month:
        cutoff_date = now - timedelta(days=30)
    else:
        cutoff_date = now - timedelta(days=365)
    
    query = {
        "size": 0,
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "timestamp": {
                                "gte": cutoff_date.isoformat(),
                                "lte": now.isoformat(),
                            }
                        }
                    }
                ], # podpiąć elastic searcha jako middleware, żeby logował logi z aplikacji
                # pobrać wszystkie i potem wybrać 20 publicznych
                "filter": [
                    {
                        "terms":{
                            "set_id": public_set_ids
                        }
                    }
                ]
            }
            
        },
        "aggs": {
            "top_sets": {
                "terms": {
                    "field": "set_id",
                    "size": 20,
                    "order": {"_count": "desc"}
                }
            }
        }
    }

    try:
        response = elastic_search.search(index="view_events", body=query)
    except Exception as e:
        print(f"Error getting most viewed sets: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get most viewed sets")

    buckets = response["aggregations"]["top_sets"]["buckets"]
    if not buckets:
        return []
    
    set_view_counts = {bucket["key"]: bucket["doc_count"] for bucket in buckets}
    set_ids = list(set_view_counts.keys())

    set_details = db.query(Material.id, Material.name, FlashcardSet.description, User.email, Material.created_at
    ).join(
        User, Material.owner_id == User.id
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).filter(
        Material.id.in_(set_ids),
        Material.item_type == "set"
    ).all()

    results = []

    for id, name, description, email, created_at in set_details:
        results.append(MostViewedSetsOut(
            id=id,
            name=name,
            description=description,
            creator=email,
            created_at=created_at,
            view_count=set_view_counts.get(id, 0)
        ))
    
    results.sort(key=lambda x: x.view_count, reverse=True)
    return results

@router.get("/public/sets/most_liked", response_model=list[MostLikedSetsOut])
def get_most_liked_sets(period: TimePeriod, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    if period == TimePeriod.day:
        cutoff_date = now - timedelta(days=1)
    elif period == TimePeriod.week:
        cutoff_date = now - timedelta(weeks=1)
    elif period == TimePeriod.month:
        cutoff_date = now - timedelta(days=30)
    else:
        cutoff_date = now - timedelta(days=365)

    like_count = func.count(Vote.id).label("like_count")

    top_sets_query = db.query(
        Material.id,
        like_count
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).join(
        Vote, and_(
            Material.id == Vote.votable_id,
            Vote.votable_type == "material",
            Vote.vote_type == VoteTypeEnum.upvote
        ),
        isouter=True
    ).filter(
        Material.created_at >= cutoff_date,
        FlashcardSet.is_public == True
    ).group_by(
        Material.id
    ).order_by(
        like_count.desc()
    ).limit(20).all()

    if not top_sets_query:
        return []
    
    like_counts = {set_id: count for set_id, count in top_sets_query}
    set_ids = list(like_counts.keys())

    set_details = db.query(Material.id, Material.name, FlashcardSet.description, User.email, Material.created_at
    ).join(
        User, Material.owner_id == User.id
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).filter(
        Material.id.in_(set_ids),
        Material.item_type == "set"
    ).all()

    results = []
    for id, name, description, email, created_at in set_details:
        results.append(MostLikedSetsOut(
            id=id,
            name=name,
            description=description,
            creator=email,
            created_at=created_at,
            like_count=like_counts.get(id, 0)
        ))
    
    results.sort(key=lambda x: x.like_count, reverse=True)
    return results

@router.get("/public/sets/recently_created", response_model=list[BasePublicSetOut])
def get_recently_created_sets(db: Session = Depends(get_db)):
    recent_sets = db.query(Material.id, Material.name, FlashcardSet.description, Material.created_at, User.email,
    ).join(
        User, Material.owner_id == User.id
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).filter(
        FlashcardSet.is_public == True,
        Material.item_type == "set"
    ).order_by(
        Material.created_at.desc()
    ).limit(20).all()

    if not recent_sets:
        return []
    
    results = [
        BasePublicSetOut(
            id=id,
            name=name,
            description=description,
            creator=email,
            created_at=created_at
        )
        for id, name, description, created_at, email in recent_sets
    ]

    return results

@router.get("/recent-sets", response_model=LastViewedSetsOut)
def get_last_viewed_sets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    elastic_search: Elasticsearch = Depends(get_es_client),
):
    es_query = {
        "size": 100,
        "sort": [{"timestamp": "desc"}],
        "query": {
            "bool": {
                "must": [
                    {"match": {"user_id": current_user.id}}
                ]
            }
        }
    }

    try:
        response = elastic_search.search(index="view_events", body=es_query)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not retrieve last viewed sets")
    
    latest_views = {}
    ordered_set_ids = []
    for hit in response['hits']['hits']:
        source = hit['_source']
        set_id = source['set_id']
        if set_id not in latest_views:
            latest_views[set_id] = source['timestamp']
            ordered_set_ids.append(set_id)

    if not ordered_set_ids:
        return {"sets": []}
    order_by_map = {set_id: index for index, set_id in enumerate(ordered_set_ids)}
    order_by_case = case(order_by_map, value=Material.id)

    sets_details = db.query(
        Material.id,
        Material.name,
        User.email,
    ).join(
        User, Material.owner_id == User.id
    ).filter(
        Material.id.in_(ordered_set_ids), Material.item_type == "set"
    ).order_by(order_by_case).all()

    last_viewed_sets = []
    for set_id, set_name, author_email in sets_details:
        last_viewed_sets.append(
            LastViewedSet(
                id=set_id,
                name=set_name,
                author_initial=author_email[0].upper(),
                viewed_at=latest_views[set_id]
            )
        )
    return {"sets": last_viewed_sets}



@router.post("/public/search", response_model=list[PublicSetSearchOut])
def search_public_sets(
    text_query: str,
    elastic_search: Elasticsearch = Depends(get_es_client),
):
    if not text_query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search query cannot be empty")
    
    query = {
        "size": 20,
        "query": {
            "bool": {
                "must": {
                    "multi_match": {
                        "query": text_query,
                        "fields": ["name", "description", "tags"],
                        "fuzziness": "AUTO",
                    }
                },
                "filter": {
                    "term": {"is_public": True}
                }
            }
        }
    }

    try:
        response = elastic_search.search(index="flashcard_sets_tags", body=query)
    except Exception as e:
        print(f"Error getting most viewed sets: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get search")

    results = []
    for hit in response['hits']['hits']:
        source = hit['_source']
        results.append(PublicSetSearchOut(
            id=source["set_id"],
            name=source["name"],
            description=source["description"],
            creator=source["creator_email"],
            created_at=source["created_at"],
            tags=source.get("tags", [])
        ))
    
    return results