import { useQuery } from '@tanstack/react-query'
import type { Pile } from '@/domain/media'
import type { HttpError } from '@/infra/lib/http-client'
import { pilesService } from '@/services/piles'
import { pileKeys } from './keys'

/**
 * O erro é `HttpError` e não `Error`, e o tipo importa: é ele que deixa a tela
 * separar **404 de falha de rede** (design system, seção 6, 31/08/2026). No
 * 404 o servidor respondeu, e respondeu certo — "Try again" ali daria 404 de
 * novo. Sem o `status` tipado, a tela só conseguiria oferecer a saída errada.
 *
 * `retry` desligado para o 404 pelo mesmo motivo: repetir três vezes um pedido
 * cuja resposta não vai mudar só atrasa a tela que diz que a pilha não existe.
 */
export function usePile(id: number) {
  return useQuery<Pile, HttpError>({
    queryKey: pileKeys.detail(id),
    queryFn: () => pilesService.getById(id),
    retry: (attempts, error) => error.status !== 404 && attempts < 3,
  })
}
