from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routes import game, ml

app = FastAPI(
    title="The Forgettery API",
    description="Machine Learning Spaced Repetition Game API",
    version="0.1.0"
)

@app.on_event("startup")
async def startup_event():
    init_db()

app.include_router(game.router)
app.include_router(ml.router)

# Professional CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://localhost:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "forgettery-backend",
        "version": "0.1.0"
    }

@app.get("/")
async def root():
    return {
        "message": "The Forgettery API. Access /docs for interactive documentation.",
        "docs_url": "/docs"
    }
