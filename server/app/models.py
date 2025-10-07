from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from .database import Base

KST = timezone(timedelta(hours=9))

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    posts = relationship("NeighborPost", back_populates="author", cascade="all, delete")

class NeighborPost(Base):
    __tablename__ = "neighbor_posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    cover = Column(String, nullable=True)
    content_html = Column(Text, nullable=False)
    images = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=lambda: datetime.now(KST), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(KST), onupdate=lambda: datetime.now(KST), nullable=False)
    author = relationship("User", back_populates="posts")
