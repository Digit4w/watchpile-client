import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import { importKeys } from '@/hooks/queries/import/keys'
import { titleKeys } from '@/hooks/queries/titles/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'

/**
 * A varredura da biblioteca — item 11(c) da fila do dono.
 *
 * **Ela invalida o STATUS, não a biblioteca**, e a diferença é o que separa
 * esta mutação da de uma obra: aqui o servidor responde 202 e o trabalho apenas
 * COMEÇOU. Invalidar `entries` agora refaria a listagem para ler exatamente os
 * mesmos números — o que muda vem depois, e é o poll de `/api/import/status`
 * que traz a notícia.
 *
 * Quem invalida a biblioteca é o fim do trabalho, na própria seção, pelo mesmo
 * mecanismo que o import já usa.
 */
export function useRefreshLibrary() {
  const queryClient = useQueryClient()

  return useMutation<{ id: number; total: number }, HttpError, void>({
    mutationFn: () => entriesService.refreshAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.status() })
    },
  })
}

/**
 * O que fazer quando a varredura TERMINA — a biblioteca mudou de verdade.
 *
 * Separado da mutação porque o fim não acontece numa resposta HTTP: ele é
 * percebido pelo poll, minutos depois, quando `refreshing.status` deixa de ser
 * `running`. É a mesma forma que a seção de import já usa para reagir ao fim de
 * um job.
 */
export function useInvalidateAfterRefresh() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: entryKeys.all })
    queryClient.invalidateQueries({ queryKey: titleKeys.all })
  }
}
