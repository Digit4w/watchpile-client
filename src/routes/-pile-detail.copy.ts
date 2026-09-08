/**
 * A copy de `/piles/:id`.
 *
 * **Ela descreve o que a tela faz hoje**, não o que o mockup desenhou (design
 * system, seção 7, 30/08/2026). Duas consequências concretas aqui: a busca diz
 * "in this pile" porque é só nela que ela procura, e o vazio de busca aponta
 * pra biblioteca em vez de afirmar que a obra não existe — coisa que esta
 * busca não tem como saber.
 *
 * Nada de string dentro do JSX (client/CLAUDE.md): o catálogo ainda não
 * existe, uma constante exportada já serve, e o dia da escolha da biblioteca
 * de i18n vira troca de camada em vez de varredura.
 */
export const pileDetailCopy = {
  back: 'Back to piles',
  search: 'Search in this pile',
  menu: 'Sort and view',
  filters: {
    anyType: 'Any type',
    sectionType: 'Type',
    sectionSort: 'Sort by',
    sectionView: 'View as',
  },
  actions: {
    menu: 'Pile actions',
    add: 'Add titles',
    edit: 'Edit',
    pin: 'Pin to sidebar',
    unpin: 'Unpin',
    delete: 'Delete pile',
  },
  /**
   * Plural com chave própria por forma, nunca o singular com "s" colado
   * (design system, seção 7, 30/08/2026): concatenar é o que trava tradução, e
   * em pt-BR a regra é outra.
   */
  count: { one: 'title', other: 'titles', none: 'No titles' },
  updated: 'Updated',
  /**
   * O aviso de que a pilha se esvazia sozinha. Ele fica no cabeçalho, à vista,
   * e não só dentro da folha de edição: ajuste que APAGA associação sozinho e
   * não se anuncia é ajuste que a pessoa esquece que ligou — o mesmo argumento
   * que faz filtro do menu voltar como chip (design system, seção 5).
   */
  removesCompleted: 'Removes completed',
  pinned: 'Pinned',
  more: 'More',
  less: 'Less',
  sorts: {
    manual: 'Manual',
    title: 'Title',
    added: 'Recently added',
    rating: 'Rating',
  },
  views: {
    grid: 'Grid',
    'compact-grid': 'Compact grid',
    list: 'List',
    'compact-list': 'Compact list',
  },
  columns: {
    title: 'Title',
    status: 'Status',
    added: 'Added',
    rating: 'Rating',
    progress: 'Progress',
  },
  reorder: 'Drag to reorder',
  /**
   * A dica de por que a alça sumiu. Sem ela, quem ordenou por título e quis
   * arrastar conclui que o arrasto quebrou — e não que ele não se aplica ali.
   */
  reorderHint: 'Switch to Manual order in a list view to reorder',
  empty: {
    title: 'This pile is empty',
    /**
     * **`Library` deixou de ser a única porta em 01/09/2026**, quando `/search`
     * passou a preencher a folha de criar obra — e esta frase continuou
     * nomeando só uma das duas. Copy descreve o que a tela faz hoje.
     */
    body: 'Add titles from your library, or find a new one in Search first.',
  },
  noMatch: {
    title: 'Nothing in this pile matches',
    body: 'It may still be in your library.',
    clear: 'Clear search',
  },
  notFound: {
    title: "This pile doesn't exist",
    body: 'It may have been deleted. Your other piles are still here.',
  },
  add: {
    title: 'Add titles',
    search: 'Search your library',
    added: 'Added',
    add: 'Add',
    done: 'Done',
    hint: 'Not in your library yet? Add it from Library or Search.',
    empty: 'No title in your library matches.',
  },
} as const
