/**
 * Copy das DUAS telas de detalhe — `/library/:id` e `/search/:provider/:id`.
 *
 * Um arquivo só porque é um molde só: o que muda entre elas é de onde o dado
 * vem, não o que a tela diz. Copy duplicada em dois arquivos diverge no
 * primeiro ajuste, e aí as duas telas passam a falar diferente da mesma coisa.
 */
export const titleDetailCopy = {
  back: 'Back',
  /** Vindo do provedor, e o nome dele vem do contrato — nunca do cliente. */
  from: (provider: string) => `From ${provider}`,
  yearUnknown: 'Year unknown',
  noSynopsis: 'No description from the provider.',

  progress: 'Progress',
  status: 'Status',
  piles: 'Piles',

  /**
   * A COLUNA ESQUERDA. Rótulos curtos porque a coluna tem 200px — e curto
   * também aguenta o português, que ocupa ~30% mais.
   */
  /** O rótulo acessível de cada caixa: `38` sozinho não diz de quê. */
  timeHours: 'Hours spent',
  timeMinutes: 'Minutes spent',
  /**
   * As unidades, curtas porque a caixa tem 200px — e parametrizadas porque no
   * dia em que houver catálogo elas mudam de idioma junto com o resto.
   */
  timeHourUnit: 'h',
  timeMinuteUnit: 'm',
  rail: {
    /**
     * A caixa de tempo investido — 10/09/2026. **`Time played` seria copy de
     * jogo**, e a caixa é do TIPO: audiolivro e podcast têm o mesmo formato, e
     * "played" mentiria nos dois. `Time spent` atravessa todos.
     */
    timeSpent: 'Time spent',
    details: 'Details',
    links: 'Links',
    /**
     * "Activity", não "History": o log é de PROGRESSO, e status, nota e notas
     * não são registrados em lugar nenhum. Prometer histórico e mostrar metade
     * é pior que dizer o que se mostra.
     */
    activity: 'Activity',
    started: 'Started',
    lastActivity: 'Last activity',
    /** O progresso ganha a unidade no rótulo: "8 / ?" sozinho não dizia de quê. */
    progressOf: (unit: string) => `Progress · ${unit}`,
    addNote: 'Add a note…',
    noPiles: 'Not in any pile.',
    add: 'Add',
  },

  /**
   * A caixa de FONTES — de quais provedores a obra fala (brief, 3.10).
   *
   * **`Source` e não `Primary`** na marca: sem promoção explícita quem fala é o
   * vínculo mais antigo, e chamar aquilo de `primary` prometeria uma decisão
   * que ninguém tomou. Quem promove é o `Make source` abaixo.
   */
  sources: {
    label: 'Sources',
    /** O vínculo de onde saem sinopse, ano e arte. */
    effective: 'Source',
    /**
     * O estado vazio, e ele é o mais comum hoje: toda obra digitada à mão está
     * assim, e é justamente ela que o convite serve.
     */
    empty: 'Not linked to any provider.',
    link: 'Link',
    linkTitle: 'Link to a provider',
    /**
     * **Frase nominal, sem artigo interpolado** — "Link to a provider" seguido
     * do nome erraria em `a`/`an` e, em pt-BR, em gênero. Mesma armadilha do
     * plural com "s" colado.
     */
    linkBody: (title: string) =>
      `Pick the match for “${title}”. Its details and art will come from there.`,
    /** A recusa que é de escolha, não de falha: já se vinculou tudo que há. */
    allLinked: 'Every source for this type is already linked.',
    noSource: 'No provider serves this type yet.',
    noSourceAdmin: 'Connect one in Settings › Providers.',
    openProviders: 'Open providers',
    searchLabel: 'Search the provider',
    searching: 'Searching…',
    noResults: (term: string) => `Nothing found for “${term}”.`,
    /**
     * O resultado que outra obra SUA já reivindica — marcado antes do clique,
     * porque o app não tem toast pra explicar a recusa depois dele.
     */
    takenBadge: 'Another title in your library uses it',
    /**
     * **`Unlink`, nunca `Remove`** — tirar o vínculo não é apagar a obra, e a
     * ação destrutiva do vizinho (`Delete title`) leva progresso e log junto.
     * Ação destrutiva não herda o rótulo curto do vizinho (design system, 5).
     */
    unlink: (provedor: string) => `Unlink from ${provedor}?`,
    /**
     * **Frase que cobre tudo, e não uma lista de três.**
     *
     * Ela dizia "Your progress, score and notes stay" — três, quando sobrevivem
     * seis: status, total, pilhas e o log também. Enumerar um subconjunto
     * sugere que o resto talvez não fique, e como o app não tem toast a copy é
     * o único lugar onde isso pode ser dito. É a mesma armadilha do artigo
     * interpolado, de outro jeito: o que quebra é a parte que a frase não
     * mencionou.
     */
    unlinkBody: 'Only the link goes. Everything you tracked stays.',
    unlinkConfirm: 'Unlink',
    /**
     * A espera se diz no RÓTULO — o botão vermelho não desbota (ver
     * `ui/button.tsx`), então é a palavra que conta que a escrita está no ar.
     */
    unlinkPending: 'Unlinking…',
    unlinkFrom: (provedor: string) => `Unlink from ${provedor}`,

    /**
     * PROMOVER — escolher de qual vínculo a obra fala.
     *
     * **`Make source`, e não o rótulo da tela de tipos**: lá a escolha é do
     * TIPO e decide qual provedor responde à busca do servidor inteiro. Reusar
     * a palavra aqui faria duas coisas diferentes terem o mesmo nome, e uma
     * delas é do admin.
     */
    make: 'Make source',
    /**
     * O PREVIEW, e ele é a página inteira — não uma miniatura na coluna.
     *
     * ── Por que a primeira versão morreu ────────────────────────────────────
     * Ela era um par de cartões na coluna de 200px, com duas sinopses cortadas
     * a 11px. O dono apontou: "não dá pra ver quase detalhe nenhum". Estava
     * certo, e o erro tem nome — **o preview de uma tela é a tela**. O que a
     * troca muda é arte, seções, lista de episódios e vínculos, e nada disso
     * cabe numa caixa da coluna. Uma segunda renderização em miniatura também
     * seria a segunda medida do mesmo objeto, que é como uma fica pra trás.
     *
     * A tela já sabia fazer isso: `TitleDetail` é o mesmo molde de
     * `/search/:provider/:id`, que renderiza exatamente "esta obra vista por um
     * provedor". Prever é o TERCEIRO chamador dele.
     */
    previewing: (provedor: string) => `Previewing ${provedor}`,
    /**
     * O que fica, dito na barra e não num cartão: a coluna esquerda continua na
     * tela com progresso, status, nota e pilhas intactos, então a frase confirma
     * o que os olhos já veem em vez de pedir que se acredite nela.
     */
    previewKeeps: 'Nothing you tracked changes.',
    previewLoading: 'Loading…',
    /**
     * Preview que não carregou **não trava a troca**: a escolha é sobre de onde
     * a obra fala, não sobre o provedor estar de pé neste segundo.
     */
    previewFailed: "Couldn't load it. You can still switch.",
    makeConfirm: 'Use this source',
    /** A linha que já é a fonte não oferece promover: ela já é. */
    alreadySource: 'Details and art come from here.',
    cancel: 'Cancel',
    failed: "Couldn't link it. Try again.",
  },

  fields: {
    /**
     * **`Format` é o SUBTIPO, não o tipo de mídia** — 02/09/2026.
     *
     * Ela mostrava o tipo (`Game`, `Anime`), que o selo com ícone no cabeçalho
     * já diz — a tela falava duas vezes a mesma coisa, e a palavra certa estava
     * ocupada. Agora é o que a obra é DENTRO do tipo: `Mod`, `One Shot`, `ONA`.
     * Mesmo rótulo que o Yamtrack usa. Provedor sem subtipo perde a linha, que é
     * o que o `DetailsBox` já faz com valor nulo.
     */
    format: 'Format',
    firstAired: 'First aired',
    /**
     * **`seasons` saiu daqui em 10/09/2026.** Ele nomeava o CONJUNTO de grupos,
     * e o produto não decide como o agrupamento se chama — o provedor decide, e
     * agora ele declara (`unitGroupLabel`, no par). Escrito aqui, ele diria
     * "Seasons" sobre uma lista de volumes no dia em que um par de mangá
     * agrupasse.
     */
    /**
     * **O rótulo do total NÃO se escreve aqui — 09/09/2026.** Ele era
     * `'Episodes'`, e a tabela o usava pra todo tipo de mídia: num mangá a
     * seção logo acima dizia `PROGRESS · CHAPTERS`, certo, e dois blocos
     * abaixo a tabela dizia `Episodes 999`.
     *
     * A resposta estava na mesma tela: `progressUnit`, que chega plural e
     * traduzida do servidor e é o que faz o cabeçalho de cima acertar. **A
     * lição já estava registrada e não tinha sido aplicada aqui** — o
     * `client/CLAUDE.md` escreve, sobre o título da seção de unidades, que
     * "escrever 'Episodes' erraria em mangá". Foi aplicado lá e a tabela ficou
     * de fora: a mesma correção com duas cópias, e uma delas não recebeu.
     */
    year: 'Year',
  },

  recommendations: 'Recommendations',

  /**
   * Duas notas, dois rótulos. Sem eles, `8.4` e `7.9` na mesma linha são o
   * mesmo número duas vezes — a sua é dado da obra, a do provedor é contexto.
   */
  yourScore: 'Your score',
  providerScore: (provider: string) => `${provider} score`,
  scoreHint: 'Tap to change',
  scoreEmpty: '—',
  votes: (n: string) => `${n} votes`,
  clearScore: 'Clear your score',

  notes: {
    label: 'Notes',
    placeholder: 'Anything you want to remember about it.',
    /**
     * O campo diz que gravou **na própria peça**. O app não tem toast, e um
     * campo de texto que grava calado é o pior dos dois mundos — a condição
     * mora no objeto, nunca num banner (design system, seção 5).
     */
    saving: 'Saving…',
    saved: 'Saved',
    failed: "Couldn't save",
  },

  add: 'Add to library',
  addHint: 'It goes into your library, and into any piles you pick.',
  /**
   * **Era `Already in your library`, que é um FATO e não uma ação** — o botão
   * levava para a obra e nada nele dizia isso. Um botão nomeia o que acontece
   * ao clicar; o fato de já a ter fica dito pela linha abaixo e pelo caminho
   * que trouxe você aqui.
   */
  owned: 'View in your library',
  ownedHint:
    'Progress, status and piles live there — this page is the source’s.',
  /**
   * Substitui `addHint` na caixa de nota quando a obra já é sua. A frase de
   * adicionar promete um futuro que já aconteceu, e copy que descreve o que a
   * tela faz HOJE não sobrevive a ser reusada em dois estados.
   */
  ownedScoreHint: 'Set it in your library.',
  openOwned: 'Open it',

  /**
   * O `⋯` do título não tem copy própria: ele é o menu da carta
   * (`appCopy.entry.*`), e duas redações pro mesmo diálogo é defeito que só
   * aparece inteiro no dia da tradução.
   */
  notFound: {
    title: "This title isn't here",
    body: 'It may have been deleted from another tab. The rest of your library is still here.',
    action: 'Back to library',
  },
  providerNotFound: {
    title: (provider: string) => `${provider} doesn't have this title`,
    body: "The link may be old, or the title may have been removed from the provider's catalogue.",
    action: 'Back to search',
  },
  /**
   * A recusa, e ela **não é o estado de erro**: o nosso servidor respondeu, e
   * respondeu certo. A gravidade acompanha o fato — falta de chave é condição
   * da instalação e fica neutra (design system, seção 5, 01/09/2026).
   */
  unavailable: {
    'not-configured': {
      title: 'This provider needs a key',
      body: 'An admin has to connect it before this page can show anything.',
    },
    'rate-limited': {
      title: 'Too many requests just now',
      body: 'The provider is limiting us. It usually clears in a minute.',
    },
    'provider-error': {
      title: 'The provider answered with an error',
      body: 'Nothing is wrong on this server. Try again in a moment.',
    },
    unreachable: {
      title: "Couldn't reach the provider",
      body: 'Check this server’s connection, then try again.',
    },
  },
  retry: 'Try again',

  /**
   * A linha que diz que esta página é uma CÓPIA GUARDADA — 07/09/2026.
   *
   * O servidor degrada para o snapshot quando o provedor não responde, e a
   * obra continua inteira na tela. **Sem esta linha isso seria mentira por
   * omissão**: uma sinopse de dois meses atrás apresentada como a de agora é a
   * mesma família de má atribuição que os consertos do 504 e do 403 tiraram da
   * busca — a tela afirmando com confiança algo que ninguém verificou.
   *
   * **"Saved", não "Offline".** O nosso servidor está de pé e respondeu; quem
   * não respondeu foi o provedor. "Offline" descreveria a máquina errada.
   *
   * O motivo entra na mesma linha, e **sem cor**. O fato é "você está vendo
   * uma cópia", que não é emergência — e a parte que tem o que arrumar
   * (`not-configured`) já mora em Settings, com o contador da coluna, que é
   * onde ela é acionável. Pintar aqui seria a régua do sinal virada contra si
   * mesma (design system, seção 5).
   */
  snapshot: {
    from: (when: string) => `Saved copy from ${when}`,
    why: {
      'not-configured': 'this provider needs a key',
      'rate-limited': 'the provider is limiting us',
      'provider-error': 'the provider answered with an error',
      unreachable: "couldn't reach the provider",
    },
  },

  /**
   * As UNIDADES — episódio, capítulo, o que o provedor tiver.
   *
   * A copy **não escreve "Episode"** de propósito: o número é o que identifica,
   * e o nome do grupo já veio do provedor. Fixar "Episode" aqui erraria em
   * mangá, que é o mesmo motivo pelo qual o schema não se chama `episodes`.
   */
  units: {
    number: (n: number) => `#${n}`,
    untitled: (n: number) => `#${n}`,
    noSynopsis: 'No description from the provider.',
    runtime: (m: number) => `${m}m`,
    mark: (n: number) => `Mark #${n} watched`,
    watched: (done: string, total: string) => `${done} / ${total} watched`,
    failed: "Couldn't load the list.",
  },
} as const
