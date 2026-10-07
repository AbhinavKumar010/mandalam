import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import API from '../api/axios';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleMediaChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const isVideo = ['video/mp4', 'video/webm'].includes(selected.type);
      const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(selected.type);
      if (!isImage && !isVideo) {
        setFile(null);
        setPreview(null);
        setError('Choose a JPG, PNG, WebP, MP4, or WebM file.');
        return;
      }
      const maxSize = isVideo ? 100 : 10;
      if (selected.size > maxSize * 1024 * 1024) {
        setFile(null);
        setPreview(null);
        setError(`${isVideo ? 'Video' : 'Image'} must be ${maxSize} MB or smaller.`);
        return;
      }
      setError('');
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);
    formData.append('caption', caption);

    try {
      setLoading(true);
      const { data } = await API.post('/posts', formData);
      onPostCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not share this post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-center w-full">Create new post</h3>
          <button onClick={onClose} className="absolute right-4 text-neutral-400 hover:text-black dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
          {!preview ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 h-64 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <ImageIcon size={48} className="text-neutral-400 mb-2" />
              <span className="text-sm font-medium text-neutral-500">Select a photo or video</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={handleMediaChange} className="hidden" />
            </label>
          ) : (
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
              {file.type.startsWith('video/') ? (
                <video src={preview} controls playsInline className="h-full w-full object-contain" />
              ) : (
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              )}
            </div>
          )}

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 text-sm outline-none resize-none h-20"
          />

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </form>
      </div>
    </div>
  );
}