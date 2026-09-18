import mongoose, { Schema, Document } from 'mongoose';
import { EvaluationStatus } from '@/types';

export interface IEvaluationDoc extends Document {
  eventId: string;
  teamId: string;
  evaluatorId: string;
  status: EvaluationStatus;
  scores: {
    criterionId: string;
    criterionName: string;
    marks: number;
    maxMarks: number;
    comment?: string;
  }[];
  totalScore: number;
  maxPossibleScore: number;
  generalFeedback?: string;
  isLocked: boolean;
  submittedAt?: Date;
  auditTrail: {
    action: string;
    timestamp: Date;
    userId?: string;
    userName?: string;
    reason?: string;
    ip?: string;
    userAgent?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CriterionScoreSchema = new Schema(
  {
    criterionId: { type: String, required: true },
    criterionName: { type: String, required: true },
    marks: { type: Number, required: true, default: 0 },
    maxMarks: { type: Number, required: true },
    comment: { type: String, default: '' },
  },
  { _id: false }
);

const AuditTrailSchema = new Schema(
  {
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: String },
    userName: { type: String },
    reason: { type: String },
    ip: { type: String },
    userAgent: { type: String },
  },
  { _id: false }
);

const EvaluationSchema = new Schema<IEvaluationDoc>(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    evaluatorId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED'],
      default: 'DRAFT',
    },
    scores: [CriterionScoreSchema],
    totalScore: {
      type: Number,
      default: 0,
    },
    maxPossibleScore: {
      type: Number,
      default: 100,
    },
    generalFeedback: {
      type: String,
      default: '',
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
    },
    auditTrail: [AuditTrailSchema],
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Each evaluator has at most one evaluation per team per event
EvaluationSchema.index({ eventId: 1, teamId: 1, evaluatorId: 1 }, { unique: true });

// Virtual getters for prompt aliases
EvaluationSchema.virtual('projectId').get(function () {
  return this.teamId;
});

EvaluationSchema.virtual('totalMarks').get(function () {
  return this.totalScore;
});

EvaluationSchema.virtual('comments').get(function () {
  return this.generalFeedback;
});

EvaluationSchema.set('toJSON', { virtuals: true });
EvaluationSchema.set('toObject', { virtuals: true });

export const Evaluation =
  mongoose.models.Evaluation || mongoose.model<IEvaluationDoc>('Evaluation', EvaluationSchema);
