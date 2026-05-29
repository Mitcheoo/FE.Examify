// ============================================
// AUTH MODELS - VSTEP Master
// Vị trí: src/app/models/auth/auth.model.ts
// ============================================

export interface LoginRequest {
  userName: string;   
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: UserDto;
  expiresIn?: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
  vstepLevel?: number; // 3,4,5
  isEmailConfirmed?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  statusCode: number;
}