import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  name: string | null;
  isGroupChat: boolean;
  users: mongoose.Types.ObjectId[];
  admin: mongoose.Types.ObjectId | null;
  latestMessage: mongoose.Types.ObjectId | null;
}

const chatSchema = new Schema<IChat>(
  {
    name: {
      type: String,
      trim: true,
      default: null
    },
    isGroupChat: {
      type: Boolean,
      default: false
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    latestMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model<IChat>('Chat', chatSchema);