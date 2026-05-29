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
  fullName: string;
  userName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  userId?: string;
}

export interface UserProfileDto {
  id: string;
  fullName: string;
  email: string;
  userName: string;
  avatarUrl?: string | null;
  createdAt: Date;
}

export interface UpdateProfileDto {
  fullName?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
}

export interface UserDto {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
  vstepLevel?: number;
  isEmailConfirmed?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  statusCode: number;
}

