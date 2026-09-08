import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mediaTypeKeys } from '@/hooks/queries/media-types/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { mediaTypesService } from '@/services/media-types'

/**
 * Apagar um tipo.
 *
 * O servidor recusa com **409 e a contagem** quando alguma obra ainda o usa
 * (brief, 3.12) — e a tela nunca deveria chegar aqui nesse caso, porque o botão
 * nasce desabilitado com o motivo escrito e a contagem já está na linha (design
 * system, seção 5). A recusa continua possível numa corrida: outra pessoa
 * cadastra uma obra do tipo entre a tela carregar e o clique acontecer.
 *
 * Invalida tudo, `templates` incluído: apagar devolve o template à oferta de
 * `Add type`.
 */
export function useDeleteMediaType() {
  const queryClient = useQueryClient()

  return useMutation<void, HttpError, string>({
    mutationFn: mediaTypesService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaTypeKeys.all })
    },
  })
}
