import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const notifyPostOwner = async (post, actorId, type) => {
  if (post.user.toString() === actorId.toString()) return;
  try {
    await Notification.create({ recipient: post.user, actor: actorId, post: post._id, type });
  } catch (error) {
    console.error('Create post notification failed:', error);
  }
};

// Create a post
export const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    const newPost = new Post({
      caption: req.body.caption || '',
      imageUrl: req.file.path.startsWith('http')
        ? req.file.path
        : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      user: req.user._id,
    });
    const savedPost = await newPost.save();
    await savedPost.populate('user', 'username profilePic');
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Create post failed:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Feed Posts
export const getFeedPosts = async (req, res) => {
  try {
    const visibleUsers = await User.find({
      $and: [
        { _id: { $nin: [req.user._id, ...(req.user.blockedUsers || [])] } },
        { blockedUsers: { $nin: [req.user._id] } },
        { $or: [{ isPrivate: { $ne: true } }, { followers: req.user._id }] },
      ],
    }).distinct('_id');
    visibleUsers.push(req.user._id);
    const posts = await Post.find({ user: { $in: visibleUsers } })
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like / Unlike Post
export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) {
      post.likes = post.likes.filter((userId) => userId.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    if (!isLiked) await notifyPostOwner(post, req.user._id, 'like');
    res.status(200).json(post.likes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = { user: req.user._id, text };
    post.comments.push(comment);
    await post.save();
    await notifyPostOwner(post, req.user._id, 'comment');

    const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'username profilePic');
    res.status(201).json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};