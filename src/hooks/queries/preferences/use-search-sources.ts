import { useQuery } from '@tanstack/react-query'
import { preferencesService } from '@/services/preferences'
import { preferenceKeys } from './keys'

/**
 * A fonte que ESTE usuário prefere para cada tipo — 10/09/2026 (brief, 3.10).
 *
 * **Ler isto não é reimplementar a escolha.** Quem decide quem responde uma
 * busca é o servidor (`chooseSearchProvider`), e a resposta da busca traz o
 * provedor que de fato atendeu — a tela já prefere esse. Isto responde a outra
 * pergunta, que só a tela tem: *o que o seletor mostra enquanto ninguém buscou
 * nada?* Sem ele, o menu abriria no padrão do admin e trocaria de valor quando
 * o primeiro resultado voltasse, que é *peça que sai sozinha se lê como
 * defeito* (04/09).
 *
 * `staleTime` alto pelo mesmo motivo da visibilidade: quem muda este mapa é a
 * própria `/search`, e ela escreve no cache ao salvar.
 */
export function useSearchSources() {
  return useQuery({
    queryKey: preferenceKeys.searchSources(),
    queryFn: () => preferencesService.searchSources(),
    staleTime: 1000 * 60 * 30,
  })
}
