import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Users, Plus, X, Search } from 'lucide-react';

interface Article {
  id?: number;
  title: string;
  content: string;
  is_public: boolean;
  author_id?: number;
  created_at?: string;
  updated_at?: string;
  current_version?: number;
}

interface Version {
  id: number;
  article_id: number;
  user_id: number;
  user_name: string;
  content: string;
  version_number: number;
  note: string;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article>({
    id: 0,
    title: '',
    content: '',
    author_id: 0,
    is_public: false,
    created_at: '',
    updated_at: ''
  });
  const [saving, setSaving] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userColors, setUserColors] = useState<{[key: number]: string}>({});
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [showVersions, setShowVersions] = useState(false);

  const isEditing = id && id !== 'new';

  // Kullanıcı renkleri
  const getUserColor = (userId: number): string => {
    // Daha belirgin renkler - sarı, kırmızı, mavi, yeşil, mor, turuncu
    const colors = [
      '#FFD700', // sarı
      '#FF4444', // kırmızı
      '#3B82F6', // mavi
      '#10B981', // yeşil
      '#8B5CF6', // mor
      '#F97316'  // turuncu
    ];
    return colors[userId % colors.length];
  };

  // Kullanıcı etiketi ekleme fonksiyonu
  const addUserTag = (content: string, username: string): string => {
    const timestamp = new Date().toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `[${username} - ${timestamp}]\n${content}\n\n`;
  };

  // İçeriği renklendirme fonksiyonu
  const renderColoredContent = (content: string) => {
    if (!content) return '';
    
    const lines = content.split('\n');
    let currentUserColor = '#000000'; // Varsayılan siyah
    let currentUsername = '';

    const coloredLines = lines.map((line, index) => {
      // Kullanıcı etiketi kontrolü
      const userMatch = line.match(/^\[([^-]+) - ([^\]]+)\]/);
      if (userMatch) {
        const username = userMatch[1].trim();
        const timestamp = userMatch[2].trim();
        
        // Kullanıcıyı bul ve rengini al
        const user = collaborators.find(c => c.username === username) || 
                    (currentUser?.username === username ? currentUser : null);
        
        if (user) {
          currentUserColor = getUserColor(user.id);
          currentUsername = username;
        }
        
        const contentAfterTag = line.substring(line.indexOf(']') + 1);
        
        return (
          <div key={index} style={{ 
            padding: '4px 0',
            margin: '2px 0'
          }}>
            <span style={{ color: currentUserColor, fontWeight: 'bold' }}>
              [{username} - {timestamp}]
            </span>
            {contentAfterTag && contentAfterTag.trim() && (
              <span style={{ color: currentUserColor, marginLeft: '8px' }}>
                {contentAfterTag}
              </span>
            )}
          </div>
        );
      }
      
      // Kullanıcı etiketi yoksa, önceki kullanıcının rengini kullan
      if (line.trim() && currentUsername) {
        return (
          <div key={index} style={{ 
            padding: '2px 0',
            margin: '1px 0'
          }}>
            <span style={{ color: currentUserColor }}>
              {line}
            </span>
          </div>
        );
      }
      
      // Normal satır
      return <div key={index}>{line}</div>;
    });
    
    return <div className="whitespace-pre-wrap">{coloredLines}</div>;
  };

  // İçerik değişikliği
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setArticle({ ...article, content: e.target.value });
  };

  // Yeni içerik ekleme
  const handleAddContent = () => {
    if (!currentUser) return;
    
    const newContent = prompt('Yeni içerik ekleyin:');
    if (newContent && newContent.trim()) {
      const taggedContent = addUserTag(newContent.trim(), currentUser.username);
      setArticle({ 
        ...article, 
        content: article.content + taggedContent 
      });
    }
  };

  // Kaldığın yerden devam etme fonksiyonu
  const handleContinueFromLast = () => {
    if (!currentUser) return;
    
    const currentTime = new Date().toLocaleString('tr-TR');
    const userTag = `[${currentUser.username} - ${currentTime}]\n`;
    
    // Eğer içerik boşsa, sadece etiket ekle
    if (!article.content.trim()) {
      setArticle(prev => ({
        ...prev,
        content: userTag
      }));
      
      // Cursor'ı textarea'nın sonuna taşı
      setTimeout(() => {
        const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(userTag.length, userTag.length);
        }
      }, 100);
      return;
    }
    
    // İçeriğin sonunda zaten bir etiket var mı kontrol et
    const lines = article.content.split('\n');
    const lastLine = lines[lines.length - 1].trim();
    
    // Son satır bir kullanıcı etiketi mi?
    const isLastLineTag = /^\[[^-]+ - [^\]]+\]$/.test(lastLine);
    
    if (isLastLineTag) {
      // Son satır zaten bir etiket, yeni satır ekle
      setArticle(prev => ({
        ...prev,
        content: prev.content + '\n'
      }));
      
      // Cursor'ı yeni satırın başına taşı
      setTimeout(() => {
        const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }, 100);
    } else {
      // Son satır etiket değil, yeni etiket ekle
      setArticle(prev => ({
        ...prev,
        content: prev.content + '\n' + userTag
      }));
      
      // Cursor'ı etiketin sonuna taşı
      setTimeout(() => {
        const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }, 100);
    }
  };

  // Toolbar fonksiyonları
  const applyFormat = (format: string) => {
    const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = article.content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'latex':
        formattedText = `$${selectedText}$`;
        break;
      case 'latex-block':
        formattedText = `$$\n${selectedText}\n$$`;
        break;
      case 'link':
        const url = prompt('Link URL girin:');
        if (url) {
          formattedText = `[${selectedText}](${url})`;
        } else {
          return;
        }
        break;
      case 'color-red':
        formattedText = `<span style="color: red;">${selectedText}</span>`;
        break;
      case 'color-blue':
        formattedText = `<span style="color: blue;">${selectedText}</span>`;
        break;
      case 'color-green':
        formattedText = `<span style="color: green;">${selectedText}</span>`;
        break;
      case 'color-yellow':
        formattedText = `<span style="color: orange;">${selectedText}</span>`;
        break;
      case 'color-purple':
        formattedText = `<span style="color: purple;">${selectedText}</span>`;
        break;
      default:
        return;
    }
    
    const newContent = article.content.substring(0, start) + formattedText + article.content.substring(end);
    setArticle({ ...article, content: newContent });
    
    // Cursor pozisyonunu ayarla
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  useEffect(() => {
    if (isEditing && id !== 'new') {
      fetchArticle();
      fetchCollaborators();
      fetchVersions();
    }
    fetchCurrentUser();
  }, [id, isEditing]);

  // Kullanıcı arama için debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchUsers();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Kullanıcı bilgisi alınamadı');
    }
  };

  const getUserColorDisplay = () => {
    if (!currentUser) return '#3B82F6';
    return getUserColor(currentUser.id);
  };

  const fetchArticle = async () => {
    if (!id || id === 'new') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticle(response.data);
    } catch (error) {
      toast.error('Makale yüklenemedi');
    }
  };

  const fetchCollaborators = async () => {
    if (!id || id === 'new') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/articles/${id}/collaborators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCollaborators(response.data);
    } catch (error) {
      console.error('İşbirlikçiler yüklenemedi');
    }
  };

  const fetchVersions = async () => {
    if (!id || id === 'new') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/articles/${id}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVersions(response.data);
    } catch (error) {
      console.error('Versiyonlar yüklenemedi:', error);
    }
  };

  const loadVersion = async (versionNumber: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/articles/${id}/versions/${versionNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setArticle({ ...article, content: response.data.content });
      setSelectedVersion(versionNumber);
      toast.success(`Versiyon ${versionNumber} yüklendi`);
    } catch (error) {
      console.error('Versiyon yüklenemedi:', error);
      toast.error('Versiyon yüklenemedi');
    }
  };

  const restoreVersion = async (versionNumber: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/articles/${id}/restore/${versionNumber}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Makaleyi yeniden yükle
      await fetchArticle();
      await fetchVersions();
      setSelectedVersion(null);
      toast.success(`Versiyon ${versionNumber} geri yüklendi`);
    } catch (error) {
      console.error('Versiyon geri yüklenemedi:', error);
      toast.error('Versiyon geri yüklenemedi');
    }
  };

  const handleSave = async () => {
    if (!article.title?.trim()) {
      toast.error('Başlık gerekli');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (isEditing) {
        await axios.put(`http://localhost:8080/articles/${id}`, article, { headers });
        toast.success('Makale güncellendi');
      } else {
        await axios.post('http://localhost:8080/articles', article, { headers });
        toast.success('Makale oluşturuldu');
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/users/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Kullanıcı arama hatası');
    }
  };

  const handleAddCollaborator = async (userId: number) => {
    if (!id || id === 'new') {
      toast.error('Önce makaleyi kaydedin');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/articles/${id}/collaborate`, { user_id: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('İşbirlikçi eklendi');
      fetchCollaborators();
      setSearchResults([]);
      setSearchQuery('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'İşbirlikçi eklenemedi');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          <span>Geri Dön</span>
        </button>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Save size={20} />
          <span>Kaydet</span>
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Başlık
        </label>
        <input
          type="text"
          id="title"
          value={article.title}
          onChange={(e) => setArticle({ ...article, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Makale başlığı..."
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          İçerik
        </label>
        
        {/* Kullanıcı rengi göstergesi */}
        {currentUser && (
          <div className="mb-2 flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getUserColorDisplay() }}
            ></div>
            <span className="text-sm text-gray-600">
              <strong style={{ color: getUserColorDisplay() }}>
                {currentUser.username}
              </strong> 
              olarak yazıyorsunuz
            </span>
          </div>
        )}

        {/* Basit Toolbar */}
        <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex flex-wrap gap-1">
            {/* Başlıklar */}
            <button
              onClick={() => applyFormat('h1')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Başlık 1"
            >
              H1
            </button>
            <button
              onClick={() => applyFormat('h2')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Başlık 2"
            >
              H2
            </button>
            <button
              onClick={() => applyFormat('h3')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Başlık 3"
            >
              H3
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            {/* Formatlamalar */}
            <button
              onClick={() => applyFormat('bold')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
              title="Kalın"
            >
              B
            </button>
            <button
              onClick={() => applyFormat('italic')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
              title="İtalik"
            >
              I
            </button>
            <button
              onClick={() => applyFormat('underline')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
              title="Altı Çizili"
            >
              U
            </button>
            <button
              onClick={() => applyFormat('strikethrough')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 line-through"
              title="Üstü Çizili"
            >
              S
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            {/* Renkler */}
            <button
              onClick={() => applyFormat('color-red')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-red-600 font-bold"
              title="Kırmızı"
            >
              🔴
            </button>
            <button
              onClick={() => applyFormat('color-blue')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-blue-600 font-bold"
              title="Mavi"
            >
              🔵
            </button>
            <button
              onClick={() => applyFormat('color-green')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-green-600 font-bold"
              title="Yeşil"
            >
              🟢
            </button>
            <button
              onClick={() => applyFormat('color-yellow')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-orange-600 font-bold"
              title="Turuncu"
            >
              🟠
            </button>
            <button
              onClick={() => applyFormat('color-purple')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 text-purple-600 font-bold"
              title="Mor"
            >
              🟣
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            
            {/* Özel formatlamalar */}
            <button
              onClick={() => applyFormat('quote')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Alıntı"
            >
              "
            </button>
            <button
              onClick={() => applyFormat('code')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 font-mono"
              title="Kod"
            >
              &lt;/&gt;
            </button>
            <button
              onClick={() => applyFormat('latex')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 font-mono"
              title="LaTeX (Satır içi)"
            >
              $x$
            </button>
            <button
              onClick={() => applyFormat('latex-block')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 font-mono"
              title="LaTeX (Blok)"
            >
              $$
            </button>
            <button
              onClick={() => applyFormat('link')}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Link"
            >
              🔗
            </button>
          </div>
        </div>

        {/* Versiyon Kontrol Sistemi */}
        {isEditing && versions.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800">Versiyon Kontrol</h4>
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showVersions ? 'Gizle' : 'Göster'}
              </button>
            </div>
            
            {showVersions && (
              <div className="space-y-2">
                <div className="text-xs text-blue-600 mb-2">
                  Mevcut Versiyon: {article.current_version || 1}
                </div>
                
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {versions.map((version) => (
                    <div 
                      key={version.id} 
                      className={`p-2 rounded text-xs border ${
                        selectedVersion === version.version_number 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Versiyon {version.version_number}</span>
                          <span className="text-gray-500 ml-2">- {version.user_name}</span>
                          <span className="text-gray-400 ml-2">
                            {new Date(version.created_at).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => loadVersion(version.version_number)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Görüntüle
                          </button>
                          {version.version_number !== (article.current_version || 1) && (
                            <button
                              onClick={() => restoreVersion(version.version_number)}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Geri Yükle
                            </button>
                          )}
                        </div>
                      </div>
                      {version.note && (
                        <div className="text-gray-600 mt-1 italic">
                          {version.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {selectedVersion && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>Versiyon {selectedVersion}</strong> görüntüleniyor. 
                    Değişiklik yapmak için "Güncel Versiyona Dön" butonuna tıklayın.
                    <button
                      onClick={() => {
                        fetchArticle();
                        setSelectedVersion(null);
                      }}
                      className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Güncel Versiyona Dön
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Renklendirilmiş görüntüleme */}
        <div className="mb-4">
          <div className="p-3 border border-gray-300 rounded-md bg-white min-h-64 max-h-96 overflow-y-auto">
            {renderColoredContent(article.content)}
          </div>
        </div>

        {/* Düzenleme için textarea */}
        <textarea
          id="article-content"
          value={article.content}
          onChange={handleContentChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Makale içeriğinizi yazın..."
          rows={10}
        />

        {/* İçerik ekleme butonları */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleAddContent}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Yeni İçerik Ekle
          </button>
          <button
            onClick={handleContinueFromLast}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Kaldığın Yerden Devam Et
          </button>
        </div>

        {/* İşbirlikçi Ekleme Bölümü */}
        <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">İşbirlikçi Ekle</h3>
          
          {/* Kullanıcı Arama */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Arama Sonuçları */}
          {searchResults.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Kullanıcılar:</h4>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
                    <span>{user.username}</span>
                    <button
                      onClick={() => handleAddCollaborator(user.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Ekle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mevcut İşbirlikçiler */}
          {collaborators.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Mevcut İşbirlikçiler:</h4>
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
                    <span>{collaborator.username}</span>
                    <span className="text-green-600 text-sm">✓ Eklendi</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={article.is_public || false}
            onChange={(e) => setArticle({ ...article, is_public: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Herkese açık</span>
        </label>
      </div>

      {showCollaborators && (
        <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">İşbirlikçiler</h3>
          
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearchUsers}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ara
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <button
                    onClick={() => handleAddCollaborator(user.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Ekle
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {collaborators.length === 0 ? (
              <p className="text-gray-500">Henüz işbirlikçi yok.</p>
            ) : (
              collaborators.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getUserColor(user.id) }}
                    ></div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <span className="text-sm text-gray-500">İşbirlikçi</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor; 