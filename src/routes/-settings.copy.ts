import { appCopy } from '@/lib/copy'
// Copy do MODO Settings — as três seções que existem hoje. O que atravessa
// tela — nav, conta, a falha de rede — continua em `@/lib/copy`.
//
// Um arquivo só para as três, e não um por seção: elas dividem o chrome do modo
// (a coluna, os rótulos de grupo, a saída), e separar a copy espalharia esse
// vocabulário compartilhado por três arquivos que precisariam concordar.
export const settingsCopy = {
  title: 'Settings',
  /** A saída do modo, no slot da marca. Ela diz pra ONDE volta, não "voltar". */
  back: 'Back to Watchpile',
  /**
   * Os grupos são por AUDIÊNCIA, não por assunto (design system, seção 5).
   * Quem não é admin perde o grupo inteiro, com o título junto — é o título
   * sumindo que explica por que ele vê menos.
   */
  groups: {
    you: 'You',
    instance: 'This instance',
  },
  sections: {
    account: 'Account',
    preferences: 'Preferences',
    import: 'Import',
    export: 'Export',
    mediaTypes: 'Media types',
    providers: 'Providers',
    network: 'Network',
    storage: 'Storage',
    about: 'About',
  },
  /**
   * O contador de pendências de uma seção (design system, seção 5, 01/09/2026).
   * Só o rótulo acessível — o visual é o número.
   */
  pending: {
    one: 'needs attention',
    other: 'need attention',
  },
  /**
   * `YOU / Preferences` — o que ESTE app oferece a mim.
   *
   * **Preferência existe onde o sistema não tem opinião** (design system, seção
   * 1, quinto princípio). Aqui há uma só, e ela tem: quais tipos de mídia
   * aparecem nos controles. Idioma entra no dia em que houver biblioteca de
   * i18n — item que não existe não entra na tela.
   */
  preferences: {
    body: 'What this app offers you. These choices are yours — everyone else on this server keeps their own.',
    mediaTypes: {
      title: 'Media types',
      /**
       * Diz onde a escolha aparece, porque "esconder" sozinho promete demais —
       * e a segunda frase responde a pergunta que vem logo depois: **a obra que
       * já existe continua onde estava** (04/09/2026, decisão do dono).
       */
      body: 'Which types this app offers you — in filters, in search, and when you add a title.',
      keeps:
        'Hiding a type never touches your titles: the ones you already have stay in your library.',
      /** Sem contagem de obras aqui: a de `Media types` é de TODOS os usuários,
       * e esta tela é de uma pessoa só. */
      noUnit: 'No unit',
      toggle: (name: string) => `Show ${name}`,
      /**
       * A recusa se anuncia antes do clique (design system, seção 5): o último
       * toggle ligado nasce desabilitado, e a frase diz por quê. Ela só aparece
       * quando resta um — aviso permanente vira ruído.
       */
      last: 'At least one type stays visible: it is what search and the add sheet offer.',
      /** Escrita otimista que voltou atrás. Sem toast no app, a frase mora
       * embaixo da lista, na peça que a pessoa acabou de tocar. */
      failed: "That didn't save. Try again.",
    },
  },
  account: {
    body: 'Who you are on this server.',
    username: 'Username',
    role: 'Role',
    /**
     * O papel explicado, e não só nomeado. "Admin" sozinho não diz o que muda —
     * e o que muda é exatamente a régua do brief 3.9, que vale a pena estar
     * escrita onde a pessoa a encontra.
     */
    adminBody:
      'You set up this server: its media types and, later, its providers.',
    memberBody:
      'Your titles, piles and progress are yours. The server itself is set up by its admin.',
    logOut: 'Log out',
  },
  /**
   * `YOU / Export` — a biblioteca num arquivo que este mesmo servidor lê.
   *
   * **Seção irmã de `Import`, e não uma caixa dentro dela** (decisão do dono,
   * 07/09/2026): *seção é destino e mora na URL* (design system, seção 5), e as
   * duas metades do laço são destinos diferentes — quem vem exportar não está
   * a meio caminho de importar.
   *
   * A copy **nomeia o formato e diz que é o nosso**, porque a pergunta que vem
   * depois de "exportar" é sempre "pra onde isso serve".
   */
  export: {
    body: 'Take your library with you. The file is the same CSV this server imports.',
    csv: {
      title: 'Library as CSV',
      /**
       * Diz o que VAI e, na segunda frase, o que NÃO vai — porque um arquivo
       * chamado de export promete tudo, e este traz obra, status e progresso.
       * A régua é a mesma do import: o escopo se lê antes, não depois.
       */
      body: 'One row per title, with status, progress and the provider link. Piles, ratings and notes are not in it yet.',
      /**
       * **O botão é o VERBO; quem nomeia a coisa é o título da linha** — a
       * régua de 07/09 (*uma linha não diz a mesma palavra duas vezes*) na
       * forma que `THIS INSTANCE / Storage` já usa: "Artwork" + "Clear". Era
       * `Download CSV` ao lado de `Library as CSV`, com "CSV" dito duas vezes
       * a 380px de distância.
       */
      action: 'Download',
      /** A contagem é a mesma que a zona de perigo mostra, e pelo mesmo motivo:
       * um número ao lado do botão diz o tamanho do que está prestes a sair. */
      count: { one: 'title', other: 'titles' },
      inLibrary: (titles: string) => `${titles} in your library`,
      /** Acervo vazio: o botão fica, porque o arquivo com só o cabeçalho é
       * legítimo — o que muda é a frase, que não promete conteúdo. */
      empty: 'Nothing to export yet. The file would have only its header row.',
    },
  },
  /**
   * A zona de perigo de `YOU / Account`.
   *
   * **Mora ali e não numa seção própria** (decisão do dono, 07/09/2026): a
   * seção já é "você neste servidor", e uma quarta linha em `YOU` para uma ação
   * de conveniência faria a coluna crescer por um botão.
   *
   * **A promessa de escrita destrutiva se lê ANTES do clique** (design system,
   * seção 5), e por isso a contagem fica ao lado — como no apagar de tipo de
   * mídia. A diferença é que aqui ela não recusa: ela informa o tamanho.
   */
  danger: {
    title: 'Danger zone',
    deleteLibrary: {
      /**
       * O título nomeia a COISA e o botão nomeia a ação, como em `Storage`.
       * `Delete every title` nos dois lugares dizia a mesma frase duas vezes
       * na mesma linha (régua de 07/09).
       */
      title: 'Your library',
      /**
       * Diz o que vai junto, item por item, porque `cascade` é invisível e o
       * nome da ação só menciona as obras. E diz o que FICA, porque "apagar
       * tudo" numa tela com pilhas soaria como apagar as pilhas também.
       */
      body: 'Every title you track, with its progress, history, provider links and place in each pile. Your piles stay, empty.',
      /**
       * **A contagem entra na PRÓPRIA frase da promessa**, e não numa linha de
       * medida ao lado: aqui o número não descreve um recurso (como as
       * respostas em cache), ele mede o estrago. *Promessa de escrita
       * destrutiva se lê antes do clique* (design system, seção 5), e é o que
       * o apagar de tipo de mídia já faz com a contagem de obras.
       */
      warning: (titles: string) =>
        `Deletes ${titles}. This cannot be undone — export your library first if you might want it back.`,
      action: 'Delete every title',
      confirmTitle: 'Delete every title?',
      confirmBody: (titles: string) =>
        `${titles} and everything tracked about them. This cannot be undone.`,
      confirm: 'Delete',
      cancel: 'Cancel',
      count: { one: 'title', other: 'titles' },
      empty: 'Your library is already empty.',
      done: (titles: string) => `${titles} deleted.`,
      failed: "That didn't go through. Nothing was deleted.",
    },
  },
  /**
   * `THIS INSTANCE / Storage` — o que este servidor guardou porque podia
   * buscar de novo.
   *
   * **Do admin, e aqui divergimos do Yamtrack de propósito:** lá limpar o cache
   * de busca mora em `Advanced`, seção de usuário. Aqui os dois caches são
   * compartilhados pela instalação, e limpá-los gasta a cota de requisição, que
   * também é. *Infraestrutura da instância é do admin* (brief, 3.9).
   */
  storage: {
    body: 'What this server keeps because it can fetch it again. Clearing either one is safe — it comes back on the next search.',
    providerCache: {
      title: 'Search results',
      body: 'Answers from providers, kept for six hours so the same search does not spend the quota twice.',
      /** O que a linha mede: respostas, porque é isso que se apaga. */
      count: { one: 'response', other: 'responses' },
      held: (responses: string, size: string) => `${responses} · ${size}`,
      empty: 'Nothing cached right now.',
    },
    artCache: {
      title: 'Artwork',
      /** Diz o custo real de limpar: a arte volta, mas pela rede. */
      body: 'Posters and covers on disk. Clearing them frees space; they download again as you browse.',
      count: { one: 'file', other: 'files' },
      held: (files: string, size: string, limit: string) =>
        `${files} · ${size} of ${limit}`,
      empty: 'Nothing cached right now.',
    },
    /**
     * A terceira coisa que NÃO se apaga aqui. Ela entra na copy porque a
     * pergunta "e a ficha da obra?" nasce olhando as duas linhas acima — e a
     * resposta é o que o snapshot promete.
     */
    snapshots:
      'The saved copy of each title stays: it is what keeps your library readable when a provider is down.',
    action: 'Clear',
    clearing: 'Clearing…',
    /** Depois do clique, na própria linha — o app não tem toast. */
    cleared: (size: string) => `${size} freed.`,
    failed: "Couldn't clear that. Nothing changed.",
  },
  /**
   * `THIS INSTANCE / Network` — em qual interface este servidor escuta.
   *
   * **A seção só existe onde o controle existe**, que hoje é o desktop: num
   * container desligar conexões remotas trancaria do lado de fora quem acabou
   * de desligar. "Affordance descreve o que existe" vale aqui como vale na nav.
   */
  network: {
    body: 'Choose whether other devices on your network can reach this server.',
    allowRemote: {
      title: 'Allow remote connections',
      body: 'With this off, only this computer can reach Watchpile. Turn it on to open the app from your phone or another machine on the same network.',
      toggle: 'Allow remote connections',
      /** O endereço cru, para quem quiser conferir. */
      listening: (host: string) => `Listening on ${host}`,
    },
    /**
     * O reinício é a metade que falta da escrita, e a frase é o que impede o
     * toggle de parecer um clique que não pegou — o app não tem toast.
     */
    restart: 'Saved. Close and reopen Watchpile for this to take effect.',
    failed: "Couldn't save. Nothing changed.",
  },

  about: {
    body: 'A self-hosted tracker for the things you watch, read and play.',
    license: 'License',
    licenseBody:
      'AGPL-3.0. You run this yourself, and the source stays open to whoever you share it with.',
    storage: 'Your data',
    /**
     * Diz onde o dado mora, que é a pergunta real de quem hospeda — e é uma
     * promessa do brief 3.1, não uma frase de marketing.
     */
    storageBody:
      'Everything lives in one SQLite file on the machine running this server. Backing it up is copying that file.',
  },
  providers: {
    body: 'Where this server looks up titles. Everyone here searches through them.',
    /** Provedor sem tipo é **ocioso, não quebrado** (brief, 3.10). */
    servesNoType: 'Serves no type yet',
    sheet: {
      /** Diz o alcance: configurado por um, usado por todos. */
      body: (types: string) =>
        `${types} · set up by the server admin, used by everyone.`,
      noTypes: 'Not used by any type yet · set up by the server admin.',
      /**
       * O campo nasce VAZIO mesmo com chave salva, porque o GET nunca devolve o
       * segredo. **Campo vazio não pode significar "apague"** — não tocar manda
       * nada, e apagar é esta ação nomeada.
       */
      remove: 'Remove',
      /**
       * Apagar é PENDENTE até salvar, e por isso precisa aparecer: a versão
       * anterior marcava a credencial em estado interno e não mudava nada na
       * tela, então o botão parecia quebrado (design system, seção 8, oitava
       * leva — ação cujo único efeito é invisível).
       */
      willRemove: 'Will be removed when you save.',
      undoRemove: 'Undo',
      placeholder: 'Paste your key',
      /**
       * Env que vence trava o campo com o nome da variável. Sem isso a pessoa
       * edita, salva e nada acontece — config em duas fontes sem indicação.
       */
      lockedBy: (envVar: string) =>
        `Set by ${envVar}. Editing here would do nothing, so the field is locked.`,
      noCredentials:
        'This provider needs no credentials — it answers public requests.',
      test: 'Test connection',
      testing: 'Asking…',
      /** Falha de rede NOSSA, que é diferente de o provedor recusar. */
      testFailed: 'The request could not be sent.',
      /**
       * O rótulo da peça que mostra o corpo cru da resposta do provedor
       * (08/09/2026, decisão do dono).
       *
       * **Frase NOMINAL, sem o nome do provedor.** "What AniList said" pediria
       * um artigo em pt-BR — "O que o AniList respondeu" —, e artigo dentro de
       * copy interpolada é a armadilha de 01/09: ele concorda com um DADO. E o
       * nome não faz falta: a folha inteira é sobre este provedor.
       *
       * **A frase é nossa e traduzível; o que vem abaixo dela não é** — e não
       * tem como ser (ver `ProviderTestSchema`). É por isso que a peça existe:
       * ela diz de quem é a fala sem precisar traduzi-la.
       */
      testDetail: 'Provider response',
      attribution: 'Attribution',
      save: 'Save',
      cancel: 'Cancel',
    },
    /**
     * A chave embutida. **Ponto de `--color-warning`, nunca banner** — rodar
     * nela não é defeito, e caixa colorida mentiria sobre o tamanho do fato
     * (design system, seção 5).
     */
    embedded: {
      row: 'Using the key that ships with Watchpile',
      sheet:
        'Using the key that ships with Watchpile. It is shared by every install, so it can be rate limited. Your own key is free and takes a minute.',
    },
    /**
     * Falta credencial declarada. A frase nomeia o que falta, não o estado.
     *
     * **Sem artigo, e é decisão de i18n, não economia.** "Needs a API key" saiu
     * errado na tela porque o artigo depende da primeira letra do RÓTULO, que
     * vem da definição do provedor e pode ser qualquer coisa. Escolher entre
     * "a" e "an" a partir do dado é a armadilha clássica — e em pt-BR o
     * problema é outro (gênero e número: "Falta a chave" / "Faltam o ID e o
     * segredo"). Frase nominal atravessa os dois idiomas sem concordar com
     * nada.
     */
    missing: (labels: string) => `Missing ${labels}`,
    empty: {
      title: 'No providers',
      body: 'Without one, titles can only be added by typing them in. Watchpile ships with TMDB — if it is gone, this install was edited by hand.',
    },
    forbidden: {
      title: 'This is set by the server admin',
      body: 'Providers are shared by everyone here, so only an admin changes them. You can still search with whatever they set up.',
      back: 'Back to settings',
    },
  },
  /**
   * O bloco do provedor padrão, na folha de tipo de mídia (brief, 3.10).
   *
   * Ele mora no TIPO e não no provedor porque escolher pelo lado do provedor
   * faria marcar um tipo ROUBÁ-LO do provedor anterior — efeito colateral num
   * objeto que não está na tela.
   */
  defaultProvider: {
    label: 'Search source',
    providersLabel: 'Providers',
    /** Com um candidato não há o que decidir. */
    onlyOne: 'The only provider for this type, so it answers every search.',
    onlyOneHint: 'When a type has one provider, there is nothing to choose.',
    /**
     * ── A copy descreve a BUSCA, e isso foi corrigido em 02/09/2026 ──────────
     *
     * Ela dizia "Titles and fields come from here", que é a intenção do brief
     * (3.10) e **não** o que a escolha faz hoje. A escolha tinha dois
     * consumidores: `search.handlers.ts`, que decide quem RESPONDE a busca, e
     * `entries.source.ts`, que decide de qual vínculo saem arte e sinopse
     * quando a obra tem MAIS DE UM. O segundo era inalcançável — nada criava o
     * segundo vínculo —, então a copy antiga prometia o dormente e calava o
     * vivo. E o `noneBody` era pior: "cada obra guarda a fonte de onde veio"
     * era verdade nas TRÊS opções, então o contraste que ele desenhava era
     * falso.
     *
     * **A correção virou definitiva um dia depois**: em 02/09/2026 o segundo
     * consumidor saiu daqui de vez (virou `entries.primary_provider`), então
     * não há mais "segunda metade" para voltar. Esta copy é a copy inteira.
     */
    chosen: 'Searches for this type go here.',
    none: 'No search source',
    /**
     * O desempate real do servidor (`chooseSearchProvider`), dito em voz alta:
     * sem ele "No search source" se lê como "nada acontece", quando na
     * verdade a escolha só passa a ser feita por outro critério.
     */
    noneBody: 'Searches use whichever provider comes first by name.',
    hint: 'A type can have more than one provider. This says which one answers.',
    /**
     * Sem provedor não há bloco de escolha: há a frase que diz o que a ausência
     * significa. Ela **não é alerta** — quatro dos seis tipos estão assim.
     */
    noProvider:
      'No provider serves this type, so titles are added by typing them in. Searching says so out loud instead of coming back empty.',
  },
  /**
   * Quais provedores servem este tipo — o controle que faltava (brief, 3.10,
   * 10/09/2026).
   *
   * **A copy tem que dizer que se COPIA uma receita**, e não que se marca uma
   * caixa, porque é isso que o gesto faz: a junção carrega o corpo da busca, o
   * mapa de campos e o token do provedor, e a linha em branco cai no endpoint
   * do provedor. Esconder isso deixaria a pessoa achar que escolheu um provedor
   * quando escolheu um provedor **e um jeito de falar com ele**.
   */
  typeProviders: {
    add: 'Add a provider',
    /** O segundo passo, e o cabeçalho dele nomeia o provedor escolhido. */
    copyFrom: (provider: string) => `Serve it like — ${provider}`,
    /**
     * A frase do segundo passo. Ela diz o mecanismo porque o mecanismo é a
     * promessa: a receita que já responde por outro tipo é uma receita provada.
     */
    copyHint:
      'It will talk to this provider the same way one of these types already does.',
    remove: (provider: string) => `Stop using ${provider}`,
    /**
     * A recusa vem do servidor com a contagem, e a frase diz a CONSEQUÊNCIA em
     * vez de repetir o número: sem a receita, arte e detalhe param de funcionar
     * para essas obras, e nada na tela diria por quê.
     */
    inUse: (count: string) =>
      `${count} already point at it. Unlink them from those titles first — without this provider, their artwork and details stop loading.`,
    failed: "That didn't save. Try again.",
    /** Nenhum provedor tem receita a emprestar: todos estão ociosos. */
    nothingToAdd:
      'No provider serves any type yet, so there is no recipe to copy.',
  },
  mediaTypes: {
    body: 'The kinds of media this server can track. Everyone on this server shares them.',
    add: 'Add type',
    /** Quando o tipo não conta nada — filme é 1/1 (brief, 3.12). */
    noUnit: 'No unit',
    // Montado com `Intl.PluralRules` (`lib/format.ts`): "1 title" e "4 titles"
    // já são regra de idioma, e a do português é outra.
    titleCount: { one: 'title', other: 'titles' },
    /**
     * Zero não é "0 titles". A contagem existe pra sustentar a recusa de apagar,
     * e o caso em que apagar é PERMITIDO merece dizer isso com palavras em vez
     * de um zero que se lê como ruído.
     */
    noTitles: 'No titles',
    /**
     * A folha de tipo — quatro campos, contra o campo único da pilha. **O peso
     * do formulário acompanha o objeto** (design system, seção 5): pilha ganhou
     * popover, obra e tipo ganham folha.
     */
    sheet: {
      editTitle: 'Edit type',
      createTitle: 'New type',
      /**
       * Diz o que salvar ALCANÇA — todo mundo neste servidor, cada um no
       * próprio idioma. É a frase que liga o formulário à régua do brief 3.9:
       * tipo é vocabulário da instância, não conteúdo de usuário.
       */
      body: 'Everyone on this server sees these changes, in their own language.',
      name: 'Name',
      nameHint: "Shown wherever a title's type appears.",
      plural: 'Plural',
      pluralHint:
        'Used in filters and counts. Not the singular with an s — that breaks in other languages.',
      unit: 'Progress unit',
      unitPlaceholder: 'Episodes',
      unitHint:
        'What one step of progress is called. Leave it empty when there is no natural unit.',
      icon: 'Icon',
      changeIcon: 'Change…',
      /**
       * **A copy inteira do campo mora aqui, e ela cresceu de propósito.**
       *
       * Ele teve um irmão por algumas horas (`asks_total`), e cada um explicava
       * metade da coisa. Com um toggle só, a linha precisa responder as duas
       * perguntas que um admin faz na frente dela: **o que muda** e **quando
       * desligar**.
       *
       * **Ela não nomeia tipo nenhum**, e isso é regra (04/09/2026): copy não
       * enumera um conjunto que o DADO controla — uma instalação que apagou
       * `Game` leria um exemplo de algo que ela não tem. `Episodes, chapters,
       * pages` são UNIDADES, não tipos: descrevem a forma do que se conta e
       * valem em qualquer instalação.
       */
      countsProgress: 'Count progress',
      countsProgressBody:
        'On, a title counts up — episodes, chapters, pages — and can be given a total.',
      /**
       * O corpo quando está DESLIGADO. Duas frases porque a segunda é a que
       * responde "quando eu uso isto?", e sem ela o toggle descreve um efeito
       * sem dizer para quê.
       */
      countsProgressOffBody:
        'Off, the status is the whole story: a title is done, or it is not.',
      /**
       * O irmão do contador, e a copy tem que dizer que são DUAS perguntas —
       * senão o segundo toggle se lê como uma variação do primeiro.
       *
       * **`Track time` e não `Hours played`:** a caixa é do TIPO, e audiolivro,
       * podcast e curso têm o mesmo formato. "Played" seria copy de jogo num
       * campo que não é de jogo.
       */
      tracksTime: 'Track time spent',
      tracksTimeBody:
        'On, a title also records how long you spent on it — hours and minutes, with no total to reach.',
      tracksTimeOffBody:
        'Off, nothing asks how long. This is separate from counting: a type can do both, one, or neither.',
      save: 'Save',
      create: 'Create type',
      cancel: 'Cancel',
      /**
       * As duas recusas do formulário, escritas ANTES do clique — o app não tem
       * toast, então aceitar o clique e falhar não teria onde dizer o motivo.
       */
      needsOneLanguage: 'Fill in at least one language.',
      halfFilled: (language: string) =>
        `${language} needs both a name and a plural, or neither.`,
      /** O ponto de `--color-warning` no chip do idioma sem tradução. */
      missingTranslation: 'translation missing',
      /**
       * Subiu pra `lib/copy.ts` em 03/09/2026, ao ganhar o segundo consumidor
       * (o wizard de primeiro uso). Fica o ponteiro porque a folha continua
       * lendo daqui — e porque o mapa ROTULA idioma, nunca define o conjunto
       * que a folha mostra.
       */
      languages: appCopy.languages,
    },
    /**
     * O seletor de ícone: BOTÃO com busca, não paleta visível. A restrição não é
     * quantos glifos existem — é quantos ainda se leem a 12px dentro do selo de
     * vidro da carta (design system, seções 2 e 5).
     */
    iconPicker: {
      search: 'Search icons',
      /**
       * A busca é por nome de glifo em INGLÊS, e ele não se traduz — quem usa a
       * UI em pt-BR procura "livro" e não acha `book`. Das duas saídas
       * registradas (sinônimos por idioma, ou assumir inglês e DIZER isso), esta
       * é a segunda: a decisão de sistema segue em aberto (#12).
       */
      hint: 'English names, curated for legibility at badge size.',
      noMatch: 'No icon by that name.',
      empty: 'Pick an icon',
    },
    /**
     * `Add type` oferece os templates ANTES do formulário em branco (design
     * system, seção 5; brief 3.9): onde o produto embarca conjunto pronto,
     * criar mostra o conjunto primeiro.
     */
    templates: {
      title: 'Start from a template',
      body: 'The types this product ships with. Pick one to fill the form — you can change everything before saving.',
      installed: 'Already here',
      scratch: 'Start from scratch',
      scratchBody: 'A blank form, for a type this product does not ship.',
    },
    delete: {
      label: 'Delete type',
      /**
       * A recusa carrega a CONTAGEM, e ela já estava na linha antes do clique.
       * "some of them on other accounts" é o que explica por que o admin não
       * consegue resolver isso sozinho apagando as próprias obras.
       */
      inUse: (count: string) =>
        `${count} still use this type, some of them on other accounts. Change their type first.`,
      free: 'No titles use this type, so nothing is lost.',
    },
    empty: {
      title: 'No media types yet',
      body: 'Nothing can be tracked until this server has at least one type. Add the first one.',
    },
    /**
     * Não é o estado de erro: o servidor respondeu, e respondeu certo. A saída
     * é a volta, não "Try again" — repetir daria 403 de novo (design system,
     * seção 6, a mesma distinção que separou não-encontrado de erro).
     */
    forbidden: {
      title: 'This is set by the server admin',
      body: 'Media types are shared by everyone here, so only an admin changes them. Ask whoever runs this server.',
      back: 'Back to settings',
    },
  },
}
