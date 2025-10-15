from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.elasticsearch import ElasticsearchInstrumentor

from .database import engine

def setup_telemetry(app):

    resource = Resource(attributes={
        "service.name": "flashcard_backend"
    })

    provider = TracerProvider(resource=resource)

    exporter = OTLPSpanExporter(endpoint="http://localhost:8200/v1/traces")

    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)

    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument(engine=engine)
    ElasticsearchInstrumentor().instrument()

    print("OpenTelemetry setup succesfully")