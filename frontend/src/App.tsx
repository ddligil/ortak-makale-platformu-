import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ArticleEditor from './components/ArticleEditor';
import ArticleView from './components/ArticleView';
import { BookOpen, Users, Edit3, Globe, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={
            <div className="min-h-screen">
              {/* Navigation */}
              <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        MakaleHub
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <a href="/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                        Giriş Yap
                      </a>
                      <a href="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        Hesap Oluştur
                      </a>
                    </div>
                  </div>
                </div>
              </nav>

              {/* Hero Section */}
              <div className="container mx-auto px-6 py-20">
                <div className="text-center max-w-4xl mx-auto">
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    Birlikte Yazın,
                    <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Birlikte Öğrenin
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                    Ortak makale yazma platformu ile arkadaşlarınızla işbirliği yapın, 
                    bilgilerinizi paylaşın ve birlikte büyüyün.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center space-x-2">
                      <span>Hemen Başlayın</span>
                      <ArrowRight className="w-5 h-5" />
                    </a>
                    <a href="/login" className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-200 font-semibold text-lg">
                      Giriş Yapın
                    </a>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="container mx-auto px-6 py-20">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Edit3 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Zengin Editör</h3>
                    <p className="text-gray-600 leading-relaxed">
                      React Quill ile güçlü metin editörü. Formatlamalar, listeler, 
                      renkler ve daha fazlası.
                    </p>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">İşbirliği</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Arkadaşlarınızla birlikte makale yazın. Gerçek zamanlı 
                      işbirliği ve değişiklik takibi.
                    </p>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Paylaşım</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Makalelerinizi gizli tutun veya herkese açık yapın. 
                      Arkadaşlık sistemi ile bağlantılar kurun.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white/50 backdrop-blur-sm border-t border-white/20 mt-20">
                <div className="container mx-auto px-6 py-8">
                  <div className="text-center text-gray-600">
                    <p>&copy; 2025 MakaleHub. Ortak makale yazma platformu.</p>
                  </div>
                </div>
              </div>
            </div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/article/new" element={<ArticleEditor />} />
          <Route path="/article/:id/edit" element={<ArticleEditor />} />
          <Route path="/article/:id" element={<ArticleView />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 