import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mediaTypeKeys } from '@/hooks/queries/media-types/keys'
import { providerKeys } from '@/hooks/queries/providers/keys'
import type { HttpError } from '@/infra/lib/http-client'
import {
  type Provider,
  type ProviderPatch,
  providersService,
} from '@/services/providers'

export function useUpdateProvider(slug: string) {
  const queryClient = useQueryClient()

  return useMutation<Provider, HttpError, ProviderPatch>({
    mutationFn: (patch) => providersService.update(slug, patch),
    /**
     * **Invalida, e não remenda** — ao contrário do que a régua de "conteúdo vs.
     * composição" faria esperar (design system, seção 8).
     *
     * A régua diz que escrita que muda o CONTEÚDO de um item troca o item no
     * lugar. Aqui o servidor de fato devolve o provedor inteiro atualizado, e
     * remendar seria possível — mas salvar uma credencial muda o que a LISTA DE
     * TIPOS diz: `effectiveProvider` de um tipo depende de o provedor estar
     * pronto, e nada disso chega na resposta do provedor.
     *
     * Ou seja: a régua não está sendo furada, está sendo lida direito. A escrita
     * muda o conteúdo de duas coleções, e só uma delas volta na resposta.
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.all })
      queryClient.invalidateQueries({ queryKey: mediaTypeKeys.all })
    },
  })
}
