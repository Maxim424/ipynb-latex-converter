from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import routes
from pathlib import Path
import asyncio
from .services import cleanup_manager

UPLOAD_DIR = Path("./uploaded_files")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI()
app.include_router(routes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def start_cleanup_task():
    # Запуск фоновой задачи при старте приложения
    asyncio.create_task(cleanup_manager.cleanup_old_sessions())
