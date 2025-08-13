# routes/auth.py
from fastapi import APIRouter, Request
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from dotenv import load_dotenv
from pathlib import Path
from jose import jwt
import os, time

# 프로젝트 루트의 .env를 명시적으로 로드
ROOT_DOTENV = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ROOT_DOTENV)

router = APIRouter()
config = Config(".env")
oauth = OAuth(config)

FRONT = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "change_me")
JWT_ALG = os.getenv("JWT_ALGORITHM", "HS256")

# Google
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"}
)

# Naver
oauth.register(
    name="naver",
    client_id=os.getenv("NAVER_CLIENT_ID"),
    client_secret=os.getenv("NAVER_CLIENT_SECRET"),
    authorize_url="https://nid.naver.com/oauth2.0/authorize",
    access_token_url="https://nid.naver.com/oauth2.0/token",
    userinfo_endpoint="https://openapi.naver.com/v1/nid/me",
    client_kwargs={"scope": "name email"},
)

# Kakao
oauth.register(
    name="kakao",
    client_id=os.getenv("KAKAO_CLIENT_ID"),
    client_secret=os.getenv("KAKAO_CLIENT_SECRET"),
    authorize_url="https://kauth.kakao.com/oauth/authorize",
    access_token_url="https://kauth.kakao.com/oauth/token",
    userinfo_endpoint="https://kapi.kakao.com/v2/user/me",
    token_endpoint_auth_method="client_secret_post",
    client_kwargs={"scope": "profile_nickname",
    "token_endpoint_auth_method": "client_secret_post"},
)

def create_jwt_token(user_info: dict):
    payload = {
        "sub": str(user_info.get("sub") or user_info.get("id")),
        "name": user_info.get("name"),
#         "email": user_info.get("email"),
        "exp": int(time.time()) + 3600
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

@router.get("/auth/google")
async def login_google(request: Request):
    redirect_uri = request.url_for("auth_google_callback")
    print("DEBUG redirect_uri =>", redirect_uri)
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback")
async def auth_google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo") or {}
    jwt_token = create_jwt_token({
        "id": user_info.get("sub") or user_info.get("id"),
        "name": user_info.get("name"),
        "email": user_info.get("email"),
    })
    return RedirectResponse(f"{FRONT}/auth/popup-callback?token={jwt_token}")

@router.get("/auth/naver")
async def login_naver(request: Request):
    redirect_uri = request.url_for("auth_naver_callback")
    return await oauth.naver.authorize_redirect(request, redirect_uri)

@router.get("/auth/naver/callback")
async def auth_naver_callback(request: Request):
    token = await oauth.naver.authorize_access_token(request)
    resp = await oauth.naver.get("https://openapi.naver.com/v1/nid/me", token=token)
    profile = resp.json().get("response", {})  # id, name, email 등
    jwt_token = create_jwt_token({
        "id": profile.get("id"),
        "name": profile.get("name"),
        "email": profile.get("email"),
    })
    return RedirectResponse(f"{FRONT}/auth/popup-callback?token={jwt_token}")

@router.get("/auth/kakao")
async def login_kakao(request: Request):
    redirect_uri = request.url_for("auth_kakao_callback")
    return await oauth.kakao.authorize_redirect(request, redirect_uri)

@router.get("/auth/kakao/callback")
async def auth_kakao_callback(request: Request):
    token = await oauth.kakao.authorize_access_token(request)
    resp = await oauth.kakao.get("https://kapi.kakao.com/v2/user/me", token=token)
    data = resp.json()
    acc = data.get("kakao_account", {})
    name = (acc.get("profile") or {}).get("nickname")
#     email = acc.get("email")
    jwt_token = create_jwt_token({"id": data.get("id"), "name": name})
    return RedirectResponse(f"{FRONT}/auth/popup-callback?token={jwt_token}")
