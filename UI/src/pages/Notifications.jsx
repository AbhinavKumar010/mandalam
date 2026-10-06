import React, { useEffect, useState } from 'react';
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
    <div className="min-h-screen bg-neutral-50 text-neutral-950 dark:bg-black dark:text-white">
      <MobileHeader />
      <div className="flex">
        <Sidebar />
        <main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-6 pb-20 md:px-8 md:py-10">
          <h1 className="mb-6 text-xl font-semibold">{typeFilter === 'like' ? 'Likes' : typeFilter === 'comment' ? 'Comments' : 'Notifications'}</h1>
          {loading && <p className="py-10 text-center text-sm text-neutral-500">Loading notifications...</p>}
          {!loading && error && <p role="alert" className="py-10 text-center text-sm text-red-500">{error}</p>}
          {!loading && !error && visibleNotifications.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-500">No activity yet.</p>
          )}
          {!loading && !error && visibleNotifications.map((item) => (
            <article key={item._id} className={`flex items-center gap-3 border-b border-neutral-200 px-2 py-4 dark:border-neutral-800 ${item.isRead ? '' : 'bg-rose-50/70 dark:bg-rose-950/20'}`}>
              <Avatar src={item.actor?.profilePic} name={item.actor?.username} className="h-10 w-10" />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{item.actor?.username || 'A user'}</span>{' '}
                {item.type === 'like' ? 'liked your post.' : 'commented on your post.'}
                <span className="ml-2 text-xs text-neutral-500">{new Date(item.createdAt).toLocaleDateString()}</span>
              </p>
              {item.post?.imageUrl && <img src={item.post.imageUrl} alt={item.post.caption || 'Post'} className="h-11 w-11 rounded object-cover" />}
            </article>
          ))}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}