import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  BookOpen, 
  LogOut, 
  Bell, 
  Search, 
  User, 
  Users, 
  X,
  Check,
  MessageSquare,
  Plus,
  Home
} from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

interface UserData {
  id: number;
  username: string;
  email: string;
}

const Navbar: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchNotifications();
    // Her 30 saniyede bir bildirimleri güncelle
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Bildirimler alınamadı');
    }
  };

  const markNotificationRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Bildirim işaretlenemedi');
    }
  };

  const handleUserSearch = async () => {
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
      console.error('Kullanıcı arama başarısız');
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/friends', { friend_id: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Arkadaşlık isteği gönderildi');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail;
      toast.error(errorMessage || 'Arkadaşlık isteği gönderilemedi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Başarıyla çıkış yapıldı');
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo ve Ana Sayfa */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MakaleHub
              </span>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-blue-50"
            >
              <Home className="h-5 w-5" />
              <span>Ana Sayfa</span>
            </button>
          </div>
          
          {/* Sağ Menü */}
          <div className="flex items-center space-x-4">
            {/* Yeni Makale */}
            <button
              onClick={() => navigate('/article/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Makale</span>
            </button>

            {/* Kullanıcı Arama */}
            <div className="relative">
              <button
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-blue-50"
              >
                <Search className="h-5 w-5" />
                <span>Kullanıcı Ara</span>
              </button>
              
              {showUserSearch && (
                <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 z-50">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                        placeholder="Kullanıcı ara..."
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <button
                        onClick={handleUserSearch}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                      >
                        Ara
                      </button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                            <div>
                              <div className="font-semibold text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                            <button
                              onClick={() => sendFriendRequest(user.id)}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium"
                            >
                              Arkadaş Ekle
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bildirimler */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-blue-50 relative"
              >
                <Bell className="h-5 w-5" />
                <span>Bildirimler</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 z-50">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Bildirimler</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Henüz bildirim yok</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border rounded-xl transition-all duration-200 ${
                              notification.read 
                                ? 'bg-gray-50/50 border-gray-200' 
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  {notification.type === 'friend_request' && <Users className="h-4 w-4 text-blue-600" />}
                                  {notification.type === 'collaboration_invite' && <MessageSquare className="h-4 w-4 text-green-600" />}
                                  <h4 className="font-semibold text-sm text-gray-900">{notification.title}</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleString('tr-TR')}
                                </p>
                              </div>
                              {!notification.read && (
                                <button
                                  onClick={() => markNotificationRead(notification.id)}
                                  className="ml-3 p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Kullanıcı Bilgisi */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-gray-100/50 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-gray-700">{currentUser?.username || 'Kullanıcı'}</span>
            </div>

            {/* Çıkış */}
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 