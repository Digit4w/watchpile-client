import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import { pileKeys } from '@/hooks/queries/piles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { pilesService } from '@/services/piles'

export function useAddPileEntry(pileId: number) {
  const queryClient = useQueryClient()

  return useMutation<Entry, HttpError, number>({
    mutationFn: (entryId) => pilesService.addEntry(pileId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pileKeys.entries(pileId) })
    },
  })
}
