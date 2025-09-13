from fastapi import APIRouter, UploadFile, File
from fastapi import HTTPException
import os
import uuid

router = APIRouter()

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
BASE_DIR = os.path.abspath(BASE_DIR)
os.makedirs(BASE_DIR, exist_ok=True)

@router.post("/uploads")
async def upload_file(file: UploadFile = File(...)):
    # 제한: 간단히 이미지 확장자만
    name, ext = os.path.splitext(file.filename or "upload")
    ext = (ext or ".bin").lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    fn = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(BASE_DIR, fn)
    try:
        with open(dest, "wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
    finally:
        await file.close()

    # public URL
    url = f"/static/uploads/{fn}"
    return {"url": url}

