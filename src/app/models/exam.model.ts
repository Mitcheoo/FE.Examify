// ============================================
// EXAM MODELS - Định nghĩa dữ liệu đề thi
// Vị trí: src/app/models/exam/exam.model.ts
// ============================================

export type SkillType = 'listening' | 'reading' | 'writing' | 'speaking';
export type VstepLevel = 3 | 4 | 5;
export type ExamStatus = 'not_purchased' | 'purchased' | 'in_progress' | 'completed';

// Đề thi tổng thể
export interface Exam {
  id: string;
  title: string;
  description: string;
  vstepLevel: VstepLevel;
  price: number;
  thumbnail?: string;
  duration: number; // Tổng thời gian (phút)
  status: ExamStatus;
  progress?: ExamProgress;
  createdAt: Date;
  updatedAt: Date;
}

// Tiến độ làm bài của user
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

// Tiến độ từng kỹ năng
export interface SkillProgress {
  isStarted: boolean;
  isCompleted: boolean;
  score?: number;
  startedAt?: Date;
  completedAt?: Date;
}

// Chi tiết đề thi (4 kỹ năng)
export interface ExamDetail extends Exam {
  listening: ListeningSection;
  reading: ReadingSection;
  writing: WritingSection;
  speaking: SpeakingSection;
}

// ========== LISTENING ==========
export interface ListeningSection {
  title: string;
  instructions: string;
  duration: number; // phút
  audioUrl: string;
  parts: ListeningPart[];
}

export interface ListeningPart {
  id: string;
  partNumber: number;
  title: string;
  instructions: string;
  audioUrl?: string;
  questions: ListeningQuestion[];
}

export interface ListeningQuestion {
  id: string;
  orderNumber: number;
  questionText: string;
  options?: QuestionOption[];
  correctAnswer: string;
  score: number;
}

// ========== READING ==========
export interface ReadingSection {
  title: string;
  instructions: string;
  duration: number;
  passages: ReadingPassage[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  questions: ReadingQuestion[];
}

export interface ReadingQuestion {
  id: string;
  orderNumber: number;
  questionText: string;
  options?: QuestionOption[];
  correctAnswer: string;
  score: number;
}

// ========== WRITING ==========
export interface WritingSection {
  title: string;
  instructions: string;
  duration: number;
  tasks: WritingTask[];
}

export interface WritingTask {
  id: string;
  taskNumber: number;
  type: 'letter' | 'essay' | 'report';
  questionText: string;
  wordLimit: number;
  suggestedAnswer?: string;
  score: number;
}

// ========== SPEAKING ==========
export interface SpeakingSection {
  title: string;
  instructions: string;
  duration: number;
  parts: SpeakingPart[];
}

export interface SpeakingPart {
  id: string;
  partNumber: number;
  title: string;
  instructions: string;
  preparationTime: number;
  speakingTime: number;
  questions: SpeakingQuestion[];
}

export interface SpeakingQuestion {
  id: string;
  orderNumber: number;
  questionText: string;
  sampleAnswer?: string;
  score: number;
}

// ========== COMMON ==========
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

// ========== SUBMISSION ==========
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
  details: AnswerDetail[];
}

export interface AnswerDetail {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  feedback?: string;
}