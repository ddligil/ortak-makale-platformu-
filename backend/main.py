from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import uvicorn
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from data_storage import storage

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: str

class ArticleCreate(BaseModel):
    title: str
    content: str
    is_public: bool = False

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_public: Optional[bool] = None

class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    is_public: bool
    created_at: str
    updated_at: str

class CollaborationCreate(BaseModel):
    user_id: int

class FriendshipCreate(BaseModel):
    friend_id: int

app = FastAPI(title="Ortak Makale Platformu", version="1.0.0")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Güvenlik
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Yardımcı fonksiyonlar
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Geçersiz token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")
    
    user = storage.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    return user

# Routes
@app.post("/register", response_model=UserResponse)
def register(user: UserCreate):
    try:
        # Yeni kullanıcı oluştur
        hashed_password = get_password_hash(user.password)
        db_user = storage.create_user(user.username, user.email, hashed_password)
        return UserResponse(**db_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
def login(user_credentials: UserLogin):
    user = storage.get_user_by_email(user_credentials.email)
    if not user or not verify_password(user_credentials.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Geçersiz email veya şifre")
    
    access_token = create_access_token(data={"sub": user['id']})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/profile", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@app.post("/articles", response_model=ArticleResponse)
def create_article(article: ArticleCreate, current_user: dict = Depends(get_current_user)):
    db_article = storage.create_article(
        title=article.title,
        content=article.content,
        author_id=current_user['id'],
        is_public=article.is_public
    )
    return ArticleResponse(**db_article)

@app.get("/articles", response_model=List[ArticleResponse])
def get_articles(
    current_user: dict = Depends(get_current_user),
    public_only: bool = False
):
    if public_only:
        articles = storage.get_public_articles()
    else:
        # Kullanıcının kendi makaleleri ve işbirliği yaptığı makaleler
        articles = storage.get_user_articles(current_user['id'])
    
    return [ArticleResponse(**article) for article in articles]

@app.get("/articles/{article_id}", response_model=ArticleResponse)
def get_article(article_id: int, current_user: dict = Depends(get_current_user)):
    article = storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    
    # Erişim kontrolü
    if not article['is_public'] and article['author_id'] != current_user['id']:
        if not storage.is_collaborator(article_id, current_user['id']):
            raise HTTPException(status_code=403, detail="Bu makaleye erişim izniniz yok")
    
    return ArticleResponse(**article)

@app.put("/articles/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int, 
    article_update: ArticleUpdate, 
    current_user: dict = Depends(get_current_user)
):
    article = storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")

    # Yetki kontrolü
    if article['author_id'] != current_user['id']:
        if not storage.is_collaborator(article_id, current_user['id']):
            raise HTTPException(status_code=403, detail="Bu makaleyi düzenleme izniniz yok")

    # Güncelleme
    update_data = article_update.model_dump(exclude_unset=True)
    updated_article = storage.update_article(article_id, **update_data)

    # History kaydet
    if 'content' in update_data:
        storage.add_article_history(
            article_id=article_id,
            user_id=current_user['id'],
            action='edit',
            content=update_data['content'],
            old_content=article['content']
        )
        
        # İşbirlikçilere bildirim gönder
        collaborators = storage.get_article_collaborators(article_id)
        for collaborator in collaborators:
            if collaborator['id'] != current_user['id']:  # Kendine bildirim gönderme
                storage.create_notification(
                    user_id=collaborator['id'],
                    type="article_update",
                    title="Makale Güncellendi",
                    message=f"'{article['title']}' makalesi {current_user['username']} tarafından güncellendi",
                    data={"article_id": article_id, "article_title": article['title'], "updater_id": current_user['id']}
                )

    return ArticleResponse(**updated_article)

@app.post("/articles/{article_id}/collaborate")
def add_collaborator(
    article_id: int,
    collaboration: CollaborationCreate,
    current_user: dict = Depends(get_current_user)
):
    article = storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    
    if article['author_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Sadece makale sahibi işbirlikçi ekleyebilir")
    
    # Kullanıcıyı bul
    collaborator = storage.get_user_by_id(collaboration.user_id)
    if not collaborator:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    # İşbirlikçi ekle
    if storage.add_collaborator(article_id, collaboration.user_id):
        # Bildirim gönder
        storage.create_notification(
            user_id=collaboration.user_id,
            type="collaboration_invite",
            title="Yeni İşbirlikçi Daveti",
            message=f"'{article['title']}' makalesine işbirlikçi olarak eklendiniz",
            data={"article_id": article_id, "article_title": article['title']}
        )
        return {"message": "İşbirlikçi eklendi"}
    else:
        raise HTTPException(status_code=400, detail="Bu kullanıcı zaten işbirlikçi")

@app.post("/friends")
def add_friend(
    friendship: FriendshipCreate,
    current_user: dict = Depends(get_current_user)
):
    # Kendini arkadaş olarak ekleyemez
    if friendship.friend_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Kendinizi arkadaş olarak ekleyemezsiniz")
    
    # Kullanıcı var mı kontrol et
    friend = storage.get_user_by_id(friendship.friend_id)
    if not friend:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    # Arkadaşlık ekle
    if storage.add_friend(current_user['id'], friendship.friend_id):
        # Bildirim gönder
        storage.create_notification(
            user_id=friendship.friend_id,
            type="friend_request",
            title="Yeni Arkadaşlık İsteği",
            message=f"{current_user['username']} size arkadaşlık isteği gönderdi",
            data={"requester_id": current_user['id'], "requester_username": current_user['username']}
        )
        return {"message": "Arkadaş eklendi"}
    else:
        raise HTTPException(status_code=400, detail="Zaten arkadaşsınız")

@app.get("/users/search")
def search_users(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    users = storage.search_users(query, current_user['id'])
    return users

@app.get("/articles/{article_id}/collaborators")
def get_article_collaborators(
    article_id: int,
    current_user: dict = Depends(get_current_user)
):
    article = storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    
    # Erişim kontrolü
    if not article['is_public'] and article['author_id'] != current_user['id']:
        if not storage.is_collaborator(article_id, current_user['id']):
            raise HTTPException(status_code=403, detail="Bu makaleye erişim izniniz yok")
    
    collaborators = storage.get_article_collaborators(article_id)
    return collaborators

@app.get("/friends")
def get_friends(current_user: dict = Depends(get_current_user)):
    friends = storage.get_user_friends(current_user['id'])
    return friends

# Notification endpoints
@app.get("/notifications")
def get_notifications(
    current_user: dict = Depends(get_current_user),
    unread_only: bool = False
):
    notifications = storage.get_user_notifications(current_user['id'], unread_only)
    return notifications

@app.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    success = storage.mark_notification_read(notification_id, current_user['id'])
    if not success:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    return {"message": "Bildirim okundu olarak işaretlendi"}

@app.put("/notifications/read-all")
def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    success = storage.mark_all_notifications_read(current_user['id'])
    return {"message": "Tüm bildirimler okundu olarak işaretlendi"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080) 