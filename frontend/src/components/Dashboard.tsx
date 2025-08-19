import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Eye, Edit, Calendar, BookOpen, Filter, Sparkles } from 'lucide-react';
import Navbar from './Navbar';

interface Article {
  id: number;
  title: string;
  content: string;
  author_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
    fetchCurrentUser();
  }, [showPublicOnly]);

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

  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/articles?public_only=${showPublicOnly}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticles(response.data);
    } catch (error) {
      toast.error('Makaleler yüklenemedi');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Makaleler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Makale Merkezi
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Makalelerinizi yönetin, düzenleyin ve arkadaşlarınızla işbirliği yapın
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Makale</p>
                <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Genel Makaleler</p>
                <p className="text-2xl font-bold text-gray-900">{articles.filter(a => a.is_public).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">İşbirlikçi</p>
                <p className="text-2xl font-bold text-gray-900">{articles.filter(a => a.author_id !== currentUser?.id).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPublicOnly}
                onChange={(e) => setShowPublicOnly(e.target.checked)}
                className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
              />
              <span className="text-gray-700 font-medium">Sadece genel makaleleri göster</span>
            </label>
          </div>
          
          <button
            onClick={() => navigate('/article/new')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Makale</span>
          </button>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mb-6">
              <Plus className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Henüz makale yok</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              İlk makalenizi oluşturarak yazma yolculuğunuza başlayın
            </p>
            <button
              onClick={() => navigate('/article/new')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>İlk Makalenizi Oluşturun</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <div key={article.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                      {article.title}
                    </h3>
                    <div className="flex space-x-2">
                      {!article.is_public && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                          Gizli
                        </span>
                      )}
                      {article.author_id !== currentUser?.id && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          İşbirlikçi
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {article.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>

                  <div className="flex items-center text-sm text-gray-500 mb-6">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    {formatDate(article.updated_at)}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigate(`/article/${article.id}`)}
                      className="flex-1 flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Görüntüle
                    </button>
                    <button
                      onClick={() => navigate(`/article/${article.id}/edit`)}
                      className="flex-1 flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 