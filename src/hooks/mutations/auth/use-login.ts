import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AuthUser } from '@/domain/auth'
import type { HttpError } from '@/infra/lib/http-client'
import { authService, type Credentials } from '@/services/auth'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation<AuthUser, HttpError, Credentials>({
    mutationFn: authService.login,
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user)
    },
  })
}
