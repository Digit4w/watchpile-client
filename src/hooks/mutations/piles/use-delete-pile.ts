import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pileKeys } from '@/hooks/queries/piles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { pilesService } from '@/services/piles'

export function useDeletePile() {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, number>({
    mutationFn: pilesService.remove,
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: pileKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: pileKeys.lists() })
    },
  })
}
