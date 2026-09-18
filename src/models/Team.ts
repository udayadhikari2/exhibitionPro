import mongoose, { Schema, Document, Model } from 'mongoose';
import { ITeam, TeamStatus } from '@/types';

export interface ITeamDocument extends Omit<ITeam, '_id'>, Document {}

const TeamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    class: { type: String, trim: true },
    grade: { type: String, trim: true },
    section: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    rollNo: { type: String, trim: true },
    role: { type: String, default: 'Member', trim: true },
    contact: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { _id: true }
);

const ProjectFileSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['image', 'pdf', 'presentation', 'other'],
      default: 'other',
    },
    size: { type: Number },
  },
  { _id: true }
);

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    problemStatement: { type: String, trim: true },
    objectives: { type: String, trim: true },
    methodology: { type: String, trim: true },
    innovation: { type: String, trim: true },
    materials: { type: String, trim: true },
    technologyUsed: { type: String, trim: true },
    expectedOutcome: { type: String, trim: true },
    futureScope: { type: String, trim: true },
    projectCost: { type: Schema.Types.Mixed },
    files: [ProjectFileSchema],
    videoUrl: { type: String, trim: true },
    gallery: [{ type: String }],
    documents: [ProjectFileSchema],
  },
  { _id: false }
);

const TeamSchema = new Schema<ITeamDocument>(
  {
    eventId: { type: String, required: true, index: true },
    categoryId: { type: String, required: true, index: true },
    teamCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    teamName: { type: String, required: true, trim: true },
    class: { type: String, trim: true },
    grade: { type: String, trim: true },
    section: { type: String, trim: true },
    school: { type: String, trim: true },
    institution: { type: String, trim: true },
    teamLeader: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      userId: { type: String },
    },
    contact: { type: String, trim: true },
    mentor: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      designation: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'CORRECTION_REQUIRED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION'],
      default: 'DRAFT',
      index: true,
    },
    stallNumber: { type: String, trim: true },
    correctionRemarks: { type: String, trim: true },
    members: { type: [TeamMemberSchema], default: [] },
    project: { type: ProjectSchema },
    qrCodeUrl: { type: String },
    createdBy: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret._id = ret._id ? ret._id.toString() : ret._id;
        // Aliases for dual-compatibility
        if (!ret.title && ret.project?.title) ret.title = ret.project.title;
        if (!ret.title && ret.teamName) ret.title = ret.teamName;
        if (!ret.abstract && ret.project?.shortDescription) ret.abstract = ret.project.shortDescription;
        if (!ret.tableNumber && ret.stallNumber) ret.tableNumber = ret.stallNumber;
        if (!ret.stallNumber && ret.tableNumber) ret.stallNumber = ret.tableNumber;
        if (!ret.institution && ret.school) ret.institution = ret.school;
        if (!ret.school && ret.institution) ret.school = ret.institution;
        if (!ret.grade && ret.class) ret.grade = ret.class;
        if (!ret.class && ret.grade) ret.class = ret.grade;
        return ret;
      },
    },
  }
);

// Virtual getters for compatibility
TeamSchema.virtual('title').get(function (this: any) {
  return this.project?.title || this.teamName;
});
TeamSchema.virtual('abstract').get(function (this: any) {
  return this.project?.shortDescription || '';
});
TeamSchema.virtual('tableNumber').get(function (this: any) {
  return this.stallNumber;
});

export const Team: Model<ITeamDocument> =
  mongoose.models.Team || mongoose.model<ITeamDocument>('Team', TeamSchema);
