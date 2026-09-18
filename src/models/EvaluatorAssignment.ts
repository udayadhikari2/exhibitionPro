import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluatorAssignmentDoc extends Document {
  eventId: string;
  evaluatorId: string;
  teamId: string;
  assignedAt: Date;
  assignedBy?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

const EvaluatorAssignmentSchema = new Schema<IEvaluatorAssignmentDoc>(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    evaluatorId: {
      type: String,
      required: true,
      index: true,
    },
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: String,
      default: 'Admin',
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: An evaluator cannot be assigned twice to the same team in the same event
EvaluatorAssignmentSchema.index({ eventId: 1, evaluatorId: 1, teamId: 1 }, { unique: true });

export const EvaluatorAssignment =
  mongoose.models.EvaluatorAssignment ||
  mongoose.model<IEvaluatorAssignmentDoc>('EvaluatorAssignment', EvaluatorAssignmentSchema);
