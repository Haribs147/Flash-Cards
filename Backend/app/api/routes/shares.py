from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.schemas import MaterialOut, PendingShareOut, ShareData, ShareUpdateData, SharedUser
from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models import Material, User, MaterialShare, ShareStatusEnum
from app.api.routes.materials import check_permission


router = APIRouter(tags=["Shares"])

@router.post("/materials/{item_id}/share", response_model=SharedUser, status_code=status.HTTP_201_CREATED)
def share_material(item_id: int, share_data: ShareData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=item_id, req_access="owner", db=db, current_user=current_user)

    user_to_share_with = db.query(User).filter(User.email == share_data.email).first()
    if not user_to_share_with:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with email: {share_data.email} not found")
    if user_to_share_with.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot share set with yourself")
    
    existing_share = db.query(MaterialShare).filter(MaterialShare.material_id == item_id, MaterialShare.user_id == user_to_share_with.id).first()
    if existing_share:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This material is already shared with this user.")
    
    new_share = MaterialShare(material_id=item_id, user_id=user_to_share_with.id, permission=share_data.permission)
    db.add(new_share)
    db.commit()
    db.refresh(new_share)
    return SharedUser(user_id=user_to_share_with.id, email=user_to_share_with.email, permission=new_share.permission)

@router.delete("/materials/{item_id}/share/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share_access(item_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=item_id, req_access="owner", db=db, current_user=current_user)
    
    share_to_delete =  db.query(MaterialShare).filter(MaterialShare.material_id == item_id, MaterialShare.user_id == user_id).first()
    if not share_to_delete:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This share doesn't exist.")
    
    db.delete(share_to_delete)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/materials/{item_id}/shares/update", status_code=status.HTTP_200_OK)
def update_shares(item_id: int, share_update_data: ShareUpdateData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_permission(item_id=item_id, req_access="owner", db=db, current_user=current_user)
    
    for update in share_update_data.updates:
        db.query(MaterialShare).filter(MaterialShare.material_id == item_id, MaterialShare.user_id == update.user_id).update({"permission": update.permission})
    
    db.commit()
    return {"message": "Permissions updates succesfully"}


@router.get("/shares/pending", status_code=status.HTTP_200_OK)
def get_shares(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pending_shares = db.query(
        MaterialShare.id, Material.name, User.email
    ).join(Material, MaterialShare.material_id == Material.id)\
     .join(User, Material.owner_id == User.id)\
     .filter( MaterialShare.user_id == current_user.id, MaterialShare.status == ShareStatusEnum.pending
    ).all()

    return [
        PendingShareOut(share_id=share_id, material_name=material_name, sharer_email=sharer_email)
        for share_id, material_name, sharer_email in pending_shares
    ]

@router.post("/shares/pending/{share_id}/accept", response_model=MaterialOut)
def accept_share(share_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    share = db.query(MaterialShare).filter(MaterialShare.id == share_id, MaterialShare.user_id == current_user.id, MaterialShare.status == ShareStatusEnum.pending).first()

    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found")
    
    original_material = db.query(Material).filter(Material.id == share.material_id).first()
    if not original_material:
        db.delete(share)
        db.commit()
        raise HTTPException(status_code=404, detail="Original material doesn't exist")
    
    link_material = Material(
        name=original_material.name,
        item_type="link",
        owner_id=current_user.id,
        parent_id=None, # TODO make it so that the user will send a parent_id
        linked_material_id = original_material.id
    )
    db.add(link_material)
    share.status = ShareStatusEnum.accepted
    db.commit()
    db.refresh(link_material)

    return link_material

@router.delete("/shares/pending/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def reject_share(share_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    share_to_delete = db.query(MaterialShare).filter(MaterialShare.id == share_id, MaterialShare.user_id == current_user.id, MaterialShare.status == ShareStatusEnum.pending).first()
    
    if not share_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found")
    
    db.delete(share_to_delete)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)