import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MediaTypeInfo } from '@/domain/media-type'
import { mediaTypeKeys } from '@/hooks/queries/media-types/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { type MediaTypeInput, mediaTypesService } from '@/services/media-types'

export function useCreateMediaType() {
  const queryClient = useQueryClient()

  return useMutation<MediaTypeInfo, HttpError, MediaTypeInput>({
    mutationFn: mediaTypesService.create,
    /**
     * Invalidar, e não remendar: criar muda a COMPOSIÇÃO da lista, não o
     * conteúdo de um item dela — e só o servidor sabe onde o tipo novo entra na
     * ordem, porque o slug dele é derivado lá.
     *
     * Os templates entram junto porque `installed` acabou de mudar: criar
     * "Podcast" a partir do template tem que tirá-lo da oferta.
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaTypeKeys.all })
    },
  })
}
