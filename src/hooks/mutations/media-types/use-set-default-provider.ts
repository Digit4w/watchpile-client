import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MediaTypeInfo } from '@/domain/media-type'
import type { HttpError } from '@/infra/lib/http-client'
import { mediaTypesService } from '@/services/media-types'
import { patchMediaTypeInCaches } from './patch-media-type'

/**
 * Escolhe de qual provedor vêm título e campos deste tipo (brief, 3.10).
 *
 * **`null` LIMPA a escolha, e é diferente de não mandar** — ausente não mexe. É a
 * mesma distinção entre ausência e vazio que o `PATCH` de credencial faz, e sem
 * ela não haveria como desfazer.
 *
 * Remenda no lugar: o servidor devolve o tipo inteiro com `effectiveProvider` já
 * resolvido, e isto muda o conteúdo de um item da lista, não a composição dela.
 */
export function useSetDefaultProvider(slug: string) {
  const queryClient = useQueryClient()

  return useMutation<MediaTypeInfo, HttpError, string | null>({
    mutationFn: (defaultProvider) =>
      mediaTypesService.update(slug, { defaultProvider }),
    onSuccess: (type) => patchMediaTypeInCaches(queryClient, type),
  })
}
