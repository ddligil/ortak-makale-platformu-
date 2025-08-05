import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ArticleEditor from './components/ArticleEditor';
import ArticleView from './components/ArticleView';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold text-center">MakaleHub</h1>
              <p className="text-center mt-4">Hoş geldiniz!</p>
              <div className="text-center mt-8 space-x-4">
                <a href="/login" className="text-blue-600 hover:text-blue-500">
                  Giriş Yap
                </a>
                <span className="text-gray-400">|</span>
                <a href="/register" className="text-blue-600 hover:text-blue-500">
                  Hesap Oluştur
                </a>
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