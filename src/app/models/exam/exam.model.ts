// ============================================
// EXAM MODELS
// Vị trí: src/app/models/exam/exam.model.ts
// ============================================

export type SkillType = 'listening' | 'reading' | 'writing' | 'speaking';
export type VstepLevel = 3 | 4 | 5;
export type ExamStatus = 'not_purchased' | 'purchased' | 'in_progress' | 'completed';

export interface Exam {
  id: string;
  title: string;
  description: string;
  vstepLevel: VstepLevel;
  price: number;
  thumbnail?: string;
  duration: number;
  status: ExamStatus;
  progress?: ExamProgress;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamProgress {
  userId: string;
  examId: string;
  listening: SkillProgress;
  reading: SkillProgress;
  writing: SkillProgress;
  speaking: SkillProgress;
  overallScore?: number;
  completedAt?: Date;
}

export interface SkillProgress {
  isStarted: boolean;
  isCompleted: boolean;
  score?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SubmitAnswerDto {
  questionId: string;
  answer: string;
  score?: number;
  feedback?: string;
}

export interface SubmitResponseDto {
  submissionId: string;
  skill: SkillType;
  totalScore: number;
  bandScore: number;
  feedback: string;
}
