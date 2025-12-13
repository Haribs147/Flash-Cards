from datetime import datetime, timezone

from app.external.elastic import get_es_client

def log_view_event(
    set_id: int,
    user_id: int,
):
    try:
        es_client = get_es_client()
        es_client.index(
            index="view_events",
            document={
                "user_id": user_id,
                "set_id": set_id,
                "timestamp": datetime.now(timezone.utc)
            },
        )
    except Exception as e:
        print(f"Error logging event view_events to ES: {e}")

def index_set_tags(
    set_id: int, 
    document: dict
):
    try:
        es_client = get_es_client()
        es_client.index(
            index="flashcard_sets_tags",
            id=set_id,
            document=document,
        )
    except Exception as e:
        print(f"Error indexing set tags to ES: {e}")

def get_most_viewed(
    cutoff_date: datetime, now: datetime, public_sets_ids: list[int]
) -> dict:
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
                ],
                "filter": [
                    {
                        "terms":{
                            "set_id": public_sets_ids
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
        es_client = get_es_client()
        return es_client.search(index="view_events", body=query)
    except Exception as e:
        print(f"Error getting most viewed sets from ES: {e}")
        raise

def get_last_viewed_for_user(
    user_id: int
) -> dict:
    query = {
        "size": 100,
        "sort": [{"timestamp": "desc"}],
        "query": {
            "bool": {
                "must": [
                    {"match": {"user_id": user_id}}
                ]
            }
        }
    }
    try:
        es_client = get_es_client()
        return es_client.search(index="view_events", body=query)
    except Exception as e:
        print(f"Error getting last viewed sets from ES: {e}")
        raise

def search_public_sets(
    text_query: str
) -> dict:
    query = {
        "size": 20,
        "query": {
            "bool": {
                "must": {
                    "multi_match": {
                        "query": text_query,
                        "fields": ["name^3", "tags^2", "description"],
                        "fuzziness": "AUTO",
                        "tie_breaker": 0.3,
                    }
                },
                "filter": {
                    "term": {"is_public": True}
                }
            }
        }
    }

    try:
        es_client = get_es_client()
        return es_client.search(index="flashcard_sets_tags", body=query)
    except Exception as e:
        print(f"Error searching publics sets in ES: {e}")
        raise