import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Edit, Calendar, User, Users, BookOpen, Eye, History, Share2 } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Makale yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Makale bulunamadı</h3>
          <p className="text-gray-600 mb-8">Aradığınız makale mevcut değil veya erişim izniniz yok.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    );
  }

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
                  <h1 className="text-2xl font-bold text-gray-900">Makale Görüntüle</h1>
                  <p className="text-gray-600">Makalenizi okuyun ve inceleyin</p>
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

              {/* Düzenle */}
              <button
                onClick={() => navigate(`/article/${article.id}/edit`)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <Edit className="h-5 w-5" />
                <span>Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Ana Makale İçeriği */}
          <div className="lg:col-span-3 space-y-6">
            {/* Makale Başlığı */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {article.title}
              </h1>
              
              <div className="flex items-center justify-center space-x-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span>Oluşturulma: {new Date(article.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <span>Güncelleme: {new Date(article.updated_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              {/* Gizlilik Durumu */}
              <div className="mt-4">
                {article.is_public ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                    <Eye className="h-4 w-4 mr-2" />
                    Genel Makale
                  </span>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Share2 className="h-4 w-4 mr-2" />
                    Gizli Makale
                  </span>
                )}
              </div>
            </div>

            {/* Makale İçeriği */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
            </div>
          </div>

          {/* Sağ Sidebar */}
          <div className="space-y-6">
            {/* Yazar Bilgisi */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                Yazar
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {articleAuthor?.username || 'Bilinmeyen Kullanıcı'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Makale sahibi
                  </div>
                </div>
              </div>
            </div>

            {/* İşbirlikçiler */}
            {collaborators.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-500" />
                  İşbirlikçiler ({collaborators.length})
                </h3>
                <div className="space-y-3">
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{collaborator.username}</div>
                        <div className="text-sm text-gray-500">{collaborator.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Versiyon Geçmişi */}
            {showVersions && versions.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <History className="h-5 w-5 mr-2 text-purple-500" />
                  Versiyon Geçmişi
                </h3>
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
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {version.user_name.charAt(0).toUpperCase()}
                            </span>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView; 