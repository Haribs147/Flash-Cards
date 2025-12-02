from sqlalchemy.orm import Session
from sqlalchemy import case

from app.api.schemas import LastViewedSet, LastViewedSetsOut
from app.db.models import Material, User
from app.repositories import elastic_repository, material_repository
from app.services.exceptions import ServiceError


class UserService:
    def get_last_viewed_sets(self, db: Session, user: User) -> LastViewedSetsOut:
        try:
            response = elastic_repository.get_last_viewed_for_user(user.id)
        except Exception as e:
            raise ServiceError("Could not retrieve last viewed sets")
        
        latest_views = {}
        ordered_set_ids = []
        for hit in response['hits']['hits']:
            source = hit['_source']
            set_id = source['set_id']
            if set_id not in latest_views:
                latest_views[set_id] = source['timestamp']
                ordered_set_ids.append(set_id)

        if not ordered_set_ids:
            return LastViewedSetsOut(sets=[])
        
        order_by_map = {set_id: index for index, set_id in enumerate(ordered_set_ids)}
        order_by_case = case(order_by_map, value=Material.id)

        sets_details = db.query(
            Material.id,
            Material.name,
            User.email,
        ).join(
            User, Material.owner_id == User.id
        ).filter(
            Material.id.in_(ordered_set_ids), 
            Material.item_type == "set"
        ).order_by(order_by_case).all()

        last_viewed_sets = [
            LastViewedSet(
                id=set_id,
                name=set_name,
                author_initial=author_email[0].upper(),
                viewed_at=latest_views[set_id]
            ) for set_id, set_name, author_email in sets_details
        ]
        return LastViewedSetsOut(sets=last_viewed_sets)