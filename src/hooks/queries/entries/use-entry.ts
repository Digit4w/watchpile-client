import { useQuery } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import type { HttpError } from '@/infra/lib/http-client'
import { entriesService } from '@/services/entries'
import { entryKeys } from './keys'

/**
 * O erro é `HttpError` e não `Error`, e o tipo importa: é ele que deixa a tela
 * de detalhe separar **404 de falha de rede** (design system, seção 6). No 404
 * o servidor respondeu certo, e "Try again" ali daria 404 de novo.
 *
 * `retry` desligado para o 404 pelo mesmo motivo — repetir um pedido cuja
 * resposta não vai mudar só atrasa a tela que diz que a obra não existe. Foi
 * `usePile` que aprendeu isso primeiro; a tela de obra faz a mesma pergunta.
 */
export function useEntry(id: number) {
  return useQuery<Entry, HttpError>({
    queryKey: entryKeys.detail(id),
    queryFn: () => entriesService.getById(id),
    retry: (attempts, error) => error.status !== 404 && attempts < 3,
  })
}
