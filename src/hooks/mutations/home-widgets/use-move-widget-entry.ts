import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import { homeWidgetKeys } from '@/hooks/queries/home-widgets/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { homeWidgetsService } from '@/services/home-widgets'

type Variables = {
  entryId: number
  /** Id da obra atrás da qual esta vai; `null` manda pro topo. */
  after: number | null
}

/**
 * Reordena uma obra dentro do widget.
 *
 * A resposta já vem com a lista inteira na ordem nova, então ela entra direto
 * no cache em vez de disparar um refetch: o arrasto acabou de terminar e piscar
 * a lista aqui desfaria a sensação de que o item ficou onde foi solto.
 */
export function useMoveWidgetEntry(widgetId: number) {
  const queryClient = useQueryClient()

  return useMutation<Entry[], HttpError, Variables>({
    mutationFn: ({ entryId, after }) =>
      homeWidgetsService.moveEntry(widgetId, entryId, after),
    onSuccess: (ordered) => {
      queryClient.setQueryData(homeWidgetKeys.entries(widgetId), ordered)
    },
    // Ordem é a única coisa que este widget guarda de próprio: se a escrita
    // falhou, o servidor continua sendo a verdade e a lista tem que voltar pra
    // ela em vez de manter o resultado otimista na tela.
    onError: () => {
      queryClient.invalidateQueries({
        queryKey: homeWidgetKeys.entries(widgetId),
      })
    },
  })
}
