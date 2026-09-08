import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Pile } from '@/domain/media'
import { pileKeys } from '@/hooks/queries/piles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { type PileInput, pilesService } from '@/services/piles'

export function useCreatePile() {
  const queryClient = useQueryClient()

  return useMutation<Pile, HttpError, PileInput>({
    mutationFn: pilesService.create,
    /**
     * Invalidar, e não remendar: criar muda a COMPOSIÇÃO da lista, não o
     * conteúdo de um item dela — a pilha nova precisa aparecer onde a ordem
     * atual manda, e só o servidor sabe onde é isso. Editar é o caso oposto,
     * e está em `patch-pile.ts`.
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pileKeys.lists() })
    },
  })
}
