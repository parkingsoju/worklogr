import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from '@/lib/validations/auth'

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginInput) => api.post('/api/auth/login', data),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterInput) => api.post('/api/auth/register', data),
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: () => api.post('/api/auth/logout'),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordInput) => api.post('/api/auth/forgot-password', data),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordInput & { token: string }) =>
      api.post('/api/auth/reset-password', {
        token: data.token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }),
  })
}
