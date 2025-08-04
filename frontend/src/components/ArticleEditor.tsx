import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Users, Plus, X, Search } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Article {
  id?: number;
  title: string;
  content: string;
  is_public: boolean;
  author_id?: number;
  created_at?: string;
  updated_at?: string;
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

  const isEditing = id && id !== 'new';

  // Gelişmiş Quill editor modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'check', 'indent',
    'direction', 'align',
    'link', 'image', 'video'
  ];

  useEffect(() => {
    if (isEditing && id !== 'new') {
      fetchArticle();
      fetchCollaborators();
    }
    fetchCurrentUser();
  }, [id, isEditing]);

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

  const getUserColor = (userId: number): string => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#EF4444', // red
      '#8B5CF6', // purple
      '#F97316', // orange
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];

    if (!userColors[userId]) {
      userColors[userId] = colors[Object.keys(userColors).length % colors.length];
      setUserColors({...userColors});
    }

    return userColors[userId];
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

  // Basit renkli yazma için textarea
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setArticle({ ...article, content: newContent });
  };

  // Kullanıcı rengini al
  const getUserColorDisplay = () => {
    if (!currentUser) return '#3B82F6';
    return getUserColor(currentUser.id);
  };

  // Quill editor için özel stil
  const quillStyle = {
    border: `2px solid ${getUserColorDisplay()}`,
    borderRadius: '8px',
    minHeight: '400px'
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

        {/* Gelişmiş React Quill Editor */}
        <div style={quillStyle}>
          <ReactQuill
            value={article.content || ''}
            onChange={(content) => setArticle({ ...article, content })}
            modules={modules}
            formats={formats}
            placeholder="Makale içeriğinizi yazın..."
            style={{ height: '350px' }}
          />
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