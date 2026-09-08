import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { Entry } from '@/domain/media'
import { entryKeys } from '@/hooks/queries/entries/keys'

/**
 * As três formas de chave que guardam uma LISTA de obras. Escrever em cache
 * pede endereço exato: `['home-widgets']` guarda os widgets, não as obras
 * deles, e um remendo cego trocaria um widget de id 3 por uma obra de id 3.
 */
function isEntryListKey(key: QueryKey): boolean {
  return (
    (key[0] === 'entries' && key[1] === 'list') ||
    (key[0] === 'home-widgets' && key[2] === 'entries') ||
    (key[0] === 'piles' && key[2] === 'entries')
  )
}

function replaceInPlace(list: Entry[] | undefined, entry: Entry) {
  if (!list) {
    return list
  }
  // A mesma referência de volta quando a obra não está nesta lista: devolver
  // um array novo faria toda lista em cache renderizar de novo por nada.
  return list.some((item) => item.id === entry.id)
    ? list.map((item) => (item.id === entry.id ? entry : item))
    : list
}

/**
 * Escreve a obra atualizada em todo cache que a contém, **sem refazer busca
 * nenhuma** — e é o "sem refazer" que é o ponto.
 *
 * Invalidar era o caminho óbvio e trazia um efeito colateral que só aparece na
 * tela: a ordem padrão de `/library` é "Recently updated", e progresso mexe em
 * `updated_at`. Marcar um episódio arrancava a carta de baixo do cursor e a
 * jogava pra primeira posição — e o próximo `+` caía noutra obra. Numa lista
 * de duzentos itens isso é perder o lugar a cada clique.
 *
 * Remendar no lugar é seguro porque o servidor devolve a obra inteira já
 * atualizada e `recordProgress` mexe SÓ em `progress` e `updated_at` (nunca no
 * status): a obra não pode ter deixado de casar com o recorte da lista em que
 * está. Isso não vale pra toda escrita — editar status pode tirar a obra do
 * filtro, e ali invalidar continua sendo o certo.
 *
 * A ordem então descongela quando o usuário PEDE outra lista: trocar filtro,
 * busca ou ordenação, sair da tela e voltar, ou voltar o foco à janela. Nunca
 * como efeito de um toque num item dela.
 */
export function patchEntryInCaches(queryClient: QueryClient, entry: Entry) {
  queryClient.setQueryData(entryKeys.detail(entry.id), entry)
  queryClient.setQueriesData<Entry[]>(
    { predicate: (query) => isEntryListKey(query.queryKey) },
    (list) => replaceInPlace(list, entry),
  )
}
