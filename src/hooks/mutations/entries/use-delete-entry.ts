import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import { pileKeys } from '@/hooks/queries/piles/keys'
import { searchKeys } from '@/hooks/queries/search/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'

export function useDeleteEntry() {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, number>({
    mutationFn: entriesService.remove,
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: entryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: entryKeys.all })
      // o que um widget resolve depende das entries; a chave dele mora à parte
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })
      // apagar a obra derruba a associação com qualquer pile (cascade no
      // servidor), então nenhuma listagem de pile continua válida
      queryClient.invalidateQueries({ queryKey: pileKeys.all })

      /**
       * **As telas do PROVEDOR precisam saber que a obra deixou de ser sua.**
       *
       * `owned` e `ownedEntryId` saem de `external_ids` cruzado com as obras
       * daquele usuário (`search.query.ts`), e apagar a obra derruba as linhas
       * junto — então o selo `Already in your library` de um resultado e o
       * botão desabilitado de `/search/:provider/:id` passam a mentir.
       * Adicionar já avisava as duas chaves desde que a busca ganhou o selo;
       * apagar não avisava nenhuma, e a assimetria era o defeito.
       *
       * Sem condição, ao contrário de `useCreateEntry`: a mutação recebe só o
       * id, e quais vínculos a obra tinha morreu com ela. Apagar é gesto raro e
       * deliberado — refazer uma busca em cache custa menos que a mentira.
       */
      queryClient.invalidateQueries({ queryKey: titleKeys.all })
      queryClient.invalidateQueries({ queryKey: searchKeys.all })
    },
  })
}
