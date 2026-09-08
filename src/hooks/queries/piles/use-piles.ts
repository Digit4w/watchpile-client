import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { type PileFilters, pilesService } from '@/services/piles'
import { pileKeys } from './keys'

export function usePiles(filters: PileFilters = undefined) {
  return useQuery({
    queryKey: pileKeys.list(filters),
    queryFn: () => pilesService.list(filters),
    /**
     * Trocar de busca ou de ordem troca a CHAVE, e por padrão isso é uma query
     * nova: `data` vira `undefined` e a grade inteira desmonta a cada tecla
     * digitada. Com isto a lista anterior fica na tela até a nova chegar, e o
     * esqueleto volta a ser o estado de quem não tem nada pra mostrar —
     * mesmo caminho já percorrido em `/library` (`use-entries.ts`).
     */
    placeholderData: keepPreviousData,
  })
}
