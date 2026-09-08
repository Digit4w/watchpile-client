import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AuthUser } from '@/domain/auth'
import { setupKeys } from '@/hooks/queries/setup/use-setup-status'
import type { HttpError } from '@/infra/lib/http-client'
import { type Credentials, setupService } from '@/services/setup'

export function useCreateAdmin() {
  const queryClient = useQueryClient()

  return useMutation<AuthUser, HttpError, Credentials>({
    mutationFn: setupService.createAdmin,
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user)
      queryClient.invalidateQueries({ queryKey: setupKeys.status() })
    },
  })
}
