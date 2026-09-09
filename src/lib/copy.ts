// Catálogo de i18n ainda não decidido (client/CLAUDE.md) — este arquivo é o
// interino: nenhuma string nasce solta no JSX, mas a biblioteca fica em aberto.
//
// Aqui mora o que **atravessa tela**: o chrome (nav, conta), a carta de mídia e
// os rótulos dos enums do schema. Copy de uma tela só continua em
// `routes/-<rota>.copy.ts`.
//
// A separação nasceu com `/library` (29/08/2026): a carta e o shell já liam de
// `-home.copy.ts`, e um arquivo prefixado com `-` é, pro TanStack Router,
// justamente o que NÃO se compartilha — pertence à rota ao lado.
export const appCopy = {
  nav: {
    primary: 'Sections',
    collapse: 'Collapse sidebar',
    expand: 'Expand sidebar',
    home: 'Home',
    // Duas listagens, e elas listam objetos diferentes: `library` lista OBRAS,
    // `piles` lista os agrupamentos. Decidido em 29/08/2026 depois de a
    // alternativa (uma tela só, com pile do sistema fixo) ser descartada — ver
    // brief, seção 6.
    library: 'Library',
    piles: 'Piles',
    search: 'Search',
    settings: 'Settings',
    /** O cabeçalho da seção de pilhas fixadas, na sidebar. */
    pinned: 'Pinned',
  },
  /**
   * Os idiomas que o PRODUTO fala (brief, 3.8) — não os que um objeto carrega.
   *
   * Subiu de `-settings.copy.ts` em 03/09/2026, ao ganhar o segundo consumidor:
   * o wizard de primeiro uso escolhe o idioma-base do servidor, e a folha de
   * tipo de mídia rotula os chips do alternador. Qual língua o produto fala é
   * fato do app, não de Settings.
   *
   * **A folha de tipo não se limita a este mapa**, e a diferença é a regra da
   * quinta leva: ela mostra todo idioma que o OBJETO carrega, inclusive um `es`
   * escrito por outra ferramenta, e cai no próprio código quando não há nome
   * aqui. Este mapa rotula; ele não define o conjunto.
   */
  languages: {
    en: 'English',
    'pt-BR': 'Português',
  } as Record<string, string>,
  account: {
    menu: 'Account',
    admin: 'Admin',
    member: 'Member',
    thisServer: 'this server',
    logOut: 'Log out',
  },
  /**
   * O catálogo de TIPOS saiu daqui em 31/08/2026 (brief, 3.12).
   *
   * `mediaTypes`, `mediaTypesPlural` e `totals` eram registros de seis chaves
   * fixas — a forma que deixou de valer quando o tipo virou vocabulário da
   * instância. Nome, plural e unidade agora vêm da API, já resolvidos no idioma
   * de quem lê (`useMediaTypes`), e um tipo criado pelo admin não teria chave
   * aqui de jeito nenhum.
   *
   * O que ficou é o que é COPY DE TELA de verdade: o rótulo do campo de total,
   * que fala do formulário e não do dado.
   */
  totals: {
    /**
     * Sem unidade nomeada — jogo conta sem ter unidade natural (brief, 3.12).
     */
    generic: 'Total',
    /**
     * Com unidade vinda do tipo. É INTERPOLAÇÃO, não concatenação: a unidade
     * entra num buraco de uma frase que se traduz inteira, e não colada num
     * prefixo fixo. Colar é o que trava tradução — mesma razão de o plural ser
     * chave própria e não o singular com um "s".
     */
    withUnit: (unit: string) => `Total ${unit}`,
  },
  statuses: {
    watching: 'Watching',
    completed: 'Completed',
    dropped: 'Dropped',
    planned: 'Planned',
    'on-hold': 'On hold',
  },
  // A falha de rede é a mesma em toda tela que lê a API — `/library` desenha
  // esta frase palavra por palavra (`design/mockups/library.html`).
  /**
   * A falha de um pedido ao NOSSO servidor, nos dois sabores que ele tem.
   *
   * **Estava em três catálogos, palavra por palavra** — aqui, em `searchCopy` e
   * em `pileDetailCopy` — e todos diziam "Can't reach the server" pra qualquer
   * falha, inclusive um 500 em que o servidor respondeu muito bem. Três cópias
   * é como uma fica pra trás, e a segunda variante teria que ser escrita três
   * vezes; ela é do APP e não de uma tela, então mora onde o app olha.
   *
   * A saída é a mesma nos dois casos, e por isso `retry` fica fora do par.
   */
  error: {
    unreachable: {
      title: "Can't reach Watchpile",
      body: "The server didn't answer. Check that it's running, then try again.",
    },
    failed: {
      title: 'Something went wrong',
      body: 'The server answered with an error. Try again — if it keeps happening, its log has the details.',
    },
    retry: 'Try again',
  },
  entry: {
    rating: 'Rating',
    editTracking: 'Edit tracking',
    /**
     * Nome acessível do `⋯` de uma obra. Ícone sozinho sempre com rótulo.
     *
     * **Havia DOIS** — este e um `actions: 'Title actions'` que só a linha da
     * pilha usava. Duas frases para o mesmo botão é a mesma divergência que
     * fez o menu daquela linha ter um item contra quatro: o segundo arquivo
     * escolheu de novo sem olhar o primeiro.
     */
    moreActions: 'More actions',
    /** O destino, não a ação — o item que abre a obra. */
    viewDetails: 'View details',
    /**
     * Abre a folha de editar (09/09/2026). Diz `title` e não `entry` porque é
     * a palavra que a tela usa em todo lugar — a copy do produto fala de obra,
     * e `entry` é o nome da tabela.
     */
    edit: 'Edit title',
    addToPile: 'Add to pile',
    savedIn: 'Saved in',
    findPile: 'Find a pile',
    newPile: 'New pile',
    newPileName: 'Name it',
    createAndAdd: 'Create',
    noPiles: "You don't have a pile yet.",
    savedNowhere: 'Not in any pile yet.',
    noPileMatch: 'No pile by that name.',
    back: 'Back',
    inPile: 'In this pile',
    notInPile: 'Add to this pile',
    progressLabel: 'Progress',
    ofTotal: 'of',
    save: 'Save',
    cancel: 'Cancel',
    // "Remove from library" só passou a fechar depois que `library` virou termo
    // canônico (brief, 6): biblioteca é o conjunto de TODAS as obras, então
    // sair dela é sair do app inteiro. Enquanto o termo não existia, o rótulo
    // apontava pra um lugar que o produto não tinha.
    removeTitle: 'Remove this work?',
    removeBody:
      'It leaves every pile, and its progress history goes with it. This one cannot be undone.',
    removeConfirm: 'Remove',
    remove: 'Remove from library',
    /**
     * Deliberadamente diferente de `remove`, e a distância entre as duas é o
     * ponto (design system, seção 5, 31/08/2026): tirar de uma pilha mexe numa
     * associação, sair da biblioteca leva progresso e histórico junto.
     *
     * **Ação destrutiva não herda o rótulo curto do vizinho não destrutivo.**
     * O erro que isto evita é alguém "arrumar" uma pilha e descobrir depois
     * que apagou o progresso de doze obras.
     */
    removeFromPile: 'Remove from pile',
  },
  progress: {
    increase: 'Increase progress',
    decrease: 'Decrease progress',
    unknownTotal: '?',
  },
}
