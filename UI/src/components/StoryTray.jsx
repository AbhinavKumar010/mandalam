import React, { useEffect, useMemo, useRef, useState } from 'react';
import './StoryTray.css';
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
      <section aria-label="Stories" className="story-tray">
        <div className="story-tray__list">
          <div className="story-person">
            <button
              type="button"
              onClick={() => ownStories.length && openStories(ownStories)}
              className="story-person__open"
              aria-label={ownStories.length ? 'View your story' : 'Add a story'}
            >
              <span className={`story-ring ${ownStories.length ? 'story-ring--active' : ''}`}>
                <Avatar
                  src={currentUser?.profilePic}
                  name={currentUser?.username}
                  className="story-avatar"
                />
              </span>
              <span className="story-person__name">Your story</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Add to your story"
              className="story-add"
            >
              <Plus size={12} />
            </button>
          </div>

          {otherStories.map((group) => (
            <button
              key={group.user?._id}
              type="button"
              onClick={() => openStories(group.items)}
              className="story-person__open story-person"
              aria-label={`View ${group.user?.username}'s story`}
            >
              <span className="story-ring story-ring--active">
                <Avatar
                  src={group.user?.profilePic}
                  name={group.user?.username}
                  className="story-avatar"
                />
              </span>
              <span className="story-person__name">
                {group.user?.username}
              </span>
            </button>
          ))}
          {uploading && <span className="story-upload-status">Uploading story...</span>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="story-file-input"
        />
        {error && <p role="alert" className="story-error">{error}</p>}
      </section>

      {activeStory && (
        <div
          className="story-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeStory.user?.username || 'User'}'s story`}
        >
          <div className="story-viewer__frame">
            <div className="story-viewer__progress">
              {selectedStories.map((story, index) => (
                <span
                  key={story._id}
                  className={`story-viewer__progress-item ${index <= selectedIndex ? 'story-viewer__progress-item--seen' : ''}`}
                />
              ))}
            </div>
            <div className="story-viewer__header">
              <div className="story-viewer__user">
                <Avatar
                  src={activeStory.user?.profilePic}
                  name={activeStory.user?.username}
                  className="story-viewer__user-avatar"
                />
                <span className="story-viewer__username">{activeStory.user?.username}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStories(null)}
                aria-label="Close story"
                className="story-viewer__close"
              >
                <X size={22} />
              </button>
            </div>
            <img
              src={activeStory.imageUrl}
              alt={`${activeStory.user?.username || 'User'}'s story`}
              className="story-viewer__image"
            />
            <button
              type="button"
              onClick={() => advanceStory(-1)}
              aria-label="Previous story"
              disabled={selectedIndex === 0}
              className="story-viewer__nav story-viewer__nav--previous"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              onClick={() => advanceStory(1)}
              aria-label="Next story"
              className="story-viewer__nav story-viewer__nav--next"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}