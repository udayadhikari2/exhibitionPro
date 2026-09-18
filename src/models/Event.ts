import mongoose, { Schema, Model, models } from 'mongoose';
import { IEvent } from '@/types';

const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [150, 'Event name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      trim: true,
      default: 'Science',
    },
    banner: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: String,
      required: [true, 'End date is required'],
    },
    registrationStart: {
      type: String,
      default: '',
    },
    registrationEnd: {
      type: String,
      default: '',
    },
    organizer: {
      type: String,
      trim: true,
      default: '',
    },
    contact: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'REGISTRATION_OPEN',
        'REGISTRATION_CLOSED',
        'EVALUATION_READY',
        'EVALUATION_RUNNING',
        'EVALUATION_COMPLETED',
        'RESULT_REVIEW',
        'RESULT_APPROVED',
        'RESULT_PUBLISHED',
        'COMPLETED',
        'ARCHIVED',
      ],
      default: 'DRAFT',
      required: true,
    },
    maxTeamSize: {
      type: Number,
      default: 4,
    },
    minTeamSize: {
      type: Number,
      default: 1,
    },
    rules: {
      type: String,
      default: '',
    },
    allowPublicFeedback: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual alias 'title' -> 'name'
EventSchema.virtual('title').get(function () {
  return this.name;
});

// Virtual alias 'bannerUrl' -> 'banner'
EventSchema.virtual('bannerUrl').get(function () {
  return this.banner;
});

EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

export const Event: Model<IEvent> = models.Event || mongoose.model<IEvent>('Event', EventSchema);
export default Event;
