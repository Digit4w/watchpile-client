import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pileKeys } from '@/hooks/queries/piles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { pilesService } from '@/services/piles'

export function useRemovePileEntry(pileId: number) {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, number>({
    mutationFn: (entryId) => pilesService.removeEntry(pileId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pileKeys.entries(pileId) })
    },
  })
}
