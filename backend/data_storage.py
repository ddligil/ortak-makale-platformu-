import json
import os
from datetime import datetime
from typing import List, Dict, Optional
import uuid

class JSONStorage:
    def __init__(self):
        self.data_dir = "data"
        self.users_file = os.path.join(self.data_dir, "users.json")
        self.articles_file = os.path.join(self.data_dir, "articles.json")
        self.collaborations_file = os.path.join(self.data_dir, "collaborations.json")
        self.friendships_file = os.path.join(self.data_dir, "friendships.json")
        self.article_history_file = os.path.join(self.data_dir, "article_history.json")
        self.notifications_file = os.path.join(self.data_dir, "notifications.json")
        
        # Data klasörünü oluştur
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Dosyaları oluştur (eğer yoksa)
        self._init_files()
    
    def _init_files(self):
        """Dosyaları başlangıç durumunda oluştur"""
        files = [
            (self.users_file, []),
            (self.articles_file, []),
            (self.collaborations_file, []),
            (self.friendships_file, []),
            (self.article_history_file, []),
            (self.notifications_file, [])
        ]
        
        for file_path, default_data in files:
            if not os.path.exists(file_path):
                self._write_json(file_path, default_data)
    
    def _read_json(self, file_path: str) -> List[Dict]:
        """JSON dosyasını oku"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _write_json(self, file_path: str, data: List[Dict]):
        """JSON dosyasına yaz"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    
    # User işlemleri
    def create_user(self, username: str, email: str, hashed_password: str) -> Dict:
        users = self._read_json(self.users_file)
        
        # Email kontrolü
        if any(user['email'] == email for user in users):
            raise ValueError("Bu email zaten kayıtlı")
        
        # Username kontrolü
        if any(user['username'] == username for user in users):
            raise ValueError("Bu kullanıcı adı zaten kullanılıyor")
        
        user = {
            'id': len(users) + 1,
            'username': username,
            'email': email,
            'hashed_password': hashed_password,
            'created_at': datetime.utcnow().isoformat()
        }
        
        users.append(user)
        self._write_json(self.users_file, users)
        return user
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        users = self._read_json(self.users_file)
        for user in users:
            if user['email'] == email:
                return user
        return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        users = self._read_json(self.users_file)
        for user in users:
            if user['id'] == user_id:
                return user
        return None
    
    # Article işlemleri
    def create_article(self, title: str, content: str, author_id: int, is_public: bool = False) -> Dict:
        articles = self._read_json(self.articles_file)
        
        article = {
            'id': len(articles) + 1,
            'title': title,
            'content': content,
            'author_id': author_id,
            'is_public': is_public,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        articles.append(article)
        self._write_json(self.articles_file, articles)
        return article
    
    def get_article_by_id(self, article_id: int) -> Optional[Dict]:
        articles = self._read_json(self.articles_file)
        for article in articles:
            if article['id'] == article_id:
                return article
        return None
    
    def update_article(self, article_id: int, **kwargs) -> Optional[Dict]:
        articles = self._read_json(self.articles_file)
        
        for article in articles:
            if article['id'] == article_id:
                for key, value in kwargs.items():
                    if key in article:
                        article[key] = value
                article['updated_at'] = datetime.utcnow().isoformat()
                self._write_json(self.articles_file, articles)
                return article
        return None
    
    def get_user_articles(self, user_id: int, include_collaborations: bool = True) -> List[Dict]:
        articles = self._read_json(self.articles_file)
        user_articles = []
        
        for article in articles:
            if article['author_id'] == user_id:
                user_articles.append(article)
            elif include_collaborations:
                # İşbirlikçi olduğu makaleleri de ekle
                collaborations = self._read_json(self.collaborations_file)
                if any(c['article_id'] == article['id'] and c['user_id'] == user_id for c in collaborations):
                    user_articles.append(article)
        
        return user_articles
    
    def get_public_articles(self) -> List[Dict]:
        articles = self._read_json(self.articles_file)
        return [article for article in articles if article['is_public']]
    
    # Collaboration işlemleri
    def add_collaborator(self, article_id: int, user_id: int) -> bool:
        collaborations = self._read_json(self.collaborations_file)
        
        # Zaten işbirlikçi mi kontrol et
        if any(c['article_id'] == article_id and c['user_id'] == user_id for c in collaborations):
            return False
        
        collaboration = {
            'id': len(collaborations) + 1,
            'article_id': article_id,
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat()
        }
        
        collaborations.append(collaboration)
        self._write_json(self.collaborations_file, collaborations)
        return True
    
    def get_article_collaborators(self, article_id: int) -> List[Dict]:
        collaborations = self._read_json(self.collaborations_file)
        article_collaborators = []
        
        for collab in collaborations:
            if collab['article_id'] == article_id:
                user = self.get_user_by_id(collab['user_id'])
                if user:
                    article_collaborators.append(user)
        
        return article_collaborators
    
    def is_collaborator(self, article_id: int, user_id: int) -> bool:
        collaborations = self._read_json(self.collaborations_file)
        return any(c['article_id'] == article_id and c['user_id'] == user_id for c in collaborations)
    
    # Friendship işlemleri
    def add_friend(self, user_id: int, friend_id: int) -> bool:
        friendships = self._read_json(self.friendships_file)
        
        # Zaten arkadaş mı kontrol et
        if any((f['user_id'] == user_id and f['friend_id'] == friend_id) or 
               (f['user_id'] == friend_id and f['friend_id'] == user_id) for f in friendships):
            return False
        
        friendship = {
            'id': len(friendships) + 1,
            'user_id': user_id,
            'friend_id': friend_id,
            'created_at': datetime.utcnow().isoformat()
        }
        
        friendships.append(friendship)
        self._write_json(self.friendships_file, friendships)
        return True
    
    def get_user_friends(self, user_id: int) -> List[Dict]:
        friendships = self._read_json(self.friendships_file)
        friends = []
        
        for friendship in friendships:
            if friendship['user_id'] == user_id:
                friend = self.get_user_by_id(friendship['friend_id'])
                if friend:
                    friends.append(friend)
            elif friendship['friend_id'] == user_id:
                friend = self.get_user_by_id(friendship['user_id'])
                if friend:
                    friends.append(friend)
        
        return friends
    
    # Article history işlemleri
    def add_article_history(self, article_id: int, user_id: int, action: str, content: str, old_content: str = None) -> Dict:
        history = self._read_json(self.article_history_file)
        
        history_entry = {
            'id': len(history) + 1,
            'article_id': article_id,
            'user_id': user_id,
            'action': action,  # 'edit', 'delete', 'add'
            'content': content,
            'old_content': old_content,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        history.append(history_entry)
        self._write_json(self.article_history_file, history)
        return history_entry
    
    def get_article_history(self, article_id: int) -> List[Dict]:
        history = self._read_json(self.article_history_file)
        return [entry for entry in history if entry['article_id'] == article_id]
    
    # Notification işlemleri
    def create_notification(self, user_id: int, type: str, title: str, message: str, data: Dict = None) -> Dict:
        notifications = self._read_json(self.notifications_file)
        
        notification = {
            'id': len(notifications) + 1,
            'user_id': user_id,
            'type': type,  # 'friend_request', 'article_update', 'collaboration_invite'
            'title': title,
            'message': message,
            'data': data or {},
            'read': False,
            'created_at': datetime.utcnow().isoformat()
        }
        
        notifications.append(notification)
        self._write_json(self.notifications_file, notifications)
        return notification
    
    def get_user_notifications(self, user_id: int, unread_only: bool = False) -> List[Dict]:
        notifications = self._read_json(self.notifications_file)
        user_notifications = [n for n in notifications if n['user_id'] == user_id]
        
        if unread_only:
            user_notifications = [n for n in user_notifications if not n['read']]
        
        return sorted(user_notifications, key=lambda x: x['created_at'], reverse=True)
    
    def mark_notification_read(self, notification_id: int, user_id: int) -> bool:
        notifications = self._read_json(self.notifications_file)
        
        for notification in notifications:
            if notification['id'] == notification_id and notification['user_id'] == user_id:
                notification['read'] = True
                self._write_json(self.notifications_file, notifications)
                return True
        
        return False
    
    def mark_all_notifications_read(self, user_id: int) -> bool:
        notifications = self._read_json(self.notifications_file)
        updated = False
        
        for notification in notifications:
            if notification['user_id'] == user_id and not notification['read']:
                notification['read'] = True
                updated = True
        
        if updated:
            self._write_json(self.notifications_file, notifications)
        
        return updated
    
    # User search
    def search_users(self, query: str, exclude_user_id: int = None) -> List[Dict]:
        users = self._read_json(self.users_file)
        results = []
        
        for user in users:
            if exclude_user_id and user['id'] == exclude_user_id:
                continue
            
            if query.lower() in user['username'].lower():
                results.append(user)
        
        return results[:10]  # En fazla 10 sonuç

# Global storage instance
storage = JSONStorage() 