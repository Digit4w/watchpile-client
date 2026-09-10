import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MediaTypeInfo } from '@/domain/media-type'
import type { HttpError } from '@/infra/lib/http-client'
import { mediaTypesService } from '@/services/media-types'
import { patchMediaTypeInCaches } from './patch-media-type'

/**
 * Que um provedor passe a servir este tipo, **copiando a receita** de um tipo
 * que ele já serve (brief, 3.10, 10/09/2026).
 *
 * Sem isto, tipo criado pelo admin nascia sem fonte pra sempre: a busca recusava
 * com `no-provider`, não havia arte nem sinopse, e a saída era digitar tudo à
 * mão — a promessa de "criar tipo próprio" construída pela metade.
 *
 * **Remenda no lugar**, e não invalida: o servidor devolve o tipo inteiro com
 * `providers` e `effectiveProvider` já resolvidos, e isto muda o CONTEÚDO de um
 * item da lista, não a composição dela (régua de 30/08).
 */
export function useLinkProvider(slug: string) {
  const queryClient = useQueryClient()

  return useMutation<
    MediaTypeInfo,
    HttpError,
    { provider: string; copyFrom: string }
  >({
    mutationFn: ({ provider, copyFrom }) =>
      mediaTypesService.linkProvider(slug, provider, copyFrom),
    onSuccess: (type) => patchMediaTypeInCaches(queryClient, type),
  })
}

/**
 * E que ele pare de servir.
 *
 * **O servidor recusa com a contagem** quando obra daquele tipo já aponta pra
 * ali, e a recusa não é burocracia: `bindingFor` é o que serve arte, detalhe e
 * resolução de obra, então sem a linha a arte para de carregar e o detalhe para
 * de abrir, sem nada na tela dizendo por quê.
 */
export function useUnlinkProvider(slug: string) {
  const queryClient = useQueryClient()

  return useMutation<MediaTypeInfo, HttpError, string>({
    mutationFn: (provider) => mediaTypesService.unlinkProvider(slug, provider),
    onSuccess: (type) => patchMediaTypeInCaches(queryClient, type),
  })
}
