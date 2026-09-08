import { useQuery } from '@tanstack/react-query'
import { entriesService } from '@/services/entries'
import { entryKeys } from './keys'

/** Em quais pilhas esta obra está. Lista vazia é resposta legítima: estar fora
 * de pilha é normal no modelo (brief, 3.15). */
export function useEntryPiles(id: number, enabled = true) {
  return useQuery({
    queryKey: entryKeys.piles(id),
    queryFn: () => entriesService.piles(id),
    enabled,
  })
}
