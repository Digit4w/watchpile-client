import { useMutation, useQueryClient } from '@tanstack/react-query'
import { preferenceKeys } from '@/hooks/queries/preferences/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { preferencesService, type SearchSources } from '@/services/preferences'

type Choice = { mediaType: string; provider: string | null }

/**
 * Grava a fonte preferida de UM tipo — 10/09/2026 (brief, 3.10).
 *
 * **Otimista, e aqui isso é mais forte que no toggle de visibilidade.** Lá o
 * argumento era o `role="switch"`, que anuncia efeito imediato; aqui a escrita
 * acontece **no mesmo gesto que dispara uma busca**, e o seletor voltando ao
 * valor antigo por um quadro apareceria em cima do resultado já chegando. A
 * volta atrás é o **cache anterior inteiro**, nunca o inverso do que se mandou.
 *
 * **Falhar não desfaz a busca**, e é decisão: quem escolheu a fonte pediu duas
 * coisas — *busque aqui agora* e *lembre disso* —, e a primeira viaja na URL,
 * que não depende desta escrita. Perder a preferência é um estado com conserto
 * (escolher de novo); recusar a busca por causa dela seria a peça errada
 * pagando pelo erro.
 */
export function useSetSearchSource() {
  const queryClient = useQueryClient()

  return useMutation<
    SearchSources,
    HttpError,
    Choice,
    { previous: SearchSources | undefined }
  >({
    mutationFn: ({ mediaType, provider }) =>
      preferencesService.setSearchSource(mediaType, provider),
    onMutate: async ({ mediaType, provider }) => {
      await queryClient.cancelQueries({
        queryKey: preferenceKeys.searchSources(),
      })
      const previous = queryClient.getQueryData<SearchSources>(
        preferenceKeys.searchSources(),
      )

      /**
       * O mapa se remenda, não se refaz: escolher a fonte de `anime` não pode
       * mexer no que vale pra `manga`, e é justamente essa a diferença entre
       * esta escrita e a de visibilidade, que substitui o conjunto.
       */
      const next = { ...(previous?.sources ?? {}) }
      if (provider === null) {
        delete next[mediaType]
      } else {
        next[mediaType] = provider
      }
      queryClient.setQueryData<SearchSources>(preferenceKeys.searchSources(), {
        sources: next,
      })

      return { previous }
    },
    onError: (_error, _choice, context) => {
      queryClient.setQueryData(
        preferenceKeys.searchSources(),
        context?.previous,
      )
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(preferenceKeys.searchSources(), saved)
    },
  })
}
