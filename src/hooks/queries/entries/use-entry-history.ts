import { useQuery } from '@tanstack/react-query'
import type { HttpError } from '@/infra/lib/http-client'
import { type EntryHistory, entriesService } from '@/services/entries'
import { entryKeys } from './keys'

/**
 * O resumo do log. **Não bloqueia a tela**: é uma caixa da coluna, e falhar
 * nela é a caixa não aparecer — a obra continua inteira sem ela.
 */
export function useEntryHistory(id: number) {
  return useQuery<EntryHistory, HttpError>({
    queryKey: [...entryKeys.detail(id), 'history'],
    queryFn: () => entriesService.history(id),
    retry: 0,
  })
}
