from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import routes
from pathlib import Path

UPLOAD_DIR = Path("./uploaded_files")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI()
app.include_router(routes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
