import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MediaTypeInfo } from '@/domain/media-type'
import type { HttpError } from '@/infra/lib/http-client'
import { type MediaTypePatch, mediaTypesService } from '@/services/media-types'
import { patchMediaTypeInCaches } from './patch-media-type'

export function useUpdateMediaType(slug: string) {
  const queryClient = useQueryClient()

  return useMutation<MediaTypeInfo, HttpError, MediaTypePatch>({
    mutationFn: (patch) => mediaTypesService.update(slug, patch),
    /**
     * Remendo no lugar, não invalidação: o servidor devolve o tipo inteiro já
     * atualizado, contagem inclusive. O porquê está em `patch-media-type.ts`.
     */
    onSuccess: (type) => patchMediaTypeInCaches(queryClient, type),
  })
}
