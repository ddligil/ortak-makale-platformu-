import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Edit, Calendar, User, Users } from 'lucide-react';
import 'katex/dist/katex.min.css';
// @ts-ignore
import { InlineMath, BlockMath } from 'react-katex';

interface Article {
  id: number;
  title: string;
  content: string;
  author_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
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

const ArticleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [articleAuthor, setArticleAuthor] = useState<any>(null);

  useEffect(() => {
    fetchArticle();
    fetchCollaborators();
    fetchVersions();
  }, [id]);

  useEffect(() => {
    if (article?.author_id) {
      fetchArticleAuthor();
    }
  }, [article?.author_id]);

  const fetchArticle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticle(response.data);
    } catch (error) {
      toast.error('Makale yüklenemedi');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
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

  const fetchArticleAuthor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticleAuthor(response.data);
    } catch (error) {
      console.error('Makale sahibi bilgileri yüklenemedi');
    }
  };

  const fetchVersions = async () => {
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
      
      setArticle({ ...article!, content: response.data.content });
      setSelectedVersion(versionNumber);
      toast.success(`Versiyon ${versionNumber} yüklendi`);
    } catch (error) {
      console.error('Versiyon yüklenemedi:', error);
      toast.error('Versiyon yüklenemedi');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Kullanıcı etiketlerini renkli gösterme fonksiyonu
  const renderColoredContent = (content: string) => {
    if (!content) return '';
    
    // Önce kullanıcı etiketlerini işle
    return processUserTags(content);
  };

  // Kullanıcı etiketlerini işle (string için)
  const processUserTags = (content: string) => {
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

        // Kullanıcıyı bul
        const user = collaborators.find(c => c.username === username) || 
                    (articleAuthor && articleAuthor.username === username ? articleAuthor : null);

        if (user) {
          currentUserColor = getColorClass(user.id);
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

      // Hiçbir kullanıcı etiketi yoksa normal göster
      return <div key={index}>{line}</div>;
    });

    return <div className="whitespace-pre-wrap">{coloredLines}</div>;
  };

  // Kullanıcı etiketlerini işle (JSX için)
  const processUserTagsJSX = (content: JSX.Element | JSX.Element[]) => {
    // Basit implementasyon - daha gelişmiş olabilir
    return content;
  };

  // Markdown render fonksiyonu
  const renderMarkdown = (text: string): string => {
    return text
      // Başlıklar
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Kalın
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // İtalik
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Altı çizili
      .replace(/__(.*?)__/g, '<u>$1</u>')
      // Üstü çizili
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Alıntı
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Kod
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // LaTeX (satır içi) - KaTeX ile render edilecek
      .replace(/\$([^$\n]+?)\$/g, (match, latex) => {
        try {
          return `<span class="latex-inline" data-latex="${latex}">$${latex}$</span>`;
        } catch (error) {
          return match;
        }
      })
      // Linkler
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
      // Satır sonları
      .replace(/\n/g, '<br>');
  };

  // Renk sınıfı belirleme
  const getColorClass = (userId: number): string => {
    // Daha belirgin renkler - sarı, kırmızı, mavi, yeşil, mor, turuncu
    const colors = ['#FFD700', '#FF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F97316'];
    return colors[userId % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Makale bulunamadı</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Geri Dön</span>
        </button>
        
        <button
          onClick={() => navigate(`/article/${id}/edit`)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Edit className="h-4 w-4" />
          <span>Düzenle</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
            {!article.is_public && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Gizli
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Son güncelleme: {formatDate(article.updated_at)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>Yazar ID: {article.author_id}</span>
            </div>
          </div>

          {collaborators.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-700">İşbirlikçiler</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {collaborators.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {user.username}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Versiyon Kontrol Sistemi */}
          {versions.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-blue-800">Versiyon Geçmişi</span>
                  <span className="text-sm text-blue-600">
                    (Mevcut: {article.current_version || 1})
                  </span>
                </div>
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showVersions ? 'Gizle' : 'Göster'}
                </button>
              </div>
              
              {showVersions && (
                <div className="space-y-2">
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
                          <button
                            onClick={() => loadVersion(version.version_number)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Görüntüle
                          </button>
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

          <div className="article-content prose max-w-none">
            {processUserTags(article.content)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView; 