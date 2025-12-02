from bs4 import BeautifulSoup
from elasticsearch import Elasticsearch
from sqlalchemy.orm import Session

from app.api.schemas import CopySet, FlashcardData, FlashcardSetOut, FlashcardSetUpdate, FlashcardSetUpdateAndCreate, SharedUser
from app.db.models import Material, PermissionEnum, User, VoteTypeEnum
from app.external.gemini import generate_tags
from app.repositories import comment_repository, elastic_repository, flashcard_set_repository, material_repository, share_repository, user_repository, vote_repository
from app.services.exceptions import NotFoundError, PermissionDeniedError
from app.services.material_service import MaterialService

class FlashcardSetService:
    def get_full_set_details(
        self,
        db: Session,
        set_id: int,
        current_user: User | None,
        material_service: MaterialService
    ) -> FlashcardSetOut:
        try:
            set_material = material_service.check_permission(
                db, set_id, current_user, PermissionEnum.viewer
            )
        except (NotFoundError, PermissionDeniedError) as e:
            raise e
        
        if set_material.item_type == "link":
            linked_id = set_material.linked_material_id
            set_material = material_repository.get_all_materials_by_id(db, linked_id)
            if not set_material:
                raise NotFoundError("Original material for this link not found")
            set_id = linked_id
        
        flashcard_set_model = material_repository.get_material_with_flashcards(db, set_id)
        if not flashcard_set_model or not flashcard_set_model.flashcard_set:
            raise NotFoundError("Flashcard set data not found")
        
        flashcard_set = flashcard_set_model.flashcard_set
        creator = user_repository.get_user_by_id(db, set_material.owner_id)
        shares_data = share_repository.get_shares_for_material(db, set_id)
        shared_with_list = [
            SharedUser(user_id=user.id, email=user.email, permission=share.permission)
            for share, user in shares_data
        ]

        upvotes = vote_repository.get_vote_count(db, set_id, "material", VoteTypeEnum.upvote)
        downvotes = vote_repository.get_vote_count(db, set_id, "material", VoteTypeEnum.downvote)

        user_vote = None
        user_id_for_logs = -1
        if current_user:
            user_vote = vote_repository.get_user_vote_type(db, set_id, "material", current_user.id)
            user_id_for_logs = current_user.id

        comments_data = comment_repository.get_comments_for_set(db, set_id, user_id_for_logs)
        elastic_repository.log_view_event(set_id=set_id, user_id=user_id_for_logs)

        return FlashcardSetOut(
            id = set_id,
            name = set_material.name,
            description = flashcard_set.description,
            is_public = flashcard_set.is_public,
            creator = creator.email,
            flashcards = flashcard_set.flashcards,
            shared_with = shared_with_list,
            upvotes = upvotes,
            downvotes = downvotes,
            user_vote = user_vote,
            comments_data = comments_data,
        )
            

    def create_set(
        self,
        db: Session,
        set_data: FlashcardSetUpdateAndCreate, 
        user: User
    ) -> Material:
        new_material = material_repository.create_new_material(
            db=db,
            name=set_data.name,
            item_type="set",
            owner_id=user.id,
            parent_id=set_data.parent_id,
        )
        flashcard_set_repository.create_flashcard_set(db, new_material.id, set_data)
        return new_material
    
    def update_set(
        self,
        db: Session,
        set_id: int, 
        update_data: FlashcardSetUpdate,
        user: User,
        material_service: MaterialService,
    ) -> Material:
        set_material = material_service.check_permission(db, set_id, user, PermissionEnum.editor)

        set_material.name = update_data.name
        db.commit()

        flashcard_set = flashcard_set_repository.get_set_by_id(db, set_id)
        if not flashcard_set:
            raise NotFoundError("Flashcard set data not ofund")
        
        flashcard_set_repository.update_flashcard_set(db, flashcard_set, update_data)
        db.refresh(set_material)
        return set_material
    
    def copy_set(self, db: Session, set_id: int, copy_data: CopySet, user: User, material_service: MaterialService) -> Material:
        original_material = material_service.check_permission(db, set_id, user, PermissionEnum.viewer)
        
        original_set_full = material_repository.get_material_with_flashcards(db, original_material.id)
        if not original_set_full or not original_set_full.flashcard_set:
            raise NotFoundError("Flashcardset not found")
        
        original_set = original_set_full.flashcard_set

        new_material = material_repository.create_new_material(
            db=db,
            name=f"{original_material.name} (copy)",
            item_type="set",
            owner_id=user.id,
            parent_id=copy_data.target_folder_id
        )
        
        set_data = FlashcardSetUpdateAndCreate(
            name=new_material.name,
            description=original_set.description,
            is_public=False,
            parent_id=copy_data.target_folder_id,
            flashcards=[
                FlashcardData(
                    front_content=card.front_content,
                    back_content=card.back_content
                ) for card in original_set.flashcards
            ]
        )
        
        flashcard_set_repository.create_flashcard_set(db, new_material.id, set_data)
        return new_material

    async def generate_and_save_tags_bg(self, set_id: int, db: Session, elastic_search: Elasticsearch):
        set_material = material_repository.get_material_with_flashcards(db, set_id)
        if not set_material or not set_material.flashcard_set:
            print(f"BG Task: Set {set_id} not found for tag generation.")
            return

        flashcard_set = set_material.flashcard_set
        flashcard_content = []
        for card in flashcard_set.flashcards:
            front_soup = BeautifulSoup(card.front_content, "html.parser")
            flashcard_content.append(front_soup.get_text(separator=" ", strip=True))
            back_soup = BeautifulSoup(card.back_content, "html.parser")
            flashcard_content.append(back_soup.get_text(separator=" ", strip=True))
        
        combined_content = " ".join(flashcard_content)

        tags = generate_tags(
            name=set_material.name,
            description=flashcard_set.description,
            flashcards_content=combined_content,
        )

        if not tags:
            print(f"No tags generated for set: {set_id}")

        owner = user_repository.get_user_by_id(db, set_material.owner_id)
        
        document = {
            "set_id": set_id,
            "name": set_material.name,
            "description": flashcard_set.description,
            "tags": tags,
            "is_public": flashcard_set.is_public,
            "creator_email": owner.email if owner else "Unknown",
            "created_at": set_material.created_at,
        }
        
        elastic_repository.index_set_tags(set_id, document)