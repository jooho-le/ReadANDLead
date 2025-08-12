from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import books
from routes import culture, kopis, library

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 기존
app.include_router(books.router)

# 신규
app.include_router(culture.router, prefix="/culture", tags=["culture"])
app.include_router(kopis.router, prefix="/kopis", tags=["kopis"])
app.include_router(library.router, prefix="/library", tags=["library"])
