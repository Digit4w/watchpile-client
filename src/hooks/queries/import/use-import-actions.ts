import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entryKeys } from '@/hooks/queries/entries/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'
import { importService } from '@/services/import'
import { importKeys } from './keys'

/**
 * Preencher o que falta — e é a MESMA ação de `Continue` (14/09/2026).
 *
 * Aquecer pula o que já está guardado, então retomar um trabalho interrompido é
 * literalmente rodá-lo de novo: ele acha o que sobrou. Dois hooks para o mesmo
 * efeito seriam duas maneiras de perguntar a mesma coisa, e a segunda ficaria
 * para trás no dia em que a regra mudasse.
 *
 * **Invalida o STATUS, não a biblioteca.** A rota responde 202 e o trabalho
 * apenas começou; o que muda vem depois, e quem traz a notícia é o poll.
 */
export function useFillMissing() {
  const queryClient = useQueryClient()

  return useMutation<{ id: number; total: number }, HttpError, void>({
    mutationFn: () => entriesService.fillMissing(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.status() })
    },
  })
}

/**
 * Dispensa o aviso de um trabalho interrompido.
 *
 * **Não apaga** — a linha fica no histórico e o que sai é o pedido de atenção,
 * como lido e dispensado em `notifications`.
 */
export function useDismissJob() {
  const queryClient = useQueryClient()

  return useMutation<unknown, HttpError, number>({
    mutationFn: (id) => importService.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.status() })
    },
  })
}

/**
 * Limpa o histórico de importações.
 *
 * **Invalida a biblioteca também**, e não é zelo: `pending` viaja na mesma
 * resposta do status, e ele é derivado do acervo — sem isto o rótulo de
 * `Fill in missing` ficaria com o número anterior até o próximo poll.
 */
export function useClearHistory() {
  const queryClient = useQueryClient()

  return useMutation<{ deleted: number }, HttpError, void>({
    mutationFn: () => importService.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.status() })
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() })
    },
  })
}
