export type UserRole = 'SUPER_ADMIN' | 'EVENT_ADMIN' | 'EVALUATOR' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type EventStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'EVALUATION_READY'
  | 'EVALUATION_RUNNING'
  | 'EVALUATION_COMPLETED'
  | 'RESULT_REVIEW'
  | 'RESULT_APPROVED'
  | 'RESULT_PUBLISHED'
  | 'COMPLETED'
  | 'ARCHIVED';

export const EVENT_STATUS_FLOW: EventStatus[] = [
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
];

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export type TeamStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CORRECTION_REQUIRED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_CORRECTION'; // alias for CORRECTION_REQUIRED

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  isActive?: boolean;
  avatar?: string;
  institution?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface ISessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  institution?: string;
}

export interface IEvent {
  _id: string;
  name: string;
  title?: string; // alias for name
  slug: string;
  description: string;
  eventType: string;
  banner?: string;
  bannerUrl?: string; // alias for banner
  logo?: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationStart?: string;
  registrationEnd?: string;
  organizer?: string;
  contact?: string;
  status: EventStatus;
  maxTeamSize?: number;
  minTeamSize?: number;
  rules?: string;
  allowPublicFeedback?: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategory {
  _id: string;
  eventId: string;
  name: string;
  description?: string;
  code?: string;
  order: number;
  status: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CriterionStatus = 'ACTIVE' | 'INACTIVE';

export interface IEvaluationCriterion {
  _id: string;
  eventId: string;
  categoryId?: string | null;
  categoryName?: string;
  name: string;
  description: string;
  maxMarks: number;
  minMarks: number;
  weight?: number;
  order: number;
  required?: boolean;
  isRequired?: boolean;
  status?: CriterionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITeamMember {
  _id?: string;
  teamId?: string;
  name: string;
  class?: string;
  grade?: string;
  section?: string;
  rollNumber?: string;
  rollNo?: string;
  role: string;
  contact?: string;
  email?: string;
  gradeOrDept?: string;
}

export interface IProjectFile {
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'presentation' | 'other';
  size?: number;
}

export interface IProject {
  teamId?: string;
  title: string;
  shortDescription: string;
  problemStatement?: string;
  objectives?: string;
  methodology?: string;
  innovation?: string;
  materials?: string;
  technologyUsed?: string;
  expectedOutcome?: string;
  futureScope?: string;
  projectCost?: string | number;
  files?: IProjectFile[];
  videoUrl?: string;
  gallery?: string[];
  documents?: IProjectFile[];
}

export interface IPublicProject {
  id: string;
  teamCode: string;
  teamName: string;
  projectTitle: string;
  shortDescription: string;
  stallNumber?: string;
  category: {
    id: string;
    name: string;
  };
  class?: string;
  grade?: string;
  section?: string;
  school?: string;
  institution?: string;
  members: {
    name: string;
    role?: string;
    class?: string;
  }[];
  mentorName?: string;
  mentorDesignation?: string;
  problemStatement?: string;
  objectives?: string;
  methodology?: string;
  innovation?: string;
  materials?: string;
  technologyUsed?: string;
  expectedOutcome?: string;
  futureScope?: string;
  projectCost?: string | number;
  files?: IProjectFile[];
  gallery?: string[];
  documents?: IProjectFile[];
  videoUrl?: string;
  qrCodeUrl?: string;
}

export interface ITeam {
  _id: string;
  eventId: string;
  categoryId: string;
  teamCode: string;
  teamName: string;
  title?: string; // alias
  abstract?: string; // alias
  techStack?: string;
  class?: string;
  grade?: string;
  section?: string;
  school?: string;
  institution?: string;
  teamLeader: {
    name: string;
    email: string;
    phone?: string;
    userId?: string;
  };
  teamLeaderId?: string; // alias
  contact?: string;
  mentor?: {
    name: string;
    email?: string;
    phone?: string;
    designation?: string;
  };
  status: TeamStatus;
  stallNumber?: string;
  tableNumber?: string; // alias
  correctionRemarks?: string;
  members: ITeamMember[];
  project?: IProject;
  projectLinks?: { title: string; url: string }[];
  mediaUrls?: string[];
  qrCodeUrl?: string;
  qrCodeData?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface IAssignment {
  _id: string;
  eventId: string;
  evaluatorId: string;
  teamId: string;
  assignedAt: string;
  assignedBy?: string;
  status?: AssignmentStatus;
  evaluatorName?: string;
  evaluatorEmail?: string;
  teamCode?: string;
  teamName?: string;
  projectTitle?: string;
  stallNumber?: string;
  categoryName?: string;
}

export interface IEvaluatorWithStats extends IUser {
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
}

export interface ICriterionScore {
  criterionId: string;
  criterionName: string;
  marks: number;
  maxMarks: number;
  comment?: string;
}

export type EvaluationStatus = 'DRAFT' | 'SUBMITTED';

export interface IEvaluation {
  _id: string;
  eventId: string;
  teamId: string;
  projectId?: string;
  evaluatorId: string;
  evaluatorName?: string;
  status?: EvaluationStatus;
  scores: ICriterionScore[];
  totalScore: number;
  totalMarks?: number;
  maxPossibleScore: number;
  generalFeedback?: string;
  comments?: string;
  isLocked: boolean;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  auditTrail?: {
    action: string;
    timestamp: string;
    userId?: string;
    userName?: string;
    reason?: string;
    ip?: string;
    userAgent?: string;
  }[];
}

export interface IVisitorFeedback {
  _id: string;
  eventId: string;
  teamId: string;
  visitorName: string;
  visitorType: string;
  rating: number;
  comments: string;
  createdAt: string;
}

export type ResultStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';

export interface IEvaluatorScoreSummary {
  evaluatorId: string;
  evaluatorName: string;
  totalScore: number;
  maxScore: number;
  submittedAt?: string;
  criteriaBreakdown?: { criterionId: string; criterionName: string; marks: number }[];
}

export interface ITeamResult {
  teamId: string;
  teamCode: string;
  teamName: string;
  projectTitle: string;
  stallNumber?: string;
  categoryId: string;
  categoryName: string;
  evaluationsCount: number;
  assignedCount: number;
  averageScore: number;
  totalScoreSum: number;
  maxPossibleScore: number;
  percentage: number;
  rankOverall: number;
  rankInCategory: number;
  isTied: boolean;
  tieBreakScores: Record<string, number>; // criterionId -> average score
  evaluatorScores?: IEvaluatorScoreSummary[];
}

export interface IEventResult {
  _id?: string;
  eventId: string;
  status: ResultStatus;
  publishedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  tieBreakCriteriaOrder: string[]; // criterion IDs in priority order
  results: ITeamResult[];
  totalTeams: number;
  totalEvaluations: number;
  createdAt?: string;
  updatedAt?: string;
}

