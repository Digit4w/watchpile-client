import { useQuery } from '@tanstack/react-query'
import { mediaTypesService } from '@/services/media-types'
import { mediaTypeKeys } from './keys'

/**
 * Os tipos que o produto embarca, para `Add type` oferecer antes do formulário
 * em branco (design system, seção 5; brief, 3.9).
 *
 * **Só é pedida quando a escolha abre**, e não junto da lista: é resposta de
 * admin (403 para o resto) e a maioria das visitas a esta seção não cria tipo
 * nenhum. Quem controla isso é `enabled`.
 *
 * `staleTime: Infinity` porque o conteúdo dos templates é literal do binário —
 * ele só muda quando o servidor é atualizado, e aí a página recarrega junto.
 * `installed` é a exceção, e por isso criar um tipo invalida a chave.
 */
export function useMediaTypeTemplates(enabled: boolean) {
  return useQuery({
    queryKey: mediaTypeKeys.templates(),
    queryFn: mediaTypesService.templates,
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  })
}
