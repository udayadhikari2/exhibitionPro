import mongoose, { Schema, Document } from 'mongoose';
import { ResultStatus, ITeamResult } from '@/types';

export interface IEventResultDoc extends Document {
  eventId: string;
  status: ResultStatus;
  publishedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  tieBreakCriteriaOrder: string[];
  results: ITeamResult[];
  totalTeams: number;
  totalEvaluations: number;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluatorScoreSummarySchema = new Schema(
  {
    evaluatorId: { type: String, required: true },
    evaluatorName: { type: String, required: true },
    totalScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    submittedAt: { type: String },
    criteriaBreakdown: [
      {
        criterionId: { type: String, required: true },
        criterionName: { type: String, required: true },
        marks: { type: Number, required: true },
      },
    ],
  },
  { _id: false }
);

const TeamResultSchema = new Schema(
  {
    teamId: { type: String, required: true },
    teamCode: { type: String, required: true },
    teamName: { type: String, required: true },
    projectTitle: { type: String, default: '' },
    stallNumber: { type: String },
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    evaluationsCount: { type: Number, default: 0 },
    assignedCount: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalScoreSum: { type: Number, default: 0 },
    maxPossibleScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    rankOverall: { type: Number, default: 0 },
    rankInCategory: { type: Number, default: 0 },
    isTied: { type: Boolean, default: false },
    tieBreakScores: { type: Map, of: Number, default: {} },
    evaluatorScores: [EvaluatorScoreSummarySchema],
  },
  { _id: false }
);

const EventResultSchema = new Schema<IEventResultDoc>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'],
      default: 'DRAFT',
      index: true,
    },
    publishedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: String },
    tieBreakCriteriaOrder: [{ type: String }],
    results: [TeamResultSchema],
    totalTeams: { type: Number, default: 0 },
    totalEvaluations: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const EventResult =
  mongoose.models.EventResult ||
  mongoose.model<IEventResultDoc>('EventResult', EventResultSchema);
