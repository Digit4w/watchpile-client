import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { type EntryFilters, entriesService } from '@/services/entries'
import { entryKeys } from './keys'

export function useEntries(
  filters: EntryFilters = undefined,
  /**
   * `enabled` só, e não as opções do TanStack inteiras: quem chama escolhe SE
   * a consulta acontece, não como ela se comporta. Abrir a porta pro objeto
   * todo deixaria cada tela redefinir `staleTime` e `placeholderData` por
   * conta, e a decisão de `keepPreviousData` abaixo deixaria de valer no app
   * inteiro.
   *
   * Nasceu com a folha de adicionar obra (31/08/2026): fechada, ela não deve
   * manter a biblioteca viva no cache nem refazer a busca ao focar a janela.
   */
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: entryKeys.list(filters),
    queryFn: () => entriesService.list(filters),
    enabled: options.enabled ?? true,
    /**
     * Trocar de recorte troca a CHAVE da query, e por padrão isso é uma query
     * nova: `data` vira `undefined` e quem desenha a lista desmonta. Em
     * `/library` cada chip clicado e cada tecla digitada na busca fazia a
     * grade inteira sumir e voltar — o que se via como piscada não era o
     * esqueleto aparecendo rápido demais, era a lista indo embora.
     *
     * Com isto a lista anterior fica na tela até a nova chegar. O esqueleto
     * passa a ser o que ele deveria ter sido desde o começo: o estado de quem
     * ainda não tem nada pra mostrar, não o de quem está atualizando.
     */
    placeholderData: keepPreviousData,
  })
}
