import mongoose from 'mongoose';
import User from '../models/User.js';

const listFields = ['closeFriends', 'blockedUsers', 'favoriteUsers', 'mutedUsers'];

const loadSettings = (userId) => User.findById(userId)
  .select('isPrivate closeFriends blockedUsers favoriteUsers mutedUsers')
  .populate('closeFriends', 'username profilePic')
  .populate('blockedUsers', 'username profilePic')
  .populate('favoriteUsers', 'username profilePic')
  .populate('mutedUsers', 'username profilePic');

export const getSettings = async (req, res) => {
  try {
    const settings = await loadSettings(req.user._id);
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { field, value, userId, action } = req.body;
    let update;

    if (field === 'isPrivate' && typeof value === 'boolean') {
      update = { $set: { isPrivate: value } };
    } else if (listFields.includes(field) && mongoose.Types.ObjectId.isValid(userId) && ['add', 'remove'].includes(action)) {
      if (userId === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot add yourself to this list' });
      }
      if (action === 'add' && !(await User.exists({ _id: userId }))) {
        return res.status(404).json({ message: 'User not found' });
      }
      update = action === 'add'
        ? { $addToSet: { [field]: userId } }
        : { $pull: { [field]: userId } };
    } else {
      return res.status(400).json({ message: 'Invalid settings update' });
    }

    await User.updateOne({ _id: req.user._id }, update);
    const settings = await loadSettings(req.user._id);
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPeople = async (req, res) => {
  try {
    const people = await User.find({
      _id: { $ne: req.user._id },
      username: { $type: 'string', $ne: '' },
    })
      .select('_id username fullName profilePic')
      .sort({ username: 1 })
      .limit(100)
      .lean();
    res.status(200).json(people);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};