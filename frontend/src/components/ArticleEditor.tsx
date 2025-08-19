import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Users, Plus, X, Search, BookOpen, Edit3, Eye, History } from 'lucide-react';

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

  const removeCollaborator = async (collaboratorId: number) => {
    if (!id || id === 'new') {
      toast.error('Önce makaleyi kaydedin');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/articles/${id}/collaborators/${collaboratorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('İşbirlikçi kaldırıldı');
      fetchCollaborators();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'İşbirlikçi kaldırılamadı');
    }
  };

  const addCollaborator = (user: User) => {
    handleAddCollaborator(user.id);
  };

  const handleUserSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    await handleSearchUsers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-blue-50"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Geri Dön</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Makale Düzenle' : 'Yeni Makale'}
                  </h1>
                  <p className="text-gray-600">
                    {isEditing ? 'Makalenizi güncelleyin' : 'Yeni bir makale oluşturun'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Versiyon Geçmişi */}
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-blue-50"
              >
                <History className="h-5 w-5" />
                <span>Geçmiş</span>
              </button>

              {/* İşbirlikçiler */}
              <button
                onClick={() => setShowCollaborators(!showCollaborators)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-blue-50"
              >
                <Users className="h-5 w-5" />
                <span>İşbirlikçiler</span>
              </button>

              {/* Kaydet */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Ana Editör */}
          <div className="lg:col-span-3 space-y-6">
            {/* Başlık */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Makale Başlığı
              </label>
              <input
                type="text"
                value={article.title}
                onChange={(e) => setArticle({ ...article, title: e.target.value })}
                placeholder="Makale başlığını girin..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-lg font-medium"
              />
            </div>

            {/* İçerik Editörü */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Makale İçeriği
              </label>
              <div className="border border-gray-300 rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Edit3 className="h-4 w-4" />
                    <span>Zengin metin editörü</span>
                  </div>
                </div>
                <div className="p-4">
                  <textarea
                    value={article.content}
                    onChange={(e) => setArticle({ ...article, content: e.target.value })}
                    placeholder="Makale içeriğinizi buraya yazın..."
                    className="w-full h-96 resize-none border-none outline-none bg-transparent text-gray-900 placeholder-gray-500 text-base leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Gizlilik Ayarı */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={article.is_public}
                  onChange={(e) => setArticle({ ...article, is_public: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                />
                <div>
                  <span className="font-semibold text-gray-900">Genel Makale</span>
                  <p className="text-sm text-gray-600">Bu makaleyi herkes görebilsin</p>
                </div>
              </label>
            </div>
          </div>

          {/* Sağ Sidebar */}
          <div className="space-y-6">
            {/* İşbirlikçiler Panel */}
            {showCollaborators && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">İşbirlikçiler</h3>
                  <button
                    onClick={() => setShowCollaborators(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: getUserColor(collaborator.id) }}
                        >
                          {collaborator.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{collaborator.username}</div>
                          <div className="text-sm text-gray-500">{collaborator.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCollaborator(collaborator.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Kullanıcı ara..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <button
                      onClick={handleUserSearch}
                      className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50/50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{user.username}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                          <button
                            onClick={() => addCollaborator(user)}
                            className="px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Versiyon Geçmişi Panel */}
            {showVersions && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Versiyon Geçmişi</h3>
                  <button
                    onClick={() => setShowVersions(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {versions.map((version) => (
                    <div 
                      key={version.id} 
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedVersion === version.version_number 
                          ? 'bg-blue-100 border border-blue-200' 
                          : 'bg-gray-50/50 hover:bg-gray-100/50'
                      }`}
                      onClick={() => setSelectedVersion(version.version_number)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: getUserColor(version.user_id) }}
                          >
                            {version.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm text-gray-900">
                            {version.user_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          v{version.version_number}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{version.note}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(version.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedVersion && (
                  <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        Versiyon {selectedVersion} seçildi
                      </span>
                      <button
                        onClick={() => setSelectedVersion(null)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Temizle
                      </button>
                    </div>
                                         <button
                       onClick={() => restoreVersion(selectedVersion!)}
                       className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                     >
                       Bu Versiyonu Geri Yükle
                     </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor; 