import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { type SearchParams, searchService } from '@/services/search'
import { searchKeys } from './keys'

/**
 * A busca no catálogo do provedor.
 *
 * `enabled` pelo termo: sem nada digitado não há pergunta a fazer, e a tela
 * mostra o vazio que diz ONDE vai procurar — que é a informação que falta
 * quando a busca falha depois.
 *
 * `keepPreviousData` porque trocar de FONTE ou de TIPO é trocar de recorte, e
 * a régua já está decidida (design system, seção 11): a lista anterior fica na
 * tela até a nova chegar, e o esqueleto volta a significar "ainda não tenho
 * nada" em vez de "estou atualizando".
 *
 * **Sem `retry`.** As cinco recusas são 503, e 503 é o que o TanStack Query
 * mais gosta de repetir — repetir um `no-provider` é bater três vezes numa
 * porta que ninguém vai abrir, e atrasa em segundos a explicação que a pessoa
 * precisa ler.
 */
export function useSearch(params: SearchParams, enabled: boolean) {
  return useQuery({
    queryKey: searchKeys.query(params),
    queryFn: () => searchService.search(params),
    enabled: enabled && params.q.trim() !== '' && params.type !== '',
    placeholderData: keepPreviousData,
    retry: false,
    /**
     * A resposta já passa por cache no servidor, com validade própria (brief,
     * 3.10). Guardar de novo aqui por muito tempo faria a tela mostrar um
     * catálogo velho depois de o admin trocar a chave.
     */
    staleTime: 1000 * 30,
  })
}
