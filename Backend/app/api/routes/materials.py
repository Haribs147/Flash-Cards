from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas import FolderCreate, MaterialOut, MaterialUpdate, VoteData
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import FlashcardSet, Material, User, VoteTypeEnum, MaterialShare, PermissionEnum, ShareStatusEnum, Vote


router = APIRouter(tags=["Materials and Folders"])

@router.get("/materials/all", response_model=list[MaterialOut])
def get_all_materials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    materials = db.query(Material).filter(Material.owner_id == current_user.id).all()
    return materials

@router.post("/folders", status_code=status.HTTP_201_CREATED)
def create_new_folder( folder_data: FolderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    new_material = Material(
        **folder_data.model_dump(),
        item_type="folder",
        owner_id=current_user.id
    )

    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    return new_material

def check_permission(item_id: int, req_access: str, db: Session, current_user: User) -> Material:
    result = db.query(Material, FlashcardSet.is_public).join(Material, FlashcardSet.id == Material.id).filter(Material.id == item_id).first()
    #TODO make a left join here so that it is faster
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    material, is_public = result
    if is_public and req_access == PermissionEnum.viewer.value:
        return material

    if current_user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permission")

    if material.owner_id == current_user.id:
        return material
    
    share = db.query(MaterialShare).filter(item_id == MaterialShare.material_id, MaterialShare.user_id == current_user.id).first()
    if not share or share.status != ShareStatusEnum.accepted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this material")

    permission = share.permission
    if req_access == PermissionEnum.viewer.value and permission in [PermissionEnum.viewer, PermissionEnum.editor]:
        return material
    
    if req_access == PermissionEnum.editor.value and permission == PermissionEnum.editor:
        return material
    
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permission")

@router.patch("/materials/{item_id}", response_model=MaterialOut)
def update_material(item_id: int, update_data: MaterialUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item_to_update = db.query(Material).filter(Material.id == item_id).first()

    if not item_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    if item_to_update.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this item")
    
    update_dict = update_data.model_dump(exclude_unset=True)

    if "name" in update_dict:
        item_to_update.name = update_data.name

    if "parent_id" in update_dict:
        if item_id == update_data.parent_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot move folder into itself")
        item_to_update.parent_id = update_data.parent_id

    db.commit()
    db.refresh(item_to_update)
    return item_to_update

def get_all_items_to_delete(item_id: int, db: Session) -> list[int]:
    ids_to_delete = set()
    queue = [item_id]

    while queue:
        current_id = queue.pop(0)
        ids_to_delete.add(current_id)

        children = db.query(Material).filter(Material.parent_id == current_id).all()
        for child in children:
            queue.append(child.id)

    return list(ids_to_delete)

@router.delete("/materials/{item_id}", status_code=status.HTTP_200_OK, response_model=list[int])
def delete_material(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item_to_delete = db.query(Material).filter(Material.id == item_id).first()
    
    if not item_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    if item_to_delete.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this item")
    
    if item_to_delete.item_type == "link":
        # TODO it should not remove the material share, instead there should be shares view on the frontend and we should be able to create shortcuts.
        share_to_delete = db.query(MaterialShare).filter(
            MaterialShare.material_id == item_to_delete.linked_material_id,
            MaterialShare.user_id == current_user.id
        ).first()
        if share_to_delete:
            db.delete(share_to_delete)

        db.delete(item_to_delete)
        db.commit()
        return [item_id]
    
    db.delete(item_to_delete)
    db.commit()
    
    return get_all_items_to_delete(item_id, db)

def process_vote(votable_id: int, votable_type: int, vote_type: int, db: Session, current_user: User):
    existing_vote = db.query(Vote).filter(
        Vote.user_id==current_user.id,
        Vote.votable_id==votable_id,
        Vote.votable_type==votable_type,
    ).first()

    new_user_vote = None

    if existing_vote:
        if existing_vote.vote_type == vote_type:
            db.delete(existing_vote)
        else:
            existing_vote.vote_type = vote_type
            new_user_vote = vote_type
    else:
        new_vote = Vote(
            user_id=current_user.id,
            votable_id=votable_id,
            votable_type=votable_type,
            vote_type=vote_type,
        )
        db.add(new_vote)
        new_user_vote = vote_type

    db.commit()

    upvotes = db.query(Vote).filter(Vote.votable_id==votable_id, Vote.votable_type==votable_type, Vote.vote_type==VoteTypeEnum.upvote).count()
    downvotes = db.query(Vote).filter(Vote.votable_id==votable_id, Vote.votable_type==votable_type, Vote.vote_type==VoteTypeEnum.downvote).count()

    return {"message": "Vote Processed", "upvotes": upvotes, "downvotes": downvotes, "user_vote": new_user_vote}

@router.post("/materials/{material_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_material(material_id: int, vote_data: VoteData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    if material.item_type != "set":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Items of type `{material.item_type}` cannot be voted on",
        )

    return process_vote(
        votable_id=material_id,
        votable_type="material",
        vote_type=vote_data.vote_type,
        db=db,
        current_user=current_user
    )