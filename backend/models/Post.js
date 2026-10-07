import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    caption: { type: String, trim: true, default: '' },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    imageUrl: { type: String },
    videoUrl: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);