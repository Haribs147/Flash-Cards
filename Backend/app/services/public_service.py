from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.api.schemas import BasePublicSetOut, MostLikedSetsOut, MostViewedSetsOut, PublicSetSearchOut, TimePeriod
from app.repositories import elastic_repository, flashcard_set_repository, material_repository
from app.services.exceptions import ServiceError


def _get_cutoff_date(period: TimePeriod) -> datetime:
    now = datetime.now(timezone.utc)
    if period == TimePeriod.day:
        return now - timedelta(days=1)
    if period == TimePeriod.week:
        return now - timedelta(weeks=1)
    if period == TimePeriod.month:
        return now - timedelta(days=30)
    return now - timedelta(days=365)

class PublicSetService:
    def get_most_viewed(self, db: Session, period: TimePeriod) -> list[MostViewedSetsOut]:
        public_set_ids = flashcard_set_repository.get_public_set_ids(db)
        if not public_set_ids:
            return []
        
        cutoff_date = _get_cutoff_date(period)
        now = datetime.now(timezone.utc)
        
        try:
            response = elastic_repository.get_most_viewed(cutoff_date, now, public_set_ids)
        except Exception as e:
            raise ServiceError(f"Failed to get most viewed sets: {e}")

        buckets = response["aggregations"]["top_sets"]["buckets"]
        if not buckets:
            return []
        
        set_view_counts = {bucket["key"]: bucket["doc_count"] for bucket in buckets}
        set_ids = list(set_view_counts.keys())
        set_details = material_repository.get_material_details_batch(db, set_ids)

        results = [
            MostViewedSetsOut(
                id=id,
                name=name,
                description=description,
                creator=email,
                created_at=created_at,
                view_count=set_view_counts.get(id, 0)
            ) for id, name, description, email, created_at in set_details
        ]
        results.sort(key=lambda x: x.view_count, reverse=True)
        return results

    def get_most_liked(self, db: Session, period: TimePeriod) -> list[MostLikedSetsOut]:
        cutoff_date = _get_cutoff_date(period)
        top_sets_query = flashcard_set_repository.get_most_liked_sets(db, cutoff_date)
        if not top_sets_query:
            return []
        
        like_counts = {set_id: count for set_id, count in top_sets_query}
        set_ids = list(like_counts.keys())
        set_details = material_repository.get_material_details_batch(db, set_ids)
        
        results = [
            MostLikedSetsOut(
                id=id,
                name=name,
                description=description,
                creator=email,
                created_at=created_at,
                like_count=like_counts.get(id, 0)
            ) for id, name, description, email, created_at in set_details
        ]
        results.sort(key=lambda x: x.like_count, reverse=True)
        return results

    def get_recently_created(self, db: Session) -> list[BasePublicSetOut]:
        recent_sets_data = flashcard_set_repository.get_recently_created_sets(db)
        return [
            BasePublicSetOut(
                id=id,
                name=name,
                description=description,
                creator=email,
                created_at=created_at
            ) for id, name, description, created_at, email in recent_sets_data
        ]

    def search_public_sets(self, text_query: str) -> list[PublicSetSearchOut]:
        try:
            response = elastic_repository.search_public_sets(text_query)
        except Exception as e:
            raise ServiceError(f"Failed to get search: {e}")
        
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