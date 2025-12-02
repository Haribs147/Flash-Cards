from sqlalchemy.orm import Session, joinedload

from app.api.schemas import ShareUpdate
from app.db.models import Material, MaterialShare, PermissionEnum, ShareStatusEnum, User

def get_shares_for_material(db: Session, material_id: int) -> list[tuple[MaterialShare, User]]:
    return db.query(
        MaterialShare, User
    ).join(
        User, MaterialShare.user_id == User.id
    ).filter(
        MaterialShare.material_id == material_id,
    ).all()

def find_share_by_user_and_material(
    db: Session,
    material_id: int,
    user_id: int
) -> MaterialShare | None:
    return db.query(MaterialShare).filter(
        MaterialShare.material_id == material_id,
        MaterialShare.user_id == user_id
    ).first()

def get_share_by_id(db: Session, share_id: int) -> MaterialShare | None:
    return db.query(MaterialShare).filter(
        MaterialShare.id == share_id
    ).first()

def create_share(
    db: Session,
    material_id: int,
    user_id: int,
    permission: PermissionEnum,
) -> MaterialShare:
    new_share = MaterialShare(material_id=material_id, user_id=user_id, permission=permission)
    db.add(new_share)
    return new_share

def delete_share(db: Session, share: MaterialShare):
    db.delete(share)

def update_share_permissions(
    db: Session,
    material_id: int,
    updates: list[ShareUpdate],
):
    for update in updates:
        db.query(
            MaterialShare
        ).filter(
            MaterialShare.material_id == material_id,
            MaterialShare.user_id == update.user_id
        ).update({"permission": update.permission})

def get_pending_shares_for_user(db: Session, user_id: int) -> list[tuple[int, str, str]]:
    return db.query(
        MaterialShare.id, Material.name, User.email
    ).join(
        Material, MaterialShare.material_id == Material.id
    ).join(
         User, Material.owner_id == User.id
    ).filter(
        MaterialShare.user_id == user_id,
        MaterialShare.status == ShareStatusEnum.pending
    ).all()

def update_status(db: Session, share: MaterialShare, status: ShareStatusEnum):
    share.status = status