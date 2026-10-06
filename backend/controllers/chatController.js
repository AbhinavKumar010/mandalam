import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get all messages for a specific 1-on-1 room
// @route   GET /api/chat/:roomId
export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ roomId })
      .populate('sender', 'username profilePic fullName')
      .populate('recipient', 'username profilePic fullName')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all available users to chat with (excluding current user)
// @route   GET /api/chat/users
export const getChatUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id, $nin: req.user.blockedUsers || [] },
      blockedUsers: { $nin: [req.user._id] },
    })
      .select('username fullName profilePic')
      .lean();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save a message directly via REST API (fallback if socket drops)
// @route   POST /api/chat/send
export const saveMessage = async (req, res) => {
  try {
    const { roomId, recipientId, text } = req.body;

    if (!roomId || !recipientId || !text) {
      return res.status(400).json({ message: 'Missing required message parameters' });
    }

    const newMessage = await Message.create({
      roomId,
      sender: req.user._id,
      recipient: recipientId,
      text,
    });

    const populatedMessage = await newMessage.populate(
      'sender',
      'username profilePic fullName'
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};