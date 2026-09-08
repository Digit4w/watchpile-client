import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mediaTypeKeys } from '@/hooks/queries/media-types/keys'
import { setupKeys } from '@/hooks/queries/setup/use-setup-status'
import type { HttpError } from '@/infra/lib/http-client'
import { type InstanceSetup, setupService } from '@/services/setup'

/**
 * Concluir o passo de instância APAGA tipo, então o vocabulário inteiro é
 * invalidado junto do status — o `staleTime` de 30 minutos de `useMediaTypes`
 * (vocabulário quase não muda) manteria na tela os tipos que acabaram de
 * deixar de existir.
 */
export function useConfigureInstance() {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, InstanceSetup>({
    mutationFn: setupService.configureInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setupKeys.status() })
      queryClient.invalidateQueries({ queryKey: mediaTypeKeys.all })
    },
  })
}
