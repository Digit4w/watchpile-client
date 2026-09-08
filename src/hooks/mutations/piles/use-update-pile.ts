import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Pile } from '@/domain/media'
import type { HttpError } from '@/infra/lib/http-client'
import { type PilePatch, pilesService } from '@/services/piles'
import { patchPileInCaches } from './patch-pile'

export function useUpdatePile(id: number) {
  const queryClient = useQueryClient()

  return useMutation<Pile, HttpError, PilePatch>({
    mutationFn: (patch) => pilesService.update(id, patch),
    /**
     * Remendo no lugar, não invalidação: o servidor devolve a pilha inteira já
     * atualizada, contagem e prévia inclusive. O porquê está em
     * `patch-pile.ts`.
     */
    onSuccess: (pile) => patchPileInCaches(queryClient, pile),
  })
}
