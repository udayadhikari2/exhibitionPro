import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluationCriteriaDoc extends Document {
  eventId: string;
  categoryId?: string | null;
  name: string;
  description: string;
  maxMarks: number;
  minMarks: number;
  weight?: number;
  order: number;
  required: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationCriteriaSchema = new Schema<IEvaluationCriteriaDoc>(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    categoryId: {
      type: String,
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    minMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    weight: {
      type: Number,
      default: 1,
    },
    order: {
      type: Number,
      default: 1,
    },
    required: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EvaluationCriteriaSchema.index({ eventId: 1, categoryId: 1, order: 1 });

export const EvaluationCriteria =
  mongoose.models.EvaluationCriteria ||
  mongoose.model<IEvaluationCriteriaDoc>('EvaluationCriteria', EvaluationCriteriaSchema);
