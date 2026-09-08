// Copy de `/search`. O que atravessa tela mora em `@/lib/copy`.
export const searchCopy = {
  title: 'Search',
  /**
   * O placeholder nomeia o TIPO e a FONTE, porque os dois decidem o que a
   * busca vai achar — e porque a tela descreve o que ela faz hoje (design
   * system, seção 7). Interpolação, nunca concatenação: o rótulo entra num
   * buraco de uma frase que se traduz inteira.
   */
  placeholder: (type: string, source: string) => `Search ${type} on ${source}`,
  /** Sem fonte não há o que buscar, e o campo diz isso em vez de convidar. */
  placeholderWithoutSource: (type: string) => `No source for ${type}`,
  scope: {
    label: 'Media type to search',
    /**
     * O cabeçalho do grupo, e ele é a resposta em PALAVRA que a bolinha
     * tentava dar com um glifo mudo.
     */
    noSource: 'No source',
    /**
     * O rótulo invisível do controle de fonte. Nomeia o TIPO porque há um
     * desses por linha, e "Change source" sozinho se repetiria idêntico em
     * todas — quem navega por leitor de tela ouviria o mesmo texto n vezes sem
     * saber qual linha está tocando.
     */
    changeSourceOf: (type: string) => `Change source for ${type}`,
  },
  results: { one: 'result', other: 'results' },
  source: 'Source',
  changeSource: 'Change source',
  yearUnknown: 'Year unknown',
  /**
   * O separador entre ano e subtipo. **Está no catálogo, não no JSX**, pela
   * mesma regra de toda string visível — e porque pontuação é a primeira coisa
   * que muda de idioma sem ninguém avisar.
   */
  dot: '·',
  /**
   * O cabeçalho de um vínculo cujo provedor não nomeou a relação.
   *
   * **Não acontece hoje** — quem não nomeia declara `kindConst`, como o IGDB
   * faz com `parent`. Existe porque o contrato deixa `kind` nulável, e seção
   * sem título seria uma lista solta no meio da página.
   *
   * **E continua não acontecendo depois das recomendações — 03/09/2026**,
   * ainda que elas cheguem com `kind` nulo em todo item. Elas não passam por
   * aqui: têm componente e título próprios, justamente pra não caírem sob um
   * cabeçalho que quer dizer "o provedor esqueceu de nomear".
   */
  relatedFallback: 'Related',
  /**
   * O título da seção de recomendações.
   *
   * **Não é "Recommended", e a diferença é o que a frase afirma.** Nenhum dos
   * três provedores endossa nada: o IGDB chama o campo de `similar_games`, o
   * AniList conta votos da comunidade e o TMDB calcula. "More like this" diz
   * *semelhança*, que é o que os três de fato computam, e serve de cabeçalho
   * pros três sem que um deles vire mentira.
   *
   * A copy nasce aqui, e não no servidor, porque quem nomeia a seção é quem
   * fala o idioma de quem lê — é por isso que `field_map.recommendations` não
   * declara `kindConst`.
   */
  recommended: 'More like this',
  owned: 'In your library',
  ownedBadge: 'Already in your library',

  /**
   * Vazio 1 — antes de qualquer busca. Ele diz ONDE vai procurar, que é a
   * informação que falta quando a busca falha depois. A última linha aponta
   * pra `/library` porque **esta tela não olha a biblioteca**: quem procura o
   * que já tem procura lá.
   */
  idle: {
    title: 'Nothing searched yet',
    body: (type: string, source: string) =>
      `Type a name above. ${type} are searched on ${source}.`,
    library: 'Looking for something you already track? Go to your library',
  },

  /** Vazio 2 — o catálogo respondeu e não tinha. Só aqui o vazio é honesto. */
  noResults: {
    title: (term: string) => `No results for “${term}”`,
    body: (source: string, type: string) =>
      `${source} has nothing under that name for ${type}. Check the spelling, or try another type.`,
    manual: 'Add it manually',
  },

  /**
   * As cinco recusas. Cada uma aponta pra uma saída DIFERENTE, e é por isso
   * que o motivo viaja como campo em vez de virar uma frase só: quem caiu em
   * `no-provider` precisa de um admin, quem caiu em `not-configured` precisa
   * de uma chave, e quem caiu em `rate-limited` só precisa esperar.
   *
   * O corpo vem do SERVIDOR (`refusal.message`) — ele é quem sabe qual
   * provedor falhou e com que status. Aqui ficam só o título, que resume o
   * fato, e os botões, que são a saída.
   */
  refusal: {
    'no-provider': (type: string) => `No source for ${type}`,
    /**
     * O corpo deste caso é da TELA, não do servidor — e é o único assim.
     *
     * Ela já sabe quais tipos têm fonte (veio junto com os provedores), então
     * não há requisição a fazer nem `reason` a receber: **o que a tela já
     * sabe, ela diz**, sem esperar (design system, seção 8, quarta leva). Nos
     * outros quatro motivos quem sabe é o servidor — ele conhece o provedor
     * que falhou e o status.
     */
    noProviderBody:
      'Nothing is connected to search this type, so titles are added by typing them in.',
    'not-configured': 'This source needs a key',
    'rate-limited': 'Too many searches at once',
    /**
     * **`4xx` e `5xx` são fatos diferentes** — 02/09/2026. "Refused" é o `4xx`,
     * e ele descreve o provedor recusando o NOSSO pedido: há configuração a
     * arrumar, e é o único destes dois que oferece o botão de Settings.
     */
    'provider-refused': 'The source refused the search',
    /**
     * O `5xx`, e a frase **não** diz "refused": o provedor está falhando do
     * lado dele. Foi o 504 que o Jikan passou a devolver em tudo que expôs a
     * copy antiga — ela mandava arrumar uma configuração que está certa.
     */
    'provider-down': 'The source is having trouble',
    unreachable: 'The source could not be reached',
    /** Só pra admin: quem não é não recebe botão que não pode usar. */
    openProviders: 'Open providers',
    addManually: 'Add manually',
    retry: 'Try again',
    /**
     * A saída que existe quando o provedor não responde — offline, por
     * exemplo. **A busca da `/library` continua funcionando**, porque o
     * SQLite é local (brief, 3.1), e sem esta linha a tela é um beco: diz que
     * não deu e não conta que metade do app está de pé.
     *
     * Leva o TERMO junto: mandar pra biblioteca vazia faria a pessoa digitar
     * de novo o que ela acabou de digitar.
     */
    searchLibrary: 'Search your library instead',
  },
}
