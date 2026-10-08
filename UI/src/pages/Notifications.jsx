import React, { useEffect, useState } from 'react';
import './Notifications.css';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import API from '../api/axios';

export default function Notifications() {
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const typeFilter = searchParams.get('type');

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data } = await API.get('/notifications');
        setNotifications(data);
        await API.patch('/notifications/read');
        setNotifications(data.map((item) => ({ ...item, isRead: true })));
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not load notifications.');
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  const visibleNotifications = notifications.filter((item) => !typeFilter || item.type === typeFilter);

  return (
    <div className="notifications-page">
      <MobileHeader />
      <div className="notifications-page__layout">
        <Sidebar />
        <main className="notifications-page__content">
          <h1 className="notifications-page__title">{typeFilter === 'like' ? 'Likes' : typeFilter === 'comment' ? 'Comments' : 'Notifications'}</h1>
          {loading && <p className="notifications-page__state">Loading notifications...</p>}
          {!loading && error && <p role="alert" className="notifications-page__state notifications-page__state--error">{error}</p>}
          {!loading && !error && visibleNotifications.length === 0 && (
            <p className="notifications-page__state">No activity yet.</p>
          )}
          {!loading && !error && visibleNotifications.map((item) => (
            <article key={item._id} className={`notification-item ${item.isRead ? '' : 'notification-item--unread'}`}>
              <Avatar src={item.actor?.profilePic} name={item.actor?.username} className="notification-item__avatar" />
              <p className="notification-item__text">
                <span className="notification-item__actor">{item.actor?.username || 'A user'}</span>{' '}
                {item.type === 'like' ? 'liked your post.' : 'commented on your post.'}
                <span className="notification-item__date">{new Date(item.createdAt).toLocaleDateString()}</span>
              </p>
              {item.post?.imageUrl && <img src={item.post.imageUrl} alt={item.post.caption || 'Post'} className="notification-item__post" />}
            </article>
          ))}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}