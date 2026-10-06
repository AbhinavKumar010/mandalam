import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile, X } from 'lucide-react';
import API from '../api/axios';
import { isPostSaved, toggleSavedPost } from '../api/savedPosts';
import Avatar from './Avatar';

export default function PostCard({ post, currentUserId }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentInput, setCommentInput] = useState('');
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [isSaved, setIsSaved] = useState(() => isPostSaved(post._id));
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const lastTapRef = useRef(0);

  // Safe user comparison whether likes array contains string IDs or populated objects
  const isLiked = likes.some(
    (id) => (id?._id || id)?.toString() === currentUserId?.toString()
  );

  // Optimistic Like / Unlike Handler
  const toggleLike = async () => {
    const previousLikes = [...likes];
    const nextLikes = isLiked
      ? likes.filter((id) => (id?._id || id)?.toString() !== currentUserId?.toString())
      : [...likes, currentUserId];

    setLikes(nextLikes);

    try {
      const { data } = await API.put(`/posts/${post._id}/like`);
      if (Array.isArray(data)) setLikes(data);
    } catch {
      setLikes(previousLikes); // Rollback on network failure
    }
  };

  // Double Tap gesture detection
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        toggleLike();
      }
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 900);
    }
    lastTapRef.current = now;
  };

  // Optimistic Comment Submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newCommentPayload = { text: commentInput.trim() };
    const optimisticComment = {
      _id: Date.now().toString(),
      text: commentInput.trim(),
      user: {
        username: JSON.parse(localStorage.getItem('user') || '{}')?.username || 'you',
      },
    };

    setComments((prev) => [...prev, optimisticComment]);
    setCommentInput('');

    try {
      const { data } = await API.post(`/posts/${post._id}/comment`, newCommentPayload);
      if (Array.isArray(data)) setComments(data);
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  return (
    <>
      <style>{`
        @keyframes heartPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 0.95; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-heart-pop {
          animation: heartPop 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      <article className="border border-neutral-200 dark:border-neutral-800 rounded-xl mb-4 bg-white dark:bg-black max-w-[470px] w-full mx-auto overflow-hidden select-none">
        {/* Post Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 to-fuchsia-600 flex items-center justify-center">
              <Avatar
                src={post.user?.profilePic}
                name={post.user?.username}
                className="h-full w-full border border-white dark:border-black"
              />
            </div>
            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
              {post.user?.username || 'Unknown creator'}
            </span>
          </div>
          <button className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Media Frame with Double-Tap Trigger */}
        <div
          onClick={handleDoubleTap}
          className="relative w-full aspect-square bg-neutral-950 flex items-center justify-center cursor-pointer overflow-hidden"
        >
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post image'}
            className="w-full h-full object-cover pointer-events-none"
            loading="lazy"
          />

          {showHeartOverlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart size={96} className="fill-white text-white drop-shadow-2xl animate-heart-pop" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLike}
                className="transition-transform active:scale-125 focus:outline-none"
                aria-label="Like post"
              >
                <Heart
                  size={24}
                  className={
                    isLiked
                      ? 'fill-red-500 text-red-500 scale-105 transition-transform'
                      : 'text-neutral-800 dark:text-neutral-200 hover:text-neutral-500'
                  }
                />
              </button>
              <button
                onClick={() => setShowCommentsModal(true)}
                className="text-neutral-800 dark:text-neutral-200 hover:text-neutral-500 transition-colors"
                aria-label="Open comments"
              >
                <MessageCircle size={24} />
              </button>
              <button className="text-neutral-800 dark:text-neutral-200 hover:text-neutral-500 transition-colors">
                <Send size={24} />
              </button>
            </div>
            <button
              onClick={() => setIsSaved(toggleSavedPost(post._id))}
              className="text-neutral-800 dark:text-neutral-200 transition-transform active:scale-110"
              aria-label={isSaved ? 'Remove saved post' : 'Save post'}
              title={isSaved ? 'Remove saved post' : 'Save post'}
            >
              <Bookmark size={24} className={isSaved ? 'fill-black dark:fill-white' : ''} />
            </button>
          </div>

          {/* Likes */}
          <p className="font-semibold text-xs mb-1 text-neutral-900 dark:text-neutral-100">
            {likes.length.toLocaleString()} {likes.length === 1 ? 'like' : 'likes'}
          </p>

          {/* Caption */}
          {post.caption && (
            <p className="text-xs mb-1.5 text-neutral-900 dark:text-neutral-100 break-words">
              <span className="font-semibold mr-1.5">{post.user?.username}</span>
              {post.caption}
            </p>
          )}

          {/* Comments Preview */}
          {comments.length > 0 && (
            <div className="mb-2">
              {comments.length > 2 && (
                <button
                  onClick={() => setShowCommentsModal(true)}
                  className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-1"
                >
                  View all {comments.length} comments
                </button>
              )}
              {comments.slice(-2).map((c, i) => (
                <p key={c._id || i} className="text-xs text-neutral-900 dark:text-neutral-100 truncate">
                  <span className="font-semibold mr-1.5">{c.user?.username || 'user'}</span>
                  {c.text}
                </p>
              ))}
            </div>
          )}

          {/* Quick Comment Input */}
          <form
            onSubmit={handleCommentSubmit}
            className="flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-2.5 mt-2"
          >
            <Smile size={18} className="text-neutral-400 cursor-pointer hover:text-neutral-600" />
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="w-full text-xs bg-transparent outline-none placeholder-neutral-500 text-neutral-900 dark:text-white"
            />
            {commentInput.trim() && (
              <button
                type="submit"
                className="text-xs font-semibold text-blue-500 hover:text-blue-700"
              >
                Post
              </button>
            )}
          </form>
        </div>
      </article>

      {/* Full Comments Modal */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-sm w-full text-center">Comments</h3>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {comments.length === 0 ? (
                <p className="text-xs text-center text-neutral-500 py-8">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c, i) => (
                  <div key={c._id || i} className="flex items-start gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0">
                      {(c.user?.username || 'U')[0]}
                    </div>
                    <div>
                      <span className="font-semibold mr-1.5">{c.user?.username || 'user'}</span>
                      <span className="text-neutral-800 dark:text-neutral-200">{c.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleCommentSubmit}
              className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2 outline-none"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="text-xs font-semibold text-blue-500 disabled:opacity-40"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}