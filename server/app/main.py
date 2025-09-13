# server/app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .routers import posts, auth
from .routers import stats as stats_router
from .routers import culture as culture_router
from .routers import kopis as kopis_router
from .routers import uploads as uploads_router
from .routers import agency_trips as agency_trips_router
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
load_dotenv()

import os
import httpx
import json

app = FastAPI(title="Read&Lead API")

# CORS origins: from env FRONTEND_ORIGINS (comma-separated) + sensible dev defaults
_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_env_origins = os.getenv("FRONTEND_ORIGINS", "")
allow_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] or _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 이웃 글
app.include_router(posts.router, prefix="/api/neighbor-posts", tags=["neighbor-posts"])
# ✅ 로그인/회원가입
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(stats_router.router, prefix="/api", tags=["stats"])  # /api/users/count
app.include_router(culture_router.router, prefix="/api/culture", tags=["culture"])  # /api/culture/nearby
app.include_router(kopis_router.router, prefix="/api/kopis", tags=["kopis"])  # /api/kopis/perform
app.include_router(uploads_router.router, prefix="/api", tags=["uploads"])  # /api/uploads
app.include_router(agency_trips_router.router, prefix="/api/agency-trips", tags=["agency-trips"])  # /api/agency-trips/list

# static mount for uploaded files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/api/ping")
def ping():
    return {"ok": True}


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

@app.post("/api/travel/plan")
async def make_plan(req: Request):
    body = await req.json()
    if not OPENAI_API_KEY:
        return JSONResponse({"error": "OPENAI_API_KEY not set"}, status_code=500)

    # 요청 본문 정리
    meta = {
        "title": body.get("title", ""),
        "startDate": body.get("startDate", ""),
        "endDate": body.get("endDate", ""),
        "people": body.get("people", 0),
        "notes": body.get("notes", ""),
        "themes": body.get("themes", []),
    }
    book = {"title": body.get("sourceBookTitle", "")}

    system = "You are a travel planner that designs itineraries inspired by a given book. Return valid JSON."
    user_payload = {
        "instruction": "책과 연결된 여행 일정을 만들어줘.",
        "book": {"title": body.get("sourceBookTitle", "")},
        "meta": {
            "title": body.get("title", ""),
            "startDate": body.get("startDate", ""),
            "endDate": body.get("endDate", ""),
            "people": body.get("people", 0),
            "notes": body.get("notes", ""),
            "themes": body.get("themes", []),
        },
        "constraints": {"style": "practical, accessible, safety-aware", "outputLanguage": "ko"},
    }
    json_schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "planTitle": {"type": "string"},
            "summary": {"type": "string"},
            "days": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "date": {"type": "string"},
                        "themeFocus": {"type": "string"},
                        "morning": {"type": "string"},
                        "afternoon": {"type": "string"},
                        "evening": {"type": "string"},
                        "foodSuggestions": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "notes": {"type": "string"}
                    },
                    # ⛳️ properties의 모든 키를 required에 '그대로' 포함
                    "required": [
                        "date",
                        "themeFocus",
                        "morning",
                        "afternoon",
                        "evening",
                        "foodSuggestions",
                        "notes"
                    ]
                }
            },
            "packingTips": {
                "type": "array",
                "items": {"type": "string"}
            },
            "cautions": {
                "type": "array",
                "items": {"type": "string"}
            }
        },
        # ⛳️ 최상위도 마찬가지로 모든 키 나열
        "required": ["planTitle", "summary", "days", "packingTips", "cautions"]
    }

    openai_req = {
        "model": "gpt-4o-mini",  # 또는 "gpt-4o-2024-08-06"
        "input": [
            {
                "role": "system",
                "content": [
                    {"type": "input_text", "text": system}
                ],
            },
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": json.dumps({
                        "instruction": "책과 연결된 여행 일정을 만들어줘.",
                        "book": book,
                        "meta": meta,
                        "constraints": {
                            "style": "practical, accessible, safety-aware",
                            "outputLanguage": "ko"
                        }
                    }, ensure_ascii=False)}
                ],
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "TravelPlan",
                "schema": json_schema,
                "strict": True
            }
        },
        "temperature": 0.6,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=openai_req,
        )

    if r.status_code >= 400:
        return JSONResponse({"detail": r.text}, status_code=r.status_code)

    data = r.json()
    content = (
        data.get("output_text")
        or (data.get("choices", [{}])[0].get("message", {}).get("content"))
        or (data.get("output", [{}])[0].get("content", [{}])[0].get("text"))
    )

    try:
        plan = json.loads(content) if isinstance(content, str) else content
    except Exception:
        plan = {"raw": content}

    return JSONResponse(plan, status_code=200)