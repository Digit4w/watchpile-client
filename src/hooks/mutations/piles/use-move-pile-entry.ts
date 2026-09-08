import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import { pileKeys } from '@/hooks/queries/piles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { pilesService } from '@/services/piles'

type Move = {
  entryId: number
  /** Obra atrás da qual esta vai; `null` manda pro topo (brief, 3.14). */
  after: number | null
}

export function useMovePileEntry(pileId: number) {
  const queryClient = useQueryClient()

  return useMutation<Entry[], HttpError, Move>({
    mutationFn: ({ entryId, after }) =>
      pilesService.moveEntry(pileId, entryId, after),
    onSuccess: (ordered) => {
      queryClient.setQueryData(pileKeys.entries(pileId), ordered)
    },
  })
}
