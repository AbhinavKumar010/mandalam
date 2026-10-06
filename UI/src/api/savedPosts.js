const STORAGE_KEY = 'savedPostIds';

export const getSavedPostIds = () => {
  try {
    const savedIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(savedIds) ? savedIds : [];
  } catch {
    return [];
  }
};

export const isPostSaved = (postId) => getSavedPostIds().includes(postId);

export const toggleSavedPost = (postId) => {
  const savedIds = getSavedPostIds();
  const nextIds = savedIds.includes(postId)
    ? savedIds.filter((id) => id !== postId)
    : [...savedIds, postId];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new CustomEvent('saved-posts-changed', { detail: nextIds }));
  return nextIds.includes(postId);
};