import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import API from '../api/axios';
import Avatar from './Avatar';

export default function StoryTray() {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [stories, setStories] = useState([]);
  const [selectedStories, setSelectedStories] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const hasToken = localStorage.getItem('token') || currentUser?.token;

    // Do not call protected endpoints without credentials
    if (!hasToken) return;

    API.get('/stories')
      .then(({ data }) => setStories(data))
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Stories could not be loaded.');
      });
  }, [currentUser?.token]);

  const storyGroups = useMemo(() => {
    const groups = new Map();
    stories.forEach((story) => {
      const userId = story.user?._id;
      if (!userId) return;
      if (!groups.has(userId)) groups.set(userId, { user: story.user, items: [] });
      groups.get(userId).items.push(story);
    });
    return [...groups.values()];
  }, [stories]);

  const ownStories = storyGroups.find((group) => group.user?._id === currentUser?._id)?.items || [];
  const otherStories = storyGroups.filter((group) => group.user?._id !== currentUser?._id);
  const activeStory = selectedStories?.[selectedIndex];

  const openStories = (items) => {
    setSelectedStories(items);
    setSelectedIndex(0);
  };

  const advanceStory = (direction) => {
    const nextIndex = selectedIndex + direction;
    if (!selectedStories || nextIndex < 0) return;
    if (nextIndex >= selectedStories.length) {
      setSelectedStories(null);
      return;
    }
    setSelectedIndex(nextIndex);
  };

  const handleUpload = async (event) => {
    const image = event.target.files?.[0];
    event.target.value = '';
    if (!image) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (image.size > 10 * 1024 * 1024) {
      setError('Story images must be 10 MB or smaller.');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    setUploading(true);
    setError('');

    try {
      const { data } = await API.post('/stories', formData);
      setStories((currentStories) => [...currentStories, data]);
      openStories([data]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Story upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <section aria-label="Stories" className="mb-4 border-y border-neutral-200 bg-white px-3 py-4 dark:border-neutral-800 dark:bg-neutral-950 md:rounded-xl md:border">
        <div className="flex items-start gap-4 overflow-x-auto pb-1">
          <div className="relative flex w-[68px] shrink-0 flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => ownStories.length && openStories(ownStories)}
              className="flex flex-col items-center gap-1.5"
              aria-label={ownStories.length ? 'View your story' : 'Add a story'}
            >
              <span className={`rounded-full p-[2px] ${ownStories.length ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                <Avatar
                  src={currentUser?.profilePic}
                  name={currentUser?.username}
                  className="h-14 w-14 border-2 border-white dark:border-neutral-950"
                />
              </span>
              <span className="max-w-[68px] truncate text-[11px] text-neutral-500">Your story</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Add to your story"
              className="absolute right-0 top-9 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white dark:border-neutral-950"
            >
              <Plus size={12} />
            </button>
          </div>

          {otherStories.map((group) => (
            <button
              key={group.user?._id}
              type="button"
              onClick={() => openStories(group.items)}
              className="flex w-[68px] shrink-0 flex-col items-center gap-1.5"
              aria-label={`View ${group.user?.username}'s story`}
            >
              <span className="rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 p-[2px]">
                <Avatar
                  src={group.user?.profilePic}
                  name={group.user?.username}
                  className="h-14 w-14 border-2 border-white dark:border-neutral-950"
                />
              </span>
              <span className="max-w-[68px] truncate text-[11px] text-neutral-600 dark:text-neutral-300">
                {group.user?.username}
              </span>
            </button>
          ))}
          {uploading && <span className="self-center text-xs text-neutral-500">Uploading story...</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
        {error && <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
      </section>

      {activeStory && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-3"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeStory.user?.username || 'User'}'s story`}
        >
          <div className="relative flex h-[min(90dvh,760px)] w-full max-w-[430px] items-center justify-center overflow-hidden rounded-xl bg-neutral-900">
            <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
              {selectedStories.map((story, index) => (
                <span
                  key={story._id}
                  className={`h-1 flex-1 rounded-full ${index <= selectedIndex ? 'bg-white' : 'bg-white/35'}`}
                />
              ))}
            </div>
            <div className="absolute inset-x-3 top-7 z-10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Avatar
                  src={activeStory.user?.profilePic}
                  name={activeStory.user?.username}
                  className="h-8 w-8 bg-neutral-700 text-xs text-white"
                />
                <span className="text-sm font-semibold">{activeStory.user?.username}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStories(null)}
                aria-label="Close story"
                className="p-1"
              >
                <X size={22} />
              </button>
            </div>
            <img
              src={activeStory.imageUrl}
              alt={`${activeStory.user?.username || 'User'}'s story`}
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => advanceStory(-1)}
              aria-label="Previous story"
              disabled={selectedIndex === 0}
              className="absolute inset-y-16 left-0 flex w-1/3 items-center justify-start pl-3 text-white disabled:opacity-0"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              onClick={() => advanceStory(1)}
              aria-label="Next story"
              className="absolute inset-y-16 right-0 flex w-1/3 items-center justify-end pr-3 text-white"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}