import { useMutation } from '@tanstack/react-query'
import { api, setToken, clearToken } from '@/lib/api'
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from '@/lib/validations/auth'

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await api.post('/api/auth/login', data)
      setToken(res.token)
      return res
    },
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
    onSettled: () => clearToken(),
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
