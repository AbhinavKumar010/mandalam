import React, { useState, useRef } from 'react';
import './PostCard.css';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile, X } from 'lucide-react';
import API from '../api/axios';
import { isPostSaved, toggleSavedPost } from '../api/savedPosts';
import Avatar from './Avatar';

export default function PostCard({ post, currentUserId }) {
  const mediaUrl = post.mediaUrl || post.videoUrl || post.imageUrl;
  const isVideoPost = post.mediaType === 'video' || Boolean(post.videoUrl);
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
      <article className="post-card">
        {/* Post Header */}
        <div className="post-card__header">
          <div className="post-card__identity">
            <div className="post-card__avatar-ring">
              <Avatar
                src={post.user?.profilePic}
                name={post.user?.username}
                className="post-card__avatar"
              />
            </div>
            <span className="post-card__username">
              {post.user?.username || 'Unknown creator'}
            </span>
          </div>
          <button className="post-card__more" aria-label="More post actions">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Media Frame with Double-Tap Trigger */}
        <div
          onClick={handleDoubleTap}
          className="post-card__media"
        >
          {isVideoPost ? (
            <video
              src={mediaUrl}
              aria-label={post.caption || 'Post video'}
              controls
              playsInline
              preload="metadata"
              onClick={(event) => event.stopPropagation()}
              className="post-card__media-asset"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={post.caption || 'Post image'}
              className="post-card__media-asset post-card__image"
              loading="lazy"
            />
          )}

          {showHeartOverlay && (
            <div className="post-card__heart-overlay">
              <Heart size={96} />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="post-card__body">
          <div className="post-card__actions">
            <div className="post-card__action-group">
              <button
                onClick={toggleLike}
                className={`post-card__icon-button ${isLiked ? 'post-card__icon-button--liked' : ''}`}
                aria-label="Like post"
              >
                <Heart
                  size={24}
                />
              </button>
              <button
                onClick={() => setShowCommentsModal(true)}
                className="post-card__icon-button"
                aria-label="Open comments"
              >
                <MessageCircle size={24} />
              </button>
              <button className="post-card__icon-button" aria-label="Share post">
                <Send size={24} />
              </button>
            </div>
            <button
              onClick={() => setIsSaved(toggleSavedPost(post._id))}
              className={`post-card__icon-button ${isSaved ? 'post-card__icon-button--saved' : ''}`}
              aria-label={isSaved ? 'Remove saved post' : 'Save post'}
              title={isSaved ? 'Remove saved post' : 'Save post'}
            >
              <Bookmark size={24} />
            </button>
          </div>

          {/* Likes */}
          <p className="post-card__likes">
            {likes.length.toLocaleString()} {likes.length === 1 ? 'like' : 'likes'}
          </p>

          {/* Caption */}
          {post.caption && (
            <p className="post-card__caption">
              <span className="post-card__caption-user">{post.user?.username}</span>
              {post.caption}
            </p>
          )}

          {/* Comments Preview */}
          {comments.length > 0 && (
            <div className="post-card__comments-preview">
              {comments.length > 2 && (
                <button
                  onClick={() => setShowCommentsModal(true)}
                  className="post-card__view-comments"
                >
                  View all {comments.length} comments
                </button>
              )}
              {comments.slice(-2).map((c, i) => (
                <p key={c._id || i} className="post-card__comment-preview">
                  <span className="post-card__comment-user">{c.user?.username || 'user'}</span>
                  {c.text}
                </p>
              ))}
            </div>
          )}

          {/* Quick Comment Input */}
          <form
            onSubmit={handleCommentSubmit}
            className="post-card__comment-form"
          >
            <Smile size={18} />
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="post-card__comment-input"
            />
            {commentInput.trim() && (
              <button
                type="submit"
                className="post-card__comment-submit"
              >
                Post
              </button>
            )}
          </form>
        </div>
      </article>

      {/* Full Comments Modal */}
      {showCommentsModal && (
        <div className="comments-overlay">
          <div className="comments-dialog">
            <div className="comments-dialog__header">
              <h3 className="comments-dialog__title">Comments</h3>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="comments-dialog__close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="comments-dialog__list">
              {comments.length === 0 ? (
                <p className="comments-dialog__empty">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c, i) => (
                  <div key={c._id || i} className="comments-dialog__item">
                    <div className="comments-dialog__initial">
                      {(c.user?.username || 'U')[0]}
                    </div>
                    <div>
                      <span className="post-card__comment-user">{c.user?.username || 'user'}</span>
                      <span className="comments-dialog__text">{c.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleCommentSubmit}
              className="comments-dialog__form"
            >
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="comments-dialog__input"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="post-card__comment-submit"
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