import mongoose, { Schema, Model, models } from 'mongoose';
import { IUser } from '@/types';

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name must be less than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Username or email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9._-]+)$/,
        'Please enter a valid email or username',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['SUPER_ADMIN', 'EVENT_ADMIN', 'EVALUATOR', 'STUDENT'],
        message: '{VALUE} is not a valid role',
      },
      default: 'STUDENT',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: '{VALUE} is not a valid status',
      },
      default: 'ACTIVE',
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    institution: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent exposing passwordHash when serializing to JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
