from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RegisterIn(BaseModel):
    email: str
    password: str
    display_name: str

class LoginIn(BaseModel):
    email: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserMe(BaseModel):
    id: int
    email: str
    display_name: str
    class Config:
        from_attributes = True

class PostBase(BaseModel):
    title: str
    cover: Optional[str] = None
    content_html: str
    images: Optional[List[str]] = None

class PostCreate(PostBase): pass
class PostUpdate(BaseModel):
    title: Optional[str] = None
    cover: Optional[str] = None
    content_html: Optional[str] = None
    images: Optional[List[str]] = None

class PostOut(PostBase):
    id: int
    author: str
    date: datetime
    class Config:
        from_attributes = True
