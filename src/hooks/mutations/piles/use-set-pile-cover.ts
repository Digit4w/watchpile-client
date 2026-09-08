import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Pile } from '@/domain/media'
import type { HttpError } from '@/infra/lib/http-client'
import { pilesService } from '@/services/piles'
import { patchPileInCaches } from './patch-pile'

/**
 * Sobe a capa já recortada e reduzida.
 *
 * Remendo no lugar, não invalidação — o servidor devolve a pilha inteira, e o
 * porquê está em `patch-pile.ts`. Aqui isso importa por um motivo a mais: o
 * `updatedAt` que volta é o que muda o `?v=` do endereço da imagem, então é
 * ele que faz o `<img>` largar a capa antiga.
 */
export function useSetPileCover(id: number) {
  const queryClient = useQueryClient()

  return useMutation<Pile, HttpError, Blob>({
    mutationFn: (image) => pilesService.setCover(id, image),
    onSuccess: (pile) => patchPileInCaches(queryClient, pile),
  })
}

export function useRemovePileCover(id: number) {
  const queryClient = useQueryClient()

  return useMutation<Pile, HttpError, void>({
    mutationFn: () => pilesService.removeCover(id),
    onSuccess: (pile) => patchPileInCaches(queryClient, pile),
  })
}
