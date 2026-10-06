import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('_id username email fullName bio profilePic followers following');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      bio: user.bio,
      profilePic: user.profilePic,
      followers: user.followers.length,
      following: user.following.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || (
    process.env.NODE_ENV === 'production' ? null : 'chalchitra-local-development-secret'
  );
  if (!secret) throw new Error('JWT_SECRET must be configured in production');
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @desc   Register new user
// @route  POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      fullName: fullName || '',
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      bio: user.bio,
      profilePic: user.profilePic,
      followers: user.followers.length,
      following: user.following.length,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Authenticate user & get token
// @route  POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      bio: user.bio,
      profilePic: user.profilePic,
      followers: user.followers.length,
      following: user.following.length,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};