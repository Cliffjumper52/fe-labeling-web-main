export interface VerifyResetPasswordTokenDto {
  token: string;
  password: string;
  confirmPassword: string;
}
