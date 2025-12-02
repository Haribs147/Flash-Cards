from sqlalchemy.orm import Session

from app.api.schemas import PendingShareOut, ShareData, ShareUpdateData, SharedUser
from app.db.models import Material, ShareStatusEnum, User
from app.repositories import material_repository, share_repository, user_repository
from app.services.exceptions import ConflictError, NotFoundError, ValidationError
from app.services.material_service import MaterialService

class ShareService:
    def share_material(self, db: Session, item_id: int, share_data: ShareData, user: User, material_service: MaterialService) -> SharedUser:
        material_service.check_permission(db, item_id, user, "owner")
        
        user_to_share_with = user_repository.get_user_by_email(db, share_data.email)
        if not user_to_share_with:
            raise NotFoundError(f"User with email: {share_data.email} not found")
        if user_to_share_with.id == user.id:
            raise ValidationError("You cannot share set with yourself")
        
        existing_share = share_repository.find_share_by_user_and_material(db, item_id, user_to_share_with.id)
        if existing_share:
            raise ConflictError("This material is already shared with this user.")
        
        new_share = share_repository.create_share(db, item_id, user_to_share_with.id, share_data.permission)
        
        db.commit()
        db.refresh(new_share)
        
        return SharedUser(
            user_id=user_to_share_with.id,
            email=user_to_share_with.email,
            permission=new_share.permission
        )

    def revoke_share(self, db: Session, item_id: int, user_id_to_revoke: int, user: User, material_service: MaterialService):
        material_service.check_permission(db, item_id, user, "owner")
        
        share_to_delete = share_repository.find_share_by_user_and_material(db, item_id, user_id_to_revoke)
        if not share_to_delete:
            raise NotFoundError("This share doesn't exist.")
        
        share_repository.delete_share(db, share_to_delete)
        db.commit()

    def update_shares(self, db: Session, item_id: int, share_update_data: ShareUpdateData, user: User, material_service: MaterialService):
        material_service.check_permission(db, item_id, user, "owner")
        share_repository.update_share_permissions(db, item_id, share_update_data.updates)
        db.commit()

    def get_pending_shares(self, db: Session, user: User) -> list[PendingShareOut]:
        pending_shares_data = share_repository.get_pending_shares_for_user(db, user.id)
        return [
            PendingShareOut(
                share_id=share_id,
                material_name=material_name,
                sharer_email=sharer_email
            ) for share_id, material_name, sharer_email in pending_shares_data
        ]
        

    def accept_share(self, db: Session, share_id: int, user: User) -> Material:
        share = share_repository.get_share_by_id(db, share_id)
        if not share or share.user_id != user.id or share.status != ShareStatusEnum.pending:
            raise NotFoundError("Share not found")
        
        original_material = material_repository.get_all_materials_by_id(db, share.material_id)
        if not original_material:
            share_repository.delete_share(db, share) # Clean up orphan share
            db.commit()
            raise NotFoundError("Original material doesn't exist")
        
        link_material = material_repository.create_new_material(
            db=db,
            name=original_material.name,
            item_type="link",
            owner_id=user.id,
            parent_id=None,
            linked_material_id=original_material.id
        )
        share_repository.update_status(db, share, ShareStatusEnum.accepted)
        
        db.commit()
        db.refresh
        
        return link_material

    def reject_share(self, db: Session, share_id: int, user: User):
        share_to_delete = share_repository.get_share_by_id(db, share_id)
        if not share_to_delete or share_to_delete.user_id != user.id or share_to_delete.status != ShareStatusEnum.pending:
            raise NotFoundError("Share not found")
        
        share_repository.delete_share(db, share_to_delete)
        db.commit()