import { useMutation, useQueryClient } from '@tanstack/react-query'
import { preferenceKeys } from '@/hooks/queries/preferences/keys'
import type { HttpError } from '@/infra/lib/http-client'
import {
  type MediaTypeVisibility,
  preferencesService,
} from '@/services/preferences'

/**
 * Grava a lista inteira de escondidos.
 *
 * **Otimista, ao contrário de toda outra escrita do app**, e o motivo é o
 * controle: um toggle diz que o efeito é imediato — é isso que `role="switch"`
 * anuncia —, e um que só vira depois da resposta se lê como um clique que não
 * pegou. As outras escritas do app moram em folha com `Save`, onde a espera tem
 * onde aparecer.
 *
 * **A volta atrás é o cache anterior inteiro, não o inverso do que se mandou.**
 * Inverter suporia que nada mais mexeu na lista entre o clique e a falha; o
 * retrato de antes não supõe nada.
 */
export function useSetMediaTypeVisibility() {
  const queryClient = useQueryClient()

  return useMutation<
    MediaTypeVisibility,
    HttpError,
    string[],
    { previous: MediaTypeVisibility | undefined }
  >({
    mutationFn: (hidden) => preferencesService.setMediaTypes(hidden),
    onMutate: async (hidden) => {
      await queryClient.cancelQueries({ queryKey: preferenceKeys.mediaTypes() })
      const previous = queryClient.getQueryData<MediaTypeVisibility>(
        preferenceKeys.mediaTypes(),
      )
      queryClient.setQueryData<MediaTypeVisibility>(
        preferenceKeys.mediaTypes(),
        { hidden },
      )
      return { previous }
    },
    onError: (_error, _hidden, context) => {
      queryClient.setQueryData(preferenceKeys.mediaTypes(), context?.previous)
    },
    /**
     * A resposta é a verdade final — ela vem ordenada e sem repetição, e é o
     * que fecha a diferença entre o que a tela desenhou e o que ficou gravado.
     */
    onSuccess: (saved) => {
      queryClient.setQueryData(preferenceKeys.mediaTypes(), saved)
    },
  })
}
