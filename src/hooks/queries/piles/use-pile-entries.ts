import { useQuery } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import type { HttpError } from '@/infra/lib/http-client'
import { pilesService } from '@/services/piles'
import { pileKeys } from './keys'

/**
 * As obras da pilha, **na ordem manual** — `position` (brief, 3.14). Ordenar
 * de outro jeito é recorte de leitura e acontece no cliente
 * (`domain/pile-detail-view.ts`), sobre a lista que já chegou inteira.
 *
 * `retry` desligado no 404 pelo mesmo motivo de `use-pile.ts`: a pilha não
 * existe, e insistir três vezes só atrasa a tela que diz isso. Foi o que
 * deixava `/piles/9999` no esqueleto — a pilha respondia 404 na hora, mas esta
 * consulta seguia tentando e mantinha a espera de pé.
 */
export function usePileEntries(id: number) {
  return useQuery<Entry[], HttpError>({
    queryKey: pileKeys.entries(id),
    queryFn: () => pilesService.listEntries(id),
    retry: (attempts, error) => error.status !== 404 && attempts < 3,
  })
}
