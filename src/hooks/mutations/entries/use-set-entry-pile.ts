import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import { pileKeys } from '@/hooks/queries/piles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { pilesService } from '@/services/piles'

type Variables = {
  pileId: number
  /** Estado desejado, não o atual: `true` adiciona, `false` remove. */
  member: boolean
}

/**
 * Liga e desliga a presença de uma obra numa pilha.
 *
 * Uma mutação só, com a pilha vindo por variável em vez de por parâmetro do
 * hook: a tela de adicionar lista N pilhas e alterna qualquer uma delas, e hook
 * não se chama dentro de laço. Os `useAddPileEntry`/`useRemovePileEntry` que já
 * existem continuam servindo a tela de UMA pilha, onde o id é fixo.
 *
 * Invalida três frentes, e a terceira é a que se esquece: a pilha mudou de
 * conteúdo, a obra mudou de pertencimento, e **qualquer widget alimentado por
 * essa pilha resolve outra coisa agora** — sem isso a home fica com a contagem
 * velha até o F5.
 */
export function useSetEntryPile(entryId: number) {
  const queryClient = useQueryClient()

  return useMutation<unknown, HttpError, Variables>({
    mutationFn: ({ pileId, member }) =>
      member
        ? pilesService.addEntry(pileId, entryId)
        : pilesService.removeEntry(pileId, entryId),
    onSuccess: (_data, { pileId }) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.piles(entryId) })
      queryClient.invalidateQueries({ queryKey: pileKeys.entries(pileId) })
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })
    },
  })
}
