import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService, type ProgressInput } from '@/services/entries'
import { patchEntryInCaches } from './patch-entry'

/**
 * Ajuste de progresso, inclusive o desfazer — que é um delta negativo, não
 * uma reversão da escrita anterior (brief, 3.11). O servidor devolve a obra
 * com o contador já atualizado, então não há o que recalcular aqui.
 */
export function useAddProgress(id: number) {
  const queryClient = useQueryClient()

  return useMutation<Entry, HttpError, ProgressInput>({
    mutationFn: (input) => entriesService.addProgress(id, input),
    /**
     * Remendo no lugar, não invalidação. O contador continua sendo atualizado
     * em toda lista que contém a obra — inclusive a do widget, que é a razão
     * de a invalidação existir aqui —, mas a ORDEM das listas fica onde está.
     * O porquê inteiro está em `patch-entry.ts`.
     */
    onSuccess: (entry) => patchEntryInCaches(queryClient, entry),
  })
}
