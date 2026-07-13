// src/app/models/exam/exam.model.ts

export type SkillType = 'listening' | 'reading' | 'writing' | 'speaking';
export type VstepLevel = 3 | 4 | 5;
export type ExamStatus = 'not_purchased' | 'purchased' | 'in_progress' | 'completed';

// ✅ INTERFACE EXERCISE - ĐẦY ĐỦ CÁC TRƯỜNG CHO CẢ 2 FILE
export interface Exercise {
  id: string;
  skill: number;
  skillName?: string;
  title: string;
  description?: string;
  audioUrl?: string;
  passage?: string;
  passagesJson?: string;
  totalParts: number;
  totalQuestions: number;        // ✅ CÓ
  timeLimitSeconds: number;      // ✅ CÓ
  difficulty: number;
  isFullTest: boolean;           // ✅ CÓ
  attemptCount: number;
  source?: string;
  createdAt: string;
  
  // ✅ TRƯỜNG GIÁ TIỀN
  isFree: boolean;               // ✅ CÓ
  price: number;                 // ✅ CÓ
  
  // ✅ LIÊN KẾT FULL TEST
  fullTestId?: string;
  readingExerciseId?: string;
  listeningExerciseId?: string;
  writingExerciseId?: string;
  speakingExerciseId?: string;
  
  // Navigation properties
  parts?: Part[];
  readingQuestions?: ReadingQuestion[];
  listeningQuestions?: ListeningQuestion[];
  writingQuestions?: WritingQuestion[];
  speakingQuestions?: SpeakingQuestion[];
}

// ✅ CÁC INTERFACE KHÁC
export interface Part {
  id: string;
  partNumber: number;
  title: string;
  passage?: string;
  audioUrl?: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  orderNumber: number;
  questionText: string;
  options: { key: string; value: string }[];
  correctAnswer?: string;
  explanation?: string;
}

export interface ReadingQuestion extends Question {
  questionType: string;
  optionsJson: string;
}

export interface ListeningQuestion extends Question {
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  audioUrl?: string;
}

export interface WritingQuestion {
  id: string;
  exerciseId: string;
  taskType: number;
  promptText: string;
  sampleImageUrl?: string;
  modelAnswer?: string;
  rubricJson?: string;
  minWords: number;
  maxWords: number;
  recommendedTimeMinutes: number;
  orderNumber: number;
}

export interface SpeakingQuestion {
  id: string;
  exerciseId: string;
  partNumber: number;
  orderNumber: number;
  questionText: string;
  audioUrl?: string;
  preparationTime: number;
  speakingTime: number;
  sampleAnswer?: string;
}

export interface ExerciseDto extends Exercise {}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// GIỮ LẠI CÁC INTERFACE CŨ ĐỂ TƯƠNG THÍCH
// ============================================
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