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
  MessageSquare
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
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">MakaleHub</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Kullanıcı Arama */}
            <div className="relative">
              <button
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800"
              >
                <Search className="h-5 w-5" />
                <span>Kullanıcı Ara</span>
              </button>
              
              {showUserSearch && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                        placeholder="Kullanıcı ara..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleUserSearch}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Ara
                      </button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                            <button
                              onClick={() => sendFriendRequest(user.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
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
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 relative"
              >
                <Bell className="h-5 w-5" />
                <span>Bildirimler</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Bildirimler</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Bildirim yok</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border rounded-lg ${
                              notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  {notification.type === 'friend_request' && <Users className="h-4 w-4 text-blue-600" />}
                                  {notification.type === 'collaboration_invite' && <MessageSquare className="h-4 w-4 text-green-600" />}
                                  <h4 className="font-medium text-sm">{notification.title}</h4>
                                </div>
                                <p className="text-sm text-gray-600">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.created_at).toLocaleString('tr-TR')}
                                </p>
                              </div>
                              {!notification.read && (
                                <button
                                  onClick={() => markNotificationRead(notification.id)}
                                  className="ml-2 p-1 text-green-600 hover:text-green-700"
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
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">{currentUser?.username || 'Kullanıcı'}</span>
            </div>

            {/* Çıkış */}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 