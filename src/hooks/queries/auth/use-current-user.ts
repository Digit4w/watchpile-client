import { useQuery } from '@tanstack/react-query'
import { authService } from '@/services/auth'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    retry: false,
  })
}
