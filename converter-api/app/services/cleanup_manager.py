import asyncio
from pathlib import Path
import shutil
import time

UPLOAD_DIR = Path("./uploaded_files")
SESSION_EXPIRATION_MINUTES = 30
CHECK_INTERVAL_SECONDS = 60

async def cleanup_old_sessions():
    while True:
        now = time.time()

        for session_dir in UPLOAD_DIR.iterdir():
            if session_dir.is_dir():
                last_modified = session_dir.stat().st_mtime
                age_minutes = (now - last_modified) / 60

                if age_minutes > SESSION_EXPIRATION_MINUTES:
                    try:
                        shutil.rmtree(session_dir)
                        print(f"Удалена устаревшая сессия: {session_dir}")
                    except Exception as e:
                        print(f"Ошибка при удалении {session_dir}: {e}")

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)
