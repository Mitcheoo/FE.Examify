export type SkillType = 'reading' | 'listening' | 'writing' | 'speaking';
export type VstepLevel = 3 | 4 | 5;
export type ExamStatus = 'not_purchased' | 'purchased' | 'in_progress' | 'completed';
export type SkillStatus = 'locked' | 'available' | 'completed';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  vstepLevel: VstepLevel;
  price: number;
  thumbnail?: string;
  duration: number;
  skillType: SkillType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamDetail {
  id: string;
  title: string;
  description: string;
  vstepLevel: VstepLevel;
  price: number;
  duration: number;
  skills: SkillProgress[];
}

export interface SkillProgress {
  skillType: SkillType;
  skillName: string;
  duration: number;
  status: SkillStatus;
  score?: number;
  submittedAt?: Date;
}

export interface ReadingExamDto {
  id: string;
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
  options?: string[];
  correctAnswer: string;
  score: number;
}

export interface ListeningExamDto {
  id: string;
  title: string;
  instructions: string;
  duration: number;
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
  options?: string[];
  correctAnswer: string;
  score: number;
}

export interface WritingExamDto {
  id: string;
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

export interface SpeakingExamDto {
  id: string;
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

export interface SubmitAnswerDto {
  questionId: string;
  answer: string;
}

export interface SubmitReadingRequest {
  exerciseId: string;
  answers: SubmitAnswerDto[];
  timeSpentSeconds: number;
}

export interface SubmitListeningRequest {
  exerciseId: string;
  answers: SubmitAnswerDto[];
  timeSpentSeconds: number;
}

export interface SubmitWritingRequest {
  exerciseId: string;
  essayText: string;
  timeSpentSeconds: number;
}

export interface SubmitSpeakingRequest {
  exerciseId: string;
  audioUrl: string;
  transcript?: string;
  timeSpentSeconds: number;
}

export interface SubmissionResultDto {
  submissionId: string;
  exerciseId: string;
  skillType: SkillType;
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

export interface ExerciseProgressDto {
  exerciseId: string;
  title: string;
  skills: {
    reading: SkillProgressDetail;
    listening: SkillProgressDetail;
    writing: SkillProgressDetail;
    speaking: SkillProgressDetail;
  };
}

export interface SkillProgressDetail {
  isStarted: boolean;
  isCompleted: boolean;
  score?: number;
  submittedAt?: Date;
}
