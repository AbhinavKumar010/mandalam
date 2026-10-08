import React, { useEffect, useRef, useState } from 'react';
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-center w-full">Create new post</h3>
          <button onClick={closeModal} aria-label="Close post composer" className="absolute right-4 text-neutral-400 hover:text-black dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <label className={`flex flex-1 items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 ${isRecording ? 'pointer-events-none opacity-50' : ''}`}>
              <ImageIcon size={17} />
              <span>Upload media</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={handleMediaChange} disabled={isRecording} className="hidden" />
            </label>
            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              disabled={isRecording}
              className="flex flex-1 items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              <Camera size={17} />
              <span>{cameraActive ? 'Close camera' : 'Record video'}</span>
            </button>
          </div>

          {cameraActive ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
              <video ref={cameraVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center bg-black/60 p-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-900"
                >
                  {isRecording ? <Square size={15} className="fill-red-500 text-red-500" /> : <Video size={17} />}
                  {isRecording ? 'Stop recording' : 'Start recording'}
                </button>
              </div>
            </div>
          ) : preview ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black flex items-center justify-center">
              {file.type.startsWith('video/') ? (
                <video src={preview} controls playsInline className="h-full w-full object-contain" />
              ) : (
                <img src={preview} alt="Post preview" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); }}
                aria-label="Remove selected media"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 dark:border-neutral-700">
              <ImageIcon size={38} className="mb-2" />
              <span className="text-sm">Choose a photo or video, or record one</span>
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