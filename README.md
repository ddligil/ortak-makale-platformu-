# Ortak Makale Platformu

Kullanıcıların birlikte makale yazabilecekleri, arkadaşlık kurabilecekleri ve makalelerini paylaşabilecekleri modern bir web platformu.

## 🚀 Özellikler

### 👥 Kullanıcı Yönetimi
- Kullanıcı kaydı ve giriş sistemi
- JWT tabanlı kimlik doğrulama
- Kullanıcı profilleri
- Arkadaşlık sistemi

### 📝 Makale Yönetimi
- Zengin metin editörü (React Quill)
- Makale oluşturma, düzenleme ve silme
- Gizli ve herkese açık makaleler
- Makale geçmişi takibi

### 🤝 İşbirliği
- Makalelere işbirlikçi ekleme
- Kullanıcı renk sistemi (görsel ayrım)
- Gerçek zamanlı işbirliği (gelecek özellik)
- Değişiklik takibi

### 🔔 Bildirimler
- Makale güncellemeleri
- İşbirlikçi ekleme bildirimleri
- Arkadaşlık istekleri

## 🛠️ Teknoloji Stack

### Backend
- **Python FastAPI** - Modern, hızlı web framework
- **Uvicorn** - ASGI server
- **JWT** - Kimlik doğrulama
- **Passlib** - Şifre hashleme
- **JSON Storage** - Dosya tabanlı veri saklama

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Tip güvenliği
- **React Router** - Sayfa yönlendirme
- **React Quill** - Zengin metin editörü
- **Axios** - HTTP client
- **React Hot Toast** - Bildirimler
- **Lucide React** - İkonlar
- **Tailwind CSS** - Stil framework

## 📦 Kurulum

### Gereksinimler
- Python 3.8+
- Node.js 16+
- npm veya yarn

### Backend Kurulumu

```bash
# Backend dizinine git
cd backend

# Python bağımlılıklarını yükle
pip install -r requirements.txt

# Backend'i başlat
python main.py
```

Backend http://localhost:8080 adresinde çalışacak.

### Frontend Kurulumu

```bash
# Frontend dizinine git
cd frontend

# Node.js bağımlılıklarını yükle
npm install

# Frontend'i başlat
npm start
```

Frontend http://localhost:3001 adresinde çalışacak.

## 🚀 Hızlı Başlangıç

1. **Backend'i başlatın:**
   ```bash
   cd backend && python main.py
   ```

2. **Frontend'i başlatın:**
   ```bash
   cd frontend && npm start
   ```

3. **Tarayıcıda açın:** http://localhost:3001

4. **Hesap oluşturun** ve kullanmaya başlayın!

## 📁 Proje Yapısı

```
makh/
├── backend/
│   ├── main.py              # FastAPI uygulaması
│   ├── data_storage.py      # JSON tabanlı veri saklama
│   ├── requirements.txt     # Python bağımlılıkları
│   └── data/               # JSON veri dosyaları (otomatik oluşur)
├── frontend/
│   ├── src/
│   │   ├── components/      # React bileşenleri
│   │   ├── contexts/        # React context'leri
│   │   ├── App.tsx         # Ana uygulama
│   │   └── index.tsx       # Giriş noktası
│   ├── package.json        # Node.js bağımlılıkları
│   └── tailwind.config.js  # Tailwind CSS yapılandırması
├── start_backend.sh        # Backend başlatma scripti
├── start_frontend.sh       # Frontend başlatma scripti
└── README.md              # Bu dosya
```

## 🔧 API Endpoints

### Kimlik Doğrulama
- `POST /register` - Kullanıcı kaydı
- `POST /login` - Kullanıcı girişi
- `GET /profile` - Kullanıcı profili

### Makaleler
- `GET /articles` - Makaleleri listele
- `POST /articles` - Yeni makale oluştur
- `GET /articles/{id}` - Makale detayı
- `PUT /articles/{id}` - Makale güncelle
- `DELETE /articles/{id}` - Makale sil

### İşbirliği
- `POST /articles/{id}/collaborate` - İşbirlikçi ekle
- `GET /articles/{id}/collaborators` - İşbirlikçileri listele

### Kullanıcılar
- `GET /users/search` - Kullanıcı ara
- `POST /friends` - Arkadaş ekle
- `GET /friends` - Arkadaşları listele

### Bildirimler
- `GET /notifications` - Bildirimleri listele
- `PUT /notifications/{id}/read` - Bildirimi okundu işaretle

## 🎨 Özellikler Detayı

### Zengin Metin Editörü
- Başlık seviyeleri (H1-H6)
- Yazı tipi ve boyut seçenekleri
- Kalın, italik, altı çizili, üstü çizili
- Renk seçenekleri (metin ve arka plan)
- Script (alt simge, üst simge)
- Bloklar (alıntı, kod bloğu)
- Listeler (numaralı, madde işaretli, kontrol)
- Girinti ve hizalama
- Link, resim, video

### Kullanıcı Renk Sistemi
- Her kullanıcıya benzersiz renk atanır
- İşbirlikçi makalelerde görsel ayrım
- Renkli border ve göstergeler

## 🔮 Gelecek Özellikler

- [ ] WebSocket ile gerçek zamanlı işbirliği
- [ ] LaTeX matematik formül desteği
- [ ] Makale şablonları
- [ ] Gelişmiş arama ve filtreleme
- [ ] Makale kategorileri
- [ ] Yorum sistemi
- [ ] Dosya yükleme
- [ ] Mobil uygulama

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

Bu proje ortak makale yazma ihtiyacından doğmuş modern bir web uygulamasıdır.

---

**Not:** Bu proje geliştirme aşamasındadır. Üretim ortamında kullanmadan önce güvenlik testleri yapılması önerilir. 