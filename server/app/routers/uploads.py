from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Final

from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

ALLOWED_EXTENSIONS: Final[set[str]] = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}

STORAGE_MODE = (os.getenv("UPLOADS_STORAGE", "local") or "local").strip().lower()


def _normalize_extension(filename: str | None) -> str:
    _, ext = os.path.splitext(filename or "upload")
    return (ext or ".bin").lower()


def _assert_valid_extension(ext: str) -> None:
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only image files are allowed")


if STORAGE_MODE == "supabase":
    import requests

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE")
    SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")
    SUPABASE_PUBLIC_BASE = os.getenv("SUPABASE_PUBLIC_URL")
    SUPABASE_PATH_PREFIX = os.getenv("SUPABASE_STORAGE_PREFIX", "uploads/").lstrip("/")

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or not SUPABASE_BUCKET:
        raise RuntimeError(
            "SUPABASE_URL, SUPABASE_BUCKET, and SUPABASE_SERVICE_KEY must be set when UPLOADS_STORAGE=supabase"
        )

    if not SUPABASE_PUBLIC_BASE:
        SUPABASE_PUBLIC_BASE = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{SUPABASE_BUCKET}"

    def _supabase_upload_path(filename: str) -> str:
        return f"{SUPABASE_PATH_PREFIX}{filename}" if SUPABASE_PATH_PREFIX else filename

    @router.post("/uploads")
    async def upload_file(file: UploadFile = File(...)):
        ext = _normalize_extension(file.filename)
        _assert_valid_extension(ext)

        filename = f"{uuid.uuid4().hex}{ext}"
        dest_path = _supabase_upload_path(filename)
        contents = await file.read()
        content_type = file.content_type
        await file.close()

        # Supabase REST storage API requires the bucket name in the path
        url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{SUPABASE_BUCKET}/{dest_path}"
        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
        }
        if content_type:
            headers["Content-Type"] = content_type

        res = requests.post(url, headers=headers, params={"upsert": "true"}, data=contents)
        if not res.ok:
            detail = res.text
            raise HTTPException(status_code=500, detail=f"Upload failed: {detail}")

        public_url = f"{SUPABASE_PUBLIC_BASE.rstrip('/')}/{dest_path}"
        return {"url": public_url}

elif STORAGE_MODE == "s3":
    try:
        import boto3
        from botocore.exceptions import BotoCoreError, ClientError
    except Exception as exc:  # pragma: no cover - import guard
        raise RuntimeError("boto3 is required for S3 uploads; add it to requirements.txt") from exc

    S3_BUCKET = os.getenv("UPLOADS_S3_BUCKET") or os.getenv("AWS_S3_BUCKET")
    if not S3_BUCKET:
        raise RuntimeError("UPLOADS_S3_BUCKET (or AWS_S3_BUCKET) must be set when UPLOADS_STORAGE=s3")

    S3_KEY_PREFIX = os.getenv("UPLOADS_S3_PREFIX", "uploads/" ).lstrip("/")
    S3_PUBLIC_BASE = os.getenv("UPLOADS_S3_PUBLIC_BASE") or os.getenv("AWS_S3_PUBLIC_BASE")
    S3_REGION = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    S3_ACL = os.getenv("UPLOADS_S3_ACL", "public-read")
    S3_ENDPOINT = os.getenv("UPLOADS_S3_ENDPOINT") or os.getenv("AWS_S3_ENDPOINT")

    if not S3_PUBLIC_BASE:
        if S3_REGION:
            S3_PUBLIC_BASE = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com"
        else:
            S3_PUBLIC_BASE = f"https://{S3_BUCKET}.s3.amazonaws.com"

    client_kwargs = {"region_name": S3_REGION}
    if S3_ENDPOINT:
        client_kwargs["endpoint_url"] = S3_ENDPOINT
    s3_client = boto3.client("s3", **client_kwargs)

    @router.post("/uploads")
    async def upload_file(file: UploadFile = File(...)):
        ext = _normalize_extension(file.filename)
        _assert_valid_extension(ext)

        key = f"{S3_KEY_PREFIX}{uuid.uuid4().hex}{ext}"
        contents = await file.read()
        try:
            extra_args = {"ACL": S3_ACL}
            if file.content_type:
                extra_args["ContentType"] = file.content_type
            s3_client.put_object(Bucket=S3_BUCKET, Key=key, Body=contents, **extra_args)
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(status_code=500, detail="Upload failed") from exc
        finally:
            await file.close()

        url = f"{S3_PUBLIC_BASE.rstrip('/')}/{key}"
        return {"url": url}

else:  # default to local storage
    BASE_DIR = os.getenv("UPLOADS_DIR")
    if BASE_DIR:
        BASE_PATH = Path(BASE_DIR)
    else:
        BASE_PATH = Path(__file__).resolve().parent.parent / "static" / "uploads"
    BASE_PATH.mkdir(parents=True, exist_ok=True)

    PUBLIC_PREFIX = os.getenv("UPLOADS_PUBLIC_PATH", "/static/uploads")

    @router.post("/uploads")
    async def upload_file(file: UploadFile = File(...)):
        ext = _normalize_extension(file.filename)
        _assert_valid_extension(ext)

        filename = f"{uuid.uuid4().hex}{ext}"
        dest = BASE_PATH / filename
        try:
            with dest.open("wb") as out:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    out.write(chunk)
        finally:
            await file.close()

        url = f"{PUBLIC_PREFIX.rstrip('/')}/{filename}"
        return {"url": url}
