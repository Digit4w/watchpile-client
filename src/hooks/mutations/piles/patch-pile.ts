import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { Pile } from '@/domain/media'
import { pileKeys } from '@/hooks/queries/piles/keys'

/** Só as listas de pilha: `['piles', 'list', filtros]`. */
function isPileListKey(key: QueryKey): boolean {
  return key[0] === 'piles' && key[1] === 'list'
}

function replaceInPlace(list: Pile[] | undefined, pile: Pile) {
  if (!list) {
    return list
  }
  // A mesma referência de volta quando a pilha não está nesta lista: devolver
  // um array novo faria toda lista em cache renderizar de novo por nada.
  return list.some((item) => item.id === pile.id)
    ? list.map((item) => (item.id === pile.id ? pile : item))
    : list
}

/**
 * Escreve a pilha editada em todo cache que a contém, **sem refazer busca
 * nenhuma** — irmão de `hooks/mutations/entries/patch-entry.ts`, e pela mesma
 * razão: a ordem padrão da tela é "Recently updated", renomear mexe em
 * `updated_at`, e invalidar arrancaria o ladrilho de baixo do cursor de quem
 * acabou de fechar a folha de edição (design system, seção 8).
 *
 * Aqui há um caso que o irmão não tem: renomear PODE tirar a pilha do recorte,
 * quando há busca ativa e o nome novo não casa mais. Ela fica na lista assim
 * mesmo, e isso é escolha — some quando o leitor pedir outra lista. Sumir no
 * instante em que se salva o nome esconderia justamente o que se acabou de
 * escrever.
 *
 * Vale só pra EDIÇÃO. Criar e apagar mudam a composição da lista, não o
 * conteúdo de um item dela, e continuam invalidando.
 */
export function patchPileInCaches(queryClient: QueryClient, pile: Pile) {
  queryClient.setQueryData(pileKeys.detail(pile.id), pile)
  queryClient.setQueriesData<Pile[]>(
    { predicate: (query) => isPileListKey(query.queryKey) },
    (list) => replaceInPlace(list, pile),
  )
}
