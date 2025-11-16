from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session, joinedload

from app.api.schemas import MaterialUpdate
from app.db.models import FlashcardSet, Material

def get_all_materials_for_user(db: Session, user_id: int) -> list[Material]:
    return db.query(Material).filter(Material.owner_id == user_id).all()

def get_all_materials_by_id(db: Session, material_id: int) -> Material:
    return db.query(Material).filter(Material.id == material_id).first()

def get_material_with_flashcards(db: Session, material_id: int) -> Material | None:
    return db.query(Material).options(
        joinedload(Material.flashcard_set).joinedload(FlashcardSet.flashcards)
    ).filter(Material.id == material_id).first()

def get_material_with_public_status(db: Session, material_id: int) -> tuple[Material, bool] | None:
    result = db.query(
        Material,
        FlashcardSet.is_public
    ).outerjoin(
            FlashcardSet,
            Material.id == FlashcardSet.id
    ).filter(Material.id == material_id).first()

    if not result:
        return None
    
    material, is_public = result
    return material, (is_public or False)

def create_new_material(
    db: Session,
    name: str,
    item_type: str, 
    owner_id: int, 
    parent_id: Optional[int] = None,
    linked_material_id: Optional[int] = None
) -> Material:
    new_material = Material(
        name=name,
        item_type=item_type,
        owner_id=owner_id,
        parent_id=parent_id,
        linked_material_id=linked_material_id,
    )

    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    return new_material

def update_material(
    db: Session,
    material: Material,
    update_data: MaterialUpdate, 
) -> Material:
    update_dict = update_data.model_dump(exclude_unset=True)

    if "name" in update_dict:
        material.name = update_data.name

    if "parent_id" in update_dict:
        material.parent_id = update_data.parent_id

    db.commit()
    db.refresh(material)
    return material

def delete_material(
    db: Session,
    material: Material,
) -> Material:
    db.delete(material)
    db.commit()

def get_all_material_child_ids(db: Session, item_id: int) -> list[int]:
    ids_to_delete = set()
    queue = [item_id]

    while queue:
        current_id = queue.pop(0)
        ids_to_delete.add(current_id)

        children = db.query(Material).filter(Material.parent_id == current_id).all()
        for child in children:
            queue.append(child.id)

    return list(ids_to_delete)

def get_material_details_batch(
    db: Session,
    set_ids: list[int],
) -> list[tuple[int, str, str, str, datetime]]:
    return db.query(
        Material.id,
        Material.name,
        FlashcardSet.description,
        User.email,
        Material.created_at
    ).join(
        User, Material.owner_id == User.id
    ).join(
        FlashcardSet, Material.id == FlashcardSet.id
    ).filter(
        Material.id.in_(set_ids),
        Material.item_type == "set"
    ).all()