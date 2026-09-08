import { useQuery } from '@tanstack/react-query'
import { entriesService } from '@/services/entries'
import { entryKeys } from './keys'

/**
 * De quais provedores esta obra fala.
 *
 * **Lista vazia é resposta legítima e é a mais comum hoje**: toda biblioteca
 * montada antes de haver provedor está assim, e é justamente ela que a caixa
 * de `Sources` convida a vincular.
 */
export function useEntryLinks(id: number, enabled = true) {
  return useQuery({
    queryKey: entryKeys.links(id),
    queryFn: () => entriesService.links(id),
    enabled,
  })
}
