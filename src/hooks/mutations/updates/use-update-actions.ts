import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateKeys } from '@/hooks/queries/updates/use-updates'
import type { HttpError } from '@/infra/lib/http-client'
import { type UpdateState, updatesService } from '@/services/updates'

/**
 * As três escritas desta seção, e **nenhuma delas é otimista**.
 *
 * É o oposto do toggle de Preferences, e a diferença é o que a peça promete:
 * lá o efeito é local e imediato — `role="switch"` anuncia isso —, aqui cada
 * gesto depende de uma resposta que só o servidor tem (a rede respondeu? o
 * arquivo serve esta máquina?). Adiantar o desenho faria a tela afirmar um
 * resultado que ela não conhece, e a volta atrás seria visível.
 *
 * A exceção é o TOGGLE da checagem, que é preferência e segue a régua de lá.
 */
export function useSetUpdateCheck() {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateState,
    HttpError,
    boolean,
    { previous?: UpdateState }
  >({
    mutationFn: (enabled) => updatesService.setCheck(enabled),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: updateKeys.all })
      const previous = queryClient.getQueryData<UpdateState>(updateKeys.all)
      if (previous) {
        queryClient.setQueryData<UpdateState>(updateKeys.all, {
          ...previous,
          enabled,
        })
      }
      return { previous }
    },
    onError: (_error, _enabled, context) => {
      queryClient.setQueryData(updateKeys.all, context?.previous)
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(updateKeys.all, saved)
    },
  })
}

export function useCheckNow() {
  const queryClient = useQueryClient()

  return useMutation<UpdateState, HttpError, void>({
    mutationFn: () => updatesService.checkNow(),
    onSuccess: (saved) => {
      queryClient.setQueryData(updateKeys.all, saved)
    },
  })
}

export function useDownloadUpdate() {
  const queryClient = useQueryClient()

  return useMutation<UpdateState, HttpError, void>({
    mutationFn: () => updatesService.download(),
    /**
     * A resposta é o estado no instante em que o download COMEÇOU, e é ela que
     * liga a repetição da consulta — sem escrevê-la no cache, a tela ficaria
     * parada em `idle` até a próxima leitura espontânea, que não viria.
     */
    onSuccess: (started) => {
      queryClient.setQueryData(updateKeys.all, started)
    },
  })
}

/**
 * **Ela normalmente não devolve**, porque o processo termina — o instalador
 * precisa substituir o que está rodando. O `202` chega antes disso; o que vem
 * depois é a janela fechando, e não há tela pra desenhar.
 */
export function useInstallUpdate() {
  return useMutation<{ message: string }, HttpError, void>({
    mutationFn: () => updatesService.install(),
  })
}
