import React, { useEffect, useRef, useState } from 'react';
import './CreatePostModal.css';
import { Camera, Image as ImageIcon, Square, Video, X } from 'lucide-react';
import API from '../api/axios';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isOpenRef = useRef(isOpen);
  const cameraVideoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const discardRecordingRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (cameraActive && cameraVideoRef.current && streamRef.current) {
      cameraVideoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      discardRecordingRef.current = true;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  if (!isOpen) return null;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const closeModal = () => {
    isOpenRef.current = false;
    discardRecordingRef.current = true;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    stopCamera();
    onClose();
  };

  const setSelectedMedia = (selected) => {
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleMediaChange = (e) => {
    const selected = e.target.files[0];
    e.target.value = '';
    if (selected) {
      stopCamera();
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
      setSelectedMedia(selected);
    }
  };

  const startCamera = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Camera recording is not supported by this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: true,
      });
      if (!isOpenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setFile(null);
      setPreview(null);
      setCameraActive(true);
    } catch {
      setError('Could not access your camera or microphone. Check browser permissions and try again.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);

      recordingChunksRef.current = [];
      discardRecordingRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setIsRecording(false);
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          return;
        }

        const type = recorder.mimeType || 'video/webm';
        const recordedVideo = new File(
          recordingChunksRef.current,
          `recording-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`,
          { type: type.split(';')[0] },
        );
        if (recordedVideo.size > 100 * 1024 * 1024) {
          setError('Video must be 100 MB or smaller. Record a shorter clip and try again.');
        } else if (recordedVideo.size) {
          setError('');
          setSelectedMedia(recordedVideo);
        } else {
          setError('The recording was empty. Please try again.');
        }
        stopCamera();
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError('Could not start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
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
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not share this post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-overlay">
      <div className="create-post-dialog">
        <div className="create-post__header">
          <h3 className="create-post__title">Create new post</h3>
          <button onClick={closeModal} aria-label="Close post composer" className="create-post__close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-post__form">
          {error && <p role="alert" className="create-post__error">{error}</p>}
          <div className="create-post__actions">
            <label className={`create-post__media-button ${isRecording ? 'create-post__media-button--disabled' : ''}`}>
              <ImageIcon size={17} />
              <span>Upload media</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={handleMediaChange} disabled={isRecording} className="create-post__file-input" />
            </label>
            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              disabled={isRecording}
              className="create-post__media-button"
            >
              <Camera size={17} />
              <span>{cameraActive ? 'Close camera' : 'Record video'}</span>
            </button>
          </div>

          {cameraActive ? (
            <div className="create-post__camera-preview">
              <video ref={cameraVideoRef} autoPlay muted playsInline className="create-post__camera-feed" />
              <div className="create-post__record-bar">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="create-post__record-button"
                >
                  {isRecording ? <Square size={15} className="create-post__recording-icon" /> : <Video size={17} />}
                  {isRecording ? 'Stop recording' : 'Start recording'}
                </button>
              </div>
            </div>
          ) : preview ? (
            <div className="create-post__preview">
              {file.type.startsWith('video/') ? (
                <video src={preview} controls playsInline className="create-post__preview-media" />
              ) : (
                <img src={preview} alt="Post preview" className="create-post__preview-media" />
              )}
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); }}
                aria-label="Remove selected media"
                className="create-post__remove"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="create-post__empty">
              <ImageIcon size={38} />
              <span>Choose a photo or video, or record one</span>
            </div>
          )}

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="create-post__caption"
          />

          <button
            type="submit"
            disabled={!file || loading}
            className="create-post__submit"
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </form>
      </div>
    </div>
  );
}