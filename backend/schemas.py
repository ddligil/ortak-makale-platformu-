from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Article schemas
class ArticleBase(BaseModel):
    title: str
    content: str
    is_public: bool = False

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_public: Optional[bool] = None

class ArticleResponse(ArticleBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Collaboration schemas
class CollaborationCreate(BaseModel):
    user_id: int

class CollaborationResponse(BaseModel):
    id: int
    article_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Friendship schemas
class FriendshipCreate(BaseModel):
    friend_id: int

class FriendshipResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True 