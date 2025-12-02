from sqlalchemy.orm import Session

from app.api.schemas import FolderCreate, MaterialUpdate
from app.db.models import Material, PermissionEnum, ShareStatusEnum, User
from app.repositories import material_repository, share_repository
from app.services.exceptions import NotFoundError, PermissionDeniedError, ValidationError


class MaterialService:
    def check_permission(
        self,
        db: Session,
        item_id: int, 
        user: User | None,
        req_access: PermissionEnum | str,
    ) -> Material:
        material_info = material_repository.get_material_with_public_status(db, item_id)
        if not material_info:
            raise NotFoundError("Material not found")
        
        material, is_public = material_info
        if is_public and req_access == PermissionEnum.viewer:
            return material

        if not user:
            raise PermissionDeniedError("Authentication required")
        
        if material.owner_id == user.id:
            return material

        if req_access == "owner":
            raise PermissionDeniedError("Insufficient permisssion, owner required")
        
        share = share_repository.find_share_by_user_and_material(db, item_id, user.id)

        if not share or share.status != ShareStatusEnum.accepted:
            raise PermissionDeniedError("Not authorized to acess this material")
        
        user_permission = share.permission
        if req_access == PermissionEnum.viewer and user_permission in [PermissionEnum.viewer, PermissionEnum.editor]:
            return material
        
        if req_access == PermissionEnum.editor and user_permission == PermissionEnum.editor:
            return material
        
        raise PermissionDeniedError("Insufficient permission")
    
    def create_folder(
        self,
        db: Session,
        folder_data: FolderCreate,
        user: User
    ) -> Material:
        return material_repository.create_new_material(
            db=db,
            name=folder_data.name,
            item_type="folder",
            owner_id=user.id,
            parent_id=folder_data.parent_id,
        )
    
    def update_material(
        self,
        db: Session,
        item_id: int,
        update_data: MaterialUpdate,
        user: User,
    ) -> Material:
        item_to_update = self.check_permission(
            db,
            item_id,
            user,
            "owner",
        )

        if "parent_id" in update_data.model_dump(exclude_unset=True):
            if item_id == update_data.parent_id:
                raise ValidationError("Cannot move a folder into itself")
        
        return material_repository.update_material(
            db,
            item_to_update,
            update_data,
        )
    
    def delete_material(
        self,
        db: Session,
        item_id: int,
        user: User,
    ) -> list[int]:
        item_to_delete = self.check_permission(
            db,
            item_id,
            user,
            "owner",
        )

        if item_to_delete.item_type == "link":
            share = share_repository.find_share_by_user_and_material(
                db, item_to_delete.linked_material_id, user.id
            )

            if share:
                share_repository.delete_share(db, share)
            material_repository.delete_material(db, item_to_delete)
            return [item_id]

        all_ids_to_delete = material_repository.get_all_material_child_ids(db, item_id)
        material_repository.delete_material(db, item_to_delete)
        return all_ids_to_delete