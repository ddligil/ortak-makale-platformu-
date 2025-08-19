import os
from dotenv import load_dotenv
import openai
import uvicorn
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from jose import exceptions as jose_exceptions
from passlib.context import CryptContext
from pydantic import BaseModel

from data_storage import storage

# .env dosyasını yükle
load_dotenv()

# OpenAI client'ı başlat
openai.api_key = os.getenv("OPENAI_API_KEY")

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

class AIAnalysisRequest(BaseModel):
    content: str
    analysis_type: str  # "summary", "question", "contribution_analysis"

class AIQuestionRequest(BaseModel):
    content: str
    question: str

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
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

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
    # Sub field'ı string olarak set et
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Geçersiz token")
        user_id = int(user_id_str)  # String'den int'e çevir
    except Exception as e:
        print(f"Token decode error: {e}")  # Debug için
        raise HTTPException(status_code=401, detail="Geçersiz token")
    
    user = storage.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    return user

# AI Yardımcı fonksiyonları
def analyze_article_content(content: str, analysis_type: str) -> str:
    """Makale içeriğini AI ile analiz eder"""
    try:
        if analysis_type == "summary":
            prompt = f"""Aşağıdaki makaleyi Türkçe olarak özetle. Ana noktaları, konuları ve sonuçları belirt:

Makale:
{content}

Özet:"""
        
        elif analysis_type == "contribution_analysis":
            prompt = f"""Bu makalede kim hangi kısmı yazmış, analiz et. Kullanıcı etiketlerini ([username - timestamp]) kullanarak her kullanıcının katkısını özetle:

Makale:
{content}

Katkı Analizi:"""
        
        else:
            return "Geçersiz analiz türü"

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Sen bir makale analiz uzmanısın. Türkçe cevap ver."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        return f"AI analizi sırasında hata oluştu: {str(e)}"

def answer_question(content: str, question: str) -> str:
    """Makale hakkında soru sorar ve cevap verir"""
    try:
        prompt = f"""Aşağıdaki makaleyi oku ve sorulan soruyu Türkçe olarak cevapla:

Makale:
{content}

Soru: {question}

Cevap:"""

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Sen bir makale analiz uzmanısın. Verilen makaleyi okuyup soruları Türkçe olarak cevapla."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        return f"Soru cevaplanırken hata oluştu: {str(e)}"

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
    
    # Versiyon kontrolü için user_id ekle
    if 'content' in update_data:
        update_data['user_id'] = current_user['id']
        update_data['version_note'] = f"Versiyon {article.get('current_version', 1) + 1}"
    
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

# Versiyon kontrol sistemi endpoint'leri
@app.get("/articles/{article_id}/versions")
def get_article_versions(
    article_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Bir makalenin tüm versiyonlarını getir"""
    article = storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    
    # Yetki kontrolü
    if article['author_id'] != current_user['id']:
        if not storage.is_collaborator(article_id, current_user['id']):
            raise HTTPException(status_code=403, detail="Bu makalenin versiyonlarını görme izniniz yok")
    
    versions = storage.get_article_versions(article_id)
    return versions

@app.get("/articles/{article_id}/versions/{version_number}")
def get_article_version(
    article_id: int,
    version_number: int,
    current_user: dict = Depends(get_current_user)
):
    """Belirli bir versiyonu getir"""
    article = storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    
    # Yetki kontrolü
    if article['author_id'] != current_user['id']:
        if not storage.is_collaborator(article_id, current_user['id']):
            raise HTTPException(status_code=403, detail="Bu makalenin versiyonlarını görme izniniz yok")
    
    version = storage.get_article_version(article_id, version_number)
    if not version:
        raise HTTPException(status_code=404, detail="Versiyon bulunamadı")
    
    return version

@app.get("/articles/{article_id}/compare/{version1}/{version2}")
def compare_versions(
    article_id: int,
    version1: int,
    version2: int,
    current_user: dict = Depends(get_current_user)
):
    """İki versiyon arasındaki farkları karşılaştır"""
    article = storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    
    # Yetki kontrolü
    if article['author_id'] != current_user['id']:
        if not storage.is_collaborator(article_id, current_user['id']):
            raise HTTPException(status_code=403, detail="Bu makalenin versiyonlarını görme izniniz yok")
    
    comparison = storage.compare_versions(article_id, version1, version2)
    if "error" in comparison:
        raise HTTPException(status_code=404, detail=comparison["error"])
    
    return comparison

@app.post("/articles/{article_id}/restore/{version_number}")
def restore_version(
    article_id: int,
    version_number: int,
    current_user: dict = Depends(get_current_user)
):
    """Belirli bir versiyonu geri yükle"""
    article = storage.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    
    # Yetki kontrolü
    if article['author_id'] != current_user['id']:
        if not storage.is_collaborator(article_id, current_user['id']):
            raise HTTPException(status_code=403, detail="Bu makaleyi düzenleme izniniz yok")
    
    version = storage.get_article_version(article_id, version_number)
    if not version:
        raise HTTPException(status_code=404, detail="Versiyon bulunamadı")
    
    # Versiyonu geri yükle
    updated_article = storage.update_article(
        article_id, 
        content=version['content'],
        user_id=current_user['id'],
        version_note=f"Versiyon {version_number} geri yüklendi"
    )
    
    return ArticleResponse(**updated_article)

# AI Analiz Endpoint'leri
@app.post("/ai/analyze")
async def analyze_article(
    request: AIAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Makale içeriğini AI ile analiz eder"""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="İçerik boş olamaz")
    
    analysis = analyze_article_content(request.content, request.analysis_type)
    return {"analysis": analysis, "type": request.analysis_type}

@app.post("/ai/question")
async def ask_question(
    request: AIQuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Makale hakkında soru sorar"""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Makale içeriği boş olamaz")
    
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Soru boş olamaz")
    
    answer = answer_question(request.content, request.question)
    return {"question": request.question, "answer": answer}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080) 