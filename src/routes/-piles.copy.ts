// Copy de `/piles`. O que atravessa tela — nav, conta, a falha de rede — mora
// em `@/lib/copy`.
export const pilesCopy = {
  title: 'Piles',
  search: 'Search piles',
  // Montado com `Intl.PluralRules` (`lib/format.ts`): "1 pile" e "12 piles" já
  // são regra de idioma, e a do português é outra.
  count: { one: 'pile', other: 'piles' },
  countFiltered: 'of',
  titleCount: { one: 'title', other: 'titles' },
  menu: 'Sort and view',
  sectionSort: 'Sort by',
  sectionView: 'View as',
  /**
   * Não há seção de status neste menu, e a ausência é decisão: obra tem
   * status, pilha não. Inventar um eixo pra as duas telas ficarem simétricas
   * seria simetria contra o modelo (`design/mockups/piles.html`).
   */
  sorts: {
    updated: 'Recently updated',
    added: 'Recently added',
    name: 'Name A–Z',
    size: 'Most titles',
  },
  views: {
    'compact-list': 'Compact list',
    list: 'List',
    grid: 'Grid',
  },
  columns: {
    name: 'Name',
    description: 'Description',
    titles: 'Titles',
    updated: 'Updated',
  },
  actions: {
    menu: 'Pile actions',
    edit: 'Edit pile',
    delete: 'Delete pile',
  },
  create: {
    open: 'New pile',
    name: 'Name',
    placeholder: 'Currently watching',
    // Diz por que o formulário é pequeno, em vez de deixar quem procura a capa
    // achar que ela foi esquecida.
    hint: 'Cover and description come later, from the pile itself.',
    submit: 'Create pile',
  },
  /**
   * O bloco de capa da folha de editar (brief, 3.17).
   *
   * A frase diz o que acontece SEM capa, e não o que a capa faz: é o estado em
   * que quase toda pilha vive, e é o que liga o campo à escada de identidade
   * do container (design system, seção 5).
   */
  cover: {
    label: 'Cover',
    choose: 'Add cover',
    change: 'Change cover',
    remove: 'Remove',
    use: 'Use this',
    cancel: 'Cancel',
    dragHint: 'Drag to choose what fits in the square',
    hint: 'Square works best. Without a cover, the pile shows the first titles in it.',
    tooLarge: 'That image is too large. Pick one under 2 MB.',
    unreadable: 'That file could not be read as an image.',
  },
  /**
   * O ajuste que APAGA associação sozinho. A frase precisa dizer o que ele
   * **não** faz, senão "remove" se lê como apagar a obra (design system,
   * seção 5, 31/08/2026).
   */
  behavior: {
    label: 'Behavior',
    removeWhenCompleted: 'Remove when completed',
    removeWhenCompletedBody:
      'Titles leave this pile when you mark them completed. They stay in your library.',
  },
  edit: {
    title: 'Edit pile',
    body: 'Only you see this pile.',
    name: 'Name',
    description: 'Description',
    descriptionPlaceholder: 'What is this pile for?',
    save: 'Save changes',
    cancel: 'Cancel',
  },
  remove: {
    title: 'Delete this pile?',
    // A frase que a confirmação existe pra dizer: apagar pilha NÃO apaga obra.
    // Sem ela, quem hesita hesita pelo motivo errado.
    body: 'The pile goes away. The titles in it stay in your library.',
    confirm: 'Delete',
    cancel: 'Cancel',
  },
  empty: {
    title: "You don't have a pile yet",
    body: 'A pile is a group you make by hand — a queue, a rewatch, the list you keep for someone else. Your titles do not need one to exist.',
  },
  noMatch: {
    title: 'No pile matches',
    body: 'No pile by that name. Titles live in your library, and the search there finds them.',
    clear: 'Clear search',
  },
}
