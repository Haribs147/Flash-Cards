from elasticsearch import Elasticsearch
from .config import settings

es_client = None

def get_es_client():
    if es_client is None:
        raise RuntimeError("Elasticsearch client is not initialized")
    return es_client

def connect_to_es():
    global es_client
    print("Connecting to Elasticsearch ...")
    es_client = Elasticsearch(
        [{"host": settings.ELASTICSEARCH_HOST, "port": settings.ELASTICSEARCH_PORT, "scheme": "http"}],
        basic_auth=(settings.ELASTICSEARCH_USERNAME, settings.ELASTICSEARCH_PASSWORD)
    )
    if not es_client.ping():
        raise ConnectionError("Failed to connect to Elasticsearch")
    
    print("Succesfully connected to Elasticsearch")
    create_view_events_index()

def create_view_events_index():
    index_name = "view_events"
    mapping = {
        "properties": {
            "user_id":{"type": "integer"},
            "set_id" :{"type": "integer"},
            "timestamp": {"type": "date"}
        }
    }

    #ignore 400 means it won't raise error if the index exists
    get_es_client().indices.create(index=index_name, mappings=mapping, ignore=400)
    print(f"Index {index_name} is running")

def close_es_connection():
    global es_client
    if es_client:
        print("Closing Elasticsearch connection")
        es_client.close()
        es_client = None
        print("Elasticsearch connection closed")