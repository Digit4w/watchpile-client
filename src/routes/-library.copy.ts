// Copy de `/library`. O que atravessa tela — nav, conta, rótulo de tipo e de
// status, a carta, a falha de rede — mora em `@/lib/copy`.
export const libraryCopy = {
  title: 'Library',
  search: 'Search in Library',
  // A conta é montada com `Intl.NumberFormat` e o plural com `Intl.PluralRules`
  // (`lib/format.ts`): "1 title" e "12 titles" já são regra de idioma, e a do
  // português é outra. Estas são as duas formas, não uma string com "(s)".
  count: { one: 'title', other: 'titles' },
  countFiltered: 'of',
  filters: {
    all: 'All',
    anyStatus: 'Any status',
    clearStatus: 'Clear status filter',
    // O gatilho do menu diz a ordenação em texto; este é o nome acessível dele
    // no celular, onde só o ícone cabe.
    menu: 'Sort and view',
    sectionStatus: 'Status',
    /**
     * O eixo de tipo também mora no menu desde 01/09/2026, porque a fileira
     * não tem teto. "Any type" e não "All": na fileira o chip está ao lado dos
     * outros e `All` se lê no contexto deles; aqui a linha precisa dizer de que
     * "todos" se trata, como `Any status` já dizia.
     */
    sectionType: 'Media type',
    anyType: 'Any type',
    sectionSort: 'Sort by',
    sectionView: 'View as',
  },
  views: {
    'compact-list': 'Compact list',
    list: 'List',
    'compact-grid': 'Compact grid',
    grid: 'Grid',
  },
  /**
   * Cabeçalho das colunas das duas listas. São RÓTULOS, não botões: clicar pra
   * ordenar seria um segundo caminho pro que o menu já faz (EM ABERTO #3 do
   * mockup, resolvido assim).
   */
  columns: {
    title: 'Title',
    status: 'Status',
    added: 'Added',
    rating: 'Rating',
    progress: 'Progress',
  },
  sorts: {
    updated: 'Recently updated',
    added: 'Recently added',
    title: 'Title A–Z',
    rating: 'Rating',
  },
  add: {
    open: 'Add title',
    title: 'Add a title',
    // Diz onde a obra vai. A frase anterior — "You can put it in a pile
    // later" — descrevia uma folha que não escolhia pilha; com o seletor
    // dentro dela, ela passaria a ser mentira por omissão.
    body: 'It goes into your library, and into any piles you pick.',
    mediaType: 'Media type',
    titleField: 'Title',
    titlePlaceholder: "Frieren: Beyond Journey's End",
    status: 'Status',
    /**
     * **O campo de total NÃO tem placeholder** — 09/09/2026, decisão do dono.
     * Ele era `'28'`, um exemplo escrito à mão que nunca mudava porque nunca
     * foi valor, e foi lido como dado: número cinza dentro de campo numérico é
     * indistinguível de campo preenchido e desabilitado, e a dica logo abaixo
     * reforçava a leitura de que alguém já tinha preenchido. **Placeholder de
     * campo numérico não pode ser um número plausível**, porque o campo não
     * tem nenhum outro sinal de vazio — e vazio é o estado que a dica descreve.
     */
    // "Ainda em publicação" é caso normal, não erro: mangá em publicação não
    // tem último capítulo (brief, 3.12), e a carta já desenha "12 / ?".
    totalHint: 'Leave it empty if it is still running.',
    /** Vindo da busca: contexto que a obra NÃO guarda, e o que é procedência. */
    yearUnknown: 'Year unknown',
    from: (provider: string) => `From ${provider}`,
    typeFromSearch: 'Set by what you searched.',
    titleFromSearch: 'Rename it if you track it under another name.',
    /**
     * `Add to library` e não `Add title`: o botão de confirmação diz ONDE a
     * obra vai, que é o que o corpo da folha promete. Continua verdade com
     * pilha escolhida — a pilha é um destino a mais, e a biblioteca é sempre
     * onde a obra fica (brief, 6: obra vive fora de pilha).
     */
    submit: 'Add to library',
    cancel: 'Cancel',
    close: 'Close',
    failed: "Couldn't add it. Try again.",
    /** O seletor de pilhas (brief, 3.17) — opcional, e por isso o último. */
    piles: {
      label: 'Piles',
      open: 'Add to a pile',
      search: 'Find or create a pile',
      /**
       * O que se digitou na busca É o nome. Aspas em volta porque o nome pode
       * ser uma frase — sem elas, "Create comfort watch" se lê como comando.
       */
      create: (name: string) => `Create “${name}”`,
      none: 'No piles yet. Type a name to create one.',
      creating: 'Creating…',
      failed: "Couldn't create the pile. Try again.",
      /** O chip já mostra o nome; isto é o que o leitor de tela anuncia. */
      remove: (name: string) => `Remove ${name}`,
    },
  },
  empty: {
    title: 'Your library is empty',
    /**
     * **Ela NÃO enumera os tipos**, e a lista que estava aqui — "films, series,
     * anime, manga, games and books" — foi vista mentindo na tela em
     * 04/09/2026: com dois tipos escondidos a fileira mostrava quatro chips e a
     * frase prometia seis. Já era frágil antes disso, porque o wizard permite
     * apagar tipo (brief, 3.9) e o enum abriu em 30/08.
     *
     * A régua: **copy não enumera um conjunto que o dado controla.** Derivar a
     * lista do vocabulário também não serve — ela promete a quem lê exatamente
     * o que ele mesmo escondeu, e enumeração traduzida é regra de idioma
     * (`Intl.ListFormat`) por uma frase que não precisa da lista pra dizer o
     * que diz.
     */
    body: 'Everything you track lives here. Add the first one.',
  },
  // Vazio de FILTRO é outra tela que vazio de biblioteca: aqui há o que
  // mostrar, só não com este recorte, e a saída é afrouxar o recorte — não
  // adicionar obra.
  noMatch: {
    title: 'No titles match',
    body: 'Nothing in your library fits this filter. Try another type or status.',
    clear: 'Clear filters',
  },
}
