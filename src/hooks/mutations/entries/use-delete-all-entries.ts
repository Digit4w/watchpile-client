import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import { pileKeys } from '@/hooks/queries/piles/keys'
import { searchKeys } from '@/hooks/queries/search/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'

/**
 * Apaga a biblioteca inteira.
 *
 * **`removeQueries` e não `invalidateQueries` para as obras**, ao contrário do
 * apagar uma: aqui não sobra obra nenhuma, então toda entrada de detalhe em
 * cache aponta para uma linha que não existe mais. Invalidar as manteria vivas
 * até alguém pedi-las de volta e receber 404 — e a régua de "afinal, o que a
 * tela sabe, ela diz" (31/08) quer o oposto disso.
 *
 * Pilhas e widgets são invalidados e **não** removidos, porque eles
 * continuam existindo: o que mudou é o conteúdo deles.
 *
 * As telas do provedor entram pelo mesmo motivo de `useDeleteEntry`, e aqui
 * sem exceção possível: se não sobrou obra, nenhum resultado de busca pode
 * continuar dizendo `Already in your library`.
 */
export function useDeleteAllEntries() {
  const queryClient = useQueryClient()

  return useMutation<{ deleted: number }, HttpError, void>({
    mutationFn: entriesService.removeAll,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: entryKeys.all })
      queryClient.invalidateQueries({ queryKey: homeWidgetKeys.all })
      queryClient.invalidateQueries({ queryKey: pileKeys.all })
      queryClient.invalidateQueries({ queryKey: titleKeys.all })
      queryClient.invalidateQueries({ queryKey: searchKeys.all })
    },
  })
}
