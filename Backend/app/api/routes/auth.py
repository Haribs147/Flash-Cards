from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_csrf_protect import CsrfProtect
from sqlalchemy.orm import Session

from app.services.auth_service import AuthService
from app.services.exceptions import ConflictError, PermissionDeniedError, ValidationError
from app.api.schemas import LoginResponse, UserCreate
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_MINUTES, create_acces_token, create_refresh_token, get_current_user_from_refresh_token, get_password_hash, validate_csrf, verify_password
from app.db.database import get_db
from app.db.models import User


router = APIRouter(tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    response: Response,
    user_in: UserCreate,
    db: Session = Depends(get_db),
    csrf_protect: CsrfProtect = Depends(),
    auth_service: AuthService = Depends(AuthService)
):
    try:
        new_user = auth_service.register_user(db, user_in)
    except (ValidationError, ConflictError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)

    access_token = create_acces_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})

    csrf_token, signed_csrf_token = csrf_protect.generate_csrf_tokens()
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="strict", path="/refresh", max_age=REFRESH_TOKEN_EXPIRE_MINUTES * 60)
    csrf_protect.set_csrf_cookie(signed_csrf_token, response)

    return {"message": "User registered successfully", "csrf_token": csrf_token}

@router.post("/login", response_model=LoginResponse)
def login_for_access_token(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
    csrf_protect: CsrfProtect = Depends(),
    auth_service: AuthService = Depends(AuthService)
):
    try:
        user = auth_service.login_user(db, form_data)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.detail)
    
    access_token = create_acces_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    csrf_token, signed_csrf_token = csrf_protect.generate_csrf_tokens()
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", path="/refresh", max_age=REFRESH_TOKEN_EXPIRE_MINUTES * 60)
    csrf_protect.set_csrf_cookie(signed_csrf_token, response)

    return{"message": "Login succesfull", "csrf_token": csrf_token, "user": user}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token", path="/refresh")
    response.delete_cookie(key="fastapi-csrf-token")

    return {"message": "Logout succesful"}

@router.post("/refresh")
def refresh_token(response: Response, csrf_protect: CsrfProtect = Depends(), current_user: User = Depends(get_current_user_from_refresh_token)):
    new_access_token = create_acces_token(data={"sub": current_user.email})
    csrf_token, signed_csrf_token = csrf_protect.generate_csrf_tokens()
    response.set_cookie(key="access_token", value=new_access_token, httponly=True, secure=False, samesite="lax", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    csrf_protect.set_csrf_cookie(signed_csrf_token, response)

    return{"message": "Access token refreshed succesfully", "csrf_token": csrf_token}
