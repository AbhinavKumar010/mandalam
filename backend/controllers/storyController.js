import Story from '../models/Story.js';
import User from '../models/User.js';

const uploadedImageUrl = (req) => req.file.path.startsWith('http')
  ? req.file.path
  : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

export const getActiveStories = async (req, res) => {
  try {
    const visibleUsers = await User.find({
      $and: [
        { _id: { $nin: [req.user._id, ...(req.user.blockedUsers || [])] } },
        { blockedUsers: { $nin: [req.user._id] } },
        { $or: [{ isPrivate: { $ne: true } }, { followers: req.user._id }] },
      ],
    }).distinct('_id');
    visibleUsers.push(req.user._id);
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
      user: { $in: visibleUsers },
    })
      .populate('user', 'username profilePic')
      .sort({ createdAt: 1 });
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please choose an image for your story' });

    const story = await Story.create({
      user: req.user._id,
      imageUrl: uploadedImageUrl(req),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await story.populate('user', 'username profilePic');
    res.status(201).json(story);
  } catch (error) {
    console.error('Create story failed:', error);
    res.status(500).json({ message: error.message });
  }
};