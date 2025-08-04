import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Users, Calendar, Mail } from 'lucide-react';

interface Friend {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get('/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Arkadaşlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/users/search?query=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Kullanıcı arama başarısız');
    }
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      await axios.post('/friends', { friend_id: friendId });
      toast.success('Arkadaş eklendi');
      fetchFriends();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Arkadaş eklenemedi');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Mail className="h-5 w-5" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-5 w-5" />
            <span>Katılım: {user?.created_at ? formatDate(user.created_at) : ''}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="h-5 w-5" />
            <span>{friends.length} arkadaş</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Arkadaşlar</h2>
        
        <div className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı ara..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSearchUsers}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Ara
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Arama Sonuçları</h3>
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <span className="font-medium">{user.username}</span>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleAddFriend(user.id)}
                    className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
                  >
                    Arkadaş Ekle
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz arkadaşınız yok</h3>
            <p className="text-gray-600">Yukarıdaki arama kutusunu kullanarak arkadaş ekleyebilirsiniz</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium">{friend.username}</span>
                  <p className="text-sm text-gray-500">{friend.email}</p>
                  <p className="text-xs text-gray-400">Katılım: {formatDate(friend.created_at)}</p>
                </div>
                <span className="text-sm text-green-600 font-medium">Arkadaş</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 