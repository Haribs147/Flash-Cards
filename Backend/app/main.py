from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError 

from pydantic import BaseModel

from app.api.routes import comments, materials, media, sets, shares, users, comments, auth
from app.core.config import settings
from app.core.telemetry import setup_telemetry
from app.external.elastic import close_es_connection, connect_to_es
from app.external.minio import initialize_minio

import enum

import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup")
    # setup_telemetry(app)
    initialize_minio()
    connect_to_es()
    yield
    print("Application shutdown")
    close_es_connection()

app = FastAPI(title="Flashcard_backend", lifespan=lifespan)

# This setup telemetry has to be here as the FastAPI instrumentor for telemtry doesn't work in the lifespan otherwise
setup_telemetry(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True, allow_methods=["*"], 
    allow_headers=["*"],
)

class CsrfSettings(BaseModel):
    secret_key: str = settings.CSRF_SECRET_KEY

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

@app.exception_handler(CsrfProtectError)
def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return Response(status_code=exc.status_code, content=exc.message)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(materials.router)
app.include_router(sets.router)
app.include_router(shares.router)
app.include_router(comments.router)
app.include_router(media.router)