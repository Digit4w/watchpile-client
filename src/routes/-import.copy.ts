import { countOf, formatNumber } from '@/lib/format'
import type { ImportProblem, ImportSourceSlug } from '@/services/import'

/**
 * A copy de `YOU / Import` (brief, 3.12; design system, seções 2, 5, 7 e 8).
 *
 * **A frase mora aqui, e o servidor manda `kind` + `params`.** Mesma régua da
 * central de notificações, e aqui ela aperta mais: o resultado de uma
 * importação é PERSISTIDO, e alguém o reabre semanas depois — talvez com o app
 * noutro idioma.
 */

/**
 * O nome do serviço, nunca o slug — slug é chave, e chave não se traduz nem se
 * capitaliza (design system, seção 8, sexta leva).
 */
const SOURCE_NAMES: Record<ImportSourceSlug, string> = {
  anilist: 'AniList',
  mal: 'MyAnimeList',
  csv: 'Watchpile',
}

export function sourceName(slug: ImportSourceSlug): string {
  return SOURCE_NAMES[slug] ?? slug
}

/**
 * **A frase que explica o "sem par" é da FONTE que rodou, nunca da tela.**
 *
 * Uma constante apareceria embaixo do resultado errado: o AniList manda entrada
 * sem `idMal`, o MyAnimeList sem id do AniList, e um CSV manda linha sem
 * `source` nenhum — não há segundo serviço na história. É a régua da atribuição
 * (design system, seção 8, sétima leva) num campo que ninguém pensaria em
 * parametrizar, porque parece explicação genérica e não crédito.
 */
const UNMATCHED_BODY: Record<ImportSourceSlug, string> = {
  anilist:
    'These are in your library. AniList sent no MyAnimeList ID for them, so they carry one source instead of two — you can link the other from each title.',
  mal: 'These are in your library. MyAnimeList gave no AniList ID for them, so they carry one source instead of two — you can link the other from each title.',
  csv: "These are in your library. Their rows carried no source ID, so they aren't linked to a provider yet — you can link one from each title.",
}

/**
 * O texto de um problema de linha.
 *
 * Não é `Record` fechado por `ImportProblemKind` de propósito **no fallback**:
 * um servidor mais novo pode mandar um `kind` que este binário não conhece, e
 * uma linha vazia seria pior que uma frase que ao menos aponta a linha. Mas o
 * `Record` é tipado, então `kind` novo no contrato vira erro de compilação
 * aqui — que é o mecanismo funcionando.
 */
export function problemText(problem: ImportProblem): string {
  const value = String(problem.params?.value ?? '')
  const field = String(problem.params?.field ?? '')

  const BODIES: Record<ImportProblem['kind'], string> = {
    'unknown-media-type': `media_type “${value}” isn't a type on this installation.`,
    'unknown-source': `source “${value}” isn't a provider on this installation.`,
    'missing-identity': 'no title and no media type — nothing to record.',
    'invalid-status': `status “${value}” isn't one of Planning, In progress, Paused, Completed or Dropped.`,
    'invalid-number': `${field} “${value}” isn't a number.`,
  }

  const body = BODIES[problem.kind] ?? 'could not be read.'
  return problem.row === undefined ? body : `Row ${problem.row}: ${body}`
}

export const importCopy = {
  title: 'Import',
  body: 'Bring a library in from another tracker. It runs in the background, and Watchpile notifies you when it finishes.',

  /**
   * A regra que governa a operação inteira fica UMA vez, acima do que ela
   * governa (design system, seção 5) — três cópias dela seriam a simetria de
   * layout que a seção já recusou em item de menu.
   */
  mode: {
    label: 'If a title is already in your library',
    skip: 'Skip',
    overwrite: 'Overwrite',
    /**
     * A dica troca com a escolha e diz o que a escrita REALMENTE toca. Promessa
     * de escrita destrutiva se lê ANTES do clique — o app não tem toast nem
     * desfazer, e o `overwrite` do Yamtrack, que apaga e recria, levaria junto
     * tudo o que o import não traz.
     */
    hint: {
      skip: 'Nothing you already track changes.',
      overwrite:
        'Status and progress are replaced. Piles, notes, ratings and history stay.',
    },
  },

  /**
   * Uma caixa por fonte, e **quem diz quais existem é o servidor** — ele sabe se
   * tem a chave do MyAnimeList, e a recusa se anuncia antes do clique (design
   * system, seção 5).
   */
  sources: {
    csv: {
      name: 'Watchpile',
      line: 'A CSV exported from Watchpile',
    },
    mal: {
      name: 'MyAnimeList',
      line: 'Anime and manga, from a public profile',
    },
    anilist: {
      name: 'AniList',
      line: 'Anime and manga, from a public profile',
    },
  },

  csv: {
    choose: 'Choose file',
    noFile: 'No file chosen',
    start: 'Import',
    /** As colunas obrigatórias, ditas antes do erro em vez de depois dele. */
    columns:
      'The file needs a header with media_type, title and status. Other columns are optional.',
  },

  profile: {
    /** O rótulo nomeia o SERVIÇO, porque é o nome dele que a pessoa digitou lá. */
    placeholder: (name: string) => `Your ${name} username`,
    hint: 'Your profile has to be public.',
    start: 'Import',
  },

  /**
   * Por que uma fonte não pode rodar. **Frase montada aqui, `kind` no
   * contrato** — e a saída oferecida faz parte dela: mandar o admin pra
   * Providers quando não há nada a configurar seria a saída errada, que custa
   * mais que nenhuma (design system, seção 5).
   */
  unavailable: {
    'not-configured': {
      body: 'This server has no key for it yet.',
      action: { label: 'Open providers', to: '/settings/providers' as const },
    },
    unverified: {
      /**
       * A fonte existe no servidor e nunca foi medida contra a API real —
       * o AniList desativou a própria em 07/09/2026. Dizer isso é mais honesto
       * que escondê-la: quem procura AniList concluiria que o Watchpile não
       * importa de lá.
       */
      body: 'Not available yet — the service turned its API off, so this was never verified.',
      action: null,
    },
  },

  running: {
    title: (source: string) => `Importing from ${source}`,
    /**
     * **O contador é NÚMERO, nunca barra** (design system, seção 2). O
     * denominador some enquanto for nulo — a fonte ainda não respondeu, e um
     * zero ali mentiria.
     */
    counter: (done: number, total: number) =>
      `${formatNumber(done)} / ${formatNumber(total)}`,
    /**
     * O trecho em que **não existe denominador**: a fonte ainda está sendo
     * lida, e nem ela sabe quantas obras vai devolver. Uma barra aqui
     * desenharia uma fração que ninguém conhece, e um `0 / 0` afirmaria um
     * total que não existe — a frase diz o que está acontecendo, e o pulso ao
     * lado dela diz que continua acontecendo.
     */
    reading: 'Reading your list…',
    /**
     * A frase diz que dá pra sair. Sem ela a pessoa fica olhando a tela achando
     * que precisa — e é justamente pra ela não precisar que o job roda em
     * segundo plano e avisa pelo sino.
     */
    body: 'This runs in the background. You can leave this page — Watchpile notifies you when it finishes.',
    stop: 'Stop',
    stopping: 'Stopping…',
    /**
     * Quem não é dono do job vê que o recurso está ocupado, **sem** o nome de
     * quem o ocupa: o fato que impede é a ocupação. O limite é do servidor —
     * o banco é um arquivo só —, não da pessoa.
     */
    someoneElse:
      'An import is running on this server. You can start yours when it finishes.',
  },

  /**
   * A SEGUNDA fase — 13/09/2026.
   *
   * ── Por que ela tem copy própria, e não uma variação da de cima ────────────
   * Ela descreve outro trabalho: importar TERMINOU, e o que roda agora é buscar
   * a arte e a ficha de cada obra que entrou. Reusar `running.title` diria
   * "Importing from…" sobre algo que já acabou — e a régua do projeto é que *a
   * copy descreve o que a tela faz hoje*.
   *
   * ── A palavra escolhida, e a que foi recusada ──────────────────────────────
   * `Fetching artwork` e não "enriquecendo" nem "aquecendo cache": os dois
   * últimos são o nosso vocabulário interno, e quem lê quer saber o que vai
   * mudar na tela dele. O que muda é a capa das obras aparecerem.
   *
   * **E ela diz que dá pra ir embora**, pelo mesmo motivo da fase anterior —
   * aqui com mais força, porque este trabalho leva de dezoito minutos a quase
   * uma hora numa biblioteca grande.
   */
  /**
   * A peça de trabalho — um trabalho, dois passos (14/09/2026).
   *
   * ── Por que o título fala da BIBLIOTECA, e não do import ──────────────────
   * `Importing from MyAnimeList` descreve só o primeiro passo, e a peça vive
   * pelos dois — ela continua na tela depois de o import ter terminado. *Trazer
   * sua biblioteca* cobre o trabalho inteiro sem mentir em nenhum dos momentos.
   *
   * ── As duas saídas do estado parado ───────────────────────────────────────
   * `Continue` é a ação, e é **a mesma** de `Fill in missing` lá embaixo:
   * aquecer pula o que já está guardado, então retomar é rodar de novo.
   * `Dismiss` tira o aviso e **não apaga** — a linha fica no histórico, como
   * lido e dispensado em `notifications`.
   */
  work: {
    title: (source: string) => `Bringing in your ${source} library`,
    reading: 'Reading your list',
    artwork: 'Fetching artwork',
    /** O passo que fechou. Curto: o visto ao lado já diz o que é. */
    done: 'Done',
    /** O passo que ainda não começou. Não promete tempo — só ordem. */
    next: 'Next',
    stoppedAt: (done: number, total: number) =>
      `Stopped at ${formatNumber(done)} / ${formatNumber(total)}`,
    /**
     * A frase do estado parado. Ela diz **o que sobreviveu** antes do que
     * falta: as obras estão todas lá, e o que ficou para trás é a arte — que é
     * a diferença entre "perdi meu import" e "falta terminar uma parte".
     */
    stoppedBody:
      'Watchpile closed before this finished. Your titles are all there — only their artwork is missing.',
    body: 'This runs in the background — you can leave this page.',
    continue: 'Continue',
    continuing: 'Continuing…',
    dismiss: 'Dismiss',
  },

  enriching: {
    title: 'Fetching artwork',
    /** Mesmo formato do contador da primeira fase: número, nunca barra. */
    counter: (done: number, total: number) =>
      `${formatNumber(done)} / ${formatNumber(total)}`,
    /**
     * O intervalo em que o total ainda não foi escrito. Dura um instante — o
     * laço conta os alvos antes da primeira obra —, mas o estado existe, e sem
     * esta frase ele renderizaria um `0 / 0` que afirma um total inexistente.
     */
    starting: 'Starting…',
    body: 'Your titles are already in your library. This fills in their artwork, and you can leave this page.',
  },

  /**
   * A varredura da biblioteca — 13/09/2026, item 11(c) da fila do dono.
   *
   * ── Por que ela mora em `Import`, e o que isso custa ──────────────────────
   * Decisão do dono: é a seção mais próxima em FUNÇÃO — as duas falam com
   * provedores, rodam em segundo plano e mostram contador —, e a varredura
   * reusa a peça de progresso que já vive aqui. O custo assumido é o título da
   * seção ficar mais estreito que o conteúdo dela, que é a mesma dívida de nome
   * que `import_jobs` carrega no servidor.
   *
   * ── O verbo diz o que muda, e o que NÃO muda ──────────────────────────────
   * Quem lê precisa saber que isto não apaga nem re-importa nada: o progresso,
   * o status, as pilhas e as notas ficam inteiros. O que é relido é o que o
   * PROVEDOR diz — e o único campo da obra que pode mudar é o total, **só para
   * cima**, que é o caso do mangá em publicação.
   */
  /**
   * Preencher o que falta — 14/09/2026, pedido do dono.
   *
   * ── Ela fica ao LADO do refresh de propósito ──────────────────────────────
   * A diferença entre as duas é o que a tela tem de ensinar: uma pula o que já
   * existe e custa só o buraco, a outra relê tudo e custa a biblioteca inteira.
   * Separá-las em lugares distintos faria alguém escolher a cara achando que
   * escolhia a barata.
   *
   * ── A contagem vai no BOTÃO ───────────────────────────────────────────────
   * *Contagem que mede o ESTRAGO entra na frase; contagem que mede um RECURSO
   * fica ao lado* (07/09) — e aqui ela mede **o trabalho**, que é o que o botão
   * vai fazer. Em zero o botão desabilita com o motivo, porque a recusa se
   * anuncia antes do clique e o app não tem toast.
   */
  fill: {
    title: 'Fill in missing artwork',
    body: "Fetches artwork and details for titles that don't have them yet. It skips everything already stored, so it costs only what is missing.",
    note: 'Also how you pick up a run that stopped halfway — it finds what is left.',
    start: (n: number) =>
      `Fill in ${formatNumber(n)} ${n === 1 ? 'title' : 'titles'}`,
    starting: 'Starting…',
    /** O estado em que não há o que fazer — e ele é bom, não um erro. */
    none: 'Nothing missing',
    noneWhy: 'Every title with a provider link already has its artwork.',
  },

  /**
   * Limpar o histórico — 14/09/2026, pedido do dono.
   *
   * O verbo diz o que sai: o RELATO dos trabalhos. O que entrou na biblioteca
   * fica, e a frase precisa dizer isso, porque "limpar histórico de import" lê
   * perto demais de "desfazer o import".
   */
  history: {
    clear: 'Clear history',
    clearing: 'Clearing…',
    kept: 'Your titles stay — this only clears the record of past runs.',
  },

  refresh: {
    title: 'Refresh title data',
    line: 'Ask the providers again',
    body: 'Rereads what the providers say about the titles in your library — artwork, synopsis and chapter or episode counts. Your progress, status and piles are untouched.',
    /**
     * A frase que explica o único campo que MUDA na obra, e a direção. Ela está
     * aqui e não escondida numa dica porque é a única escrita que atravessa a
     * fronteira entre o provedor e a biblioteca de alguém.
     */
    totalNote:
      'A title whose count grew — a manga still publishing, say — gets the new number. It never shrinks.',
    start: 'Refresh library',
    starting: 'Starting…',
    running: 'Refreshing your library',
    counter: (done: number, total: number) =>
      `${formatNumber(done)} / ${formatNumber(total)}`,
    stop: 'Stop',
    stopping: 'Stopping…',
    /**
     * O resultado, e ele conta OBRAS — não requisições. O número que a tela
     * mostra tem que poder ser conferido contra a biblioteca (design system,
     * seção 8): "quantas mudaram" é o que a pessoa consegue olhar e verificar.
     */
    done: (updated: number) =>
      updated === 0
        ? 'Nothing changed — your titles were already up to date.'
        : `${formatNumber(updated)} ${updated === 1 ? 'title' : 'titles'} got a new count.`,
    /**
     * A recusa, anunciada antes do clique: obra sem vínculo não tem provedor de
     * onde reler, e uma biblioteca inteira sem vínculo não tem o que varrer.
     */
    empty: 'None of your titles are linked to a provider yet.',
  },

  result: {
    title: 'Last import',
    added: 'Added',
    skipped: 'Already in your library',
    skippedBody: 'Skipped, because that was the rule you chose.',
    updated: 'Updated',
    updatedBody:
      'Status and progress replaced, because that was the rule you chose.',
    unmatched: 'Came in without a match',
    unmatchedBody: (source: ImportSourceSlug) => UNMATCHED_BODY[source],
    /**
     * Plural por `Intl.PluralRules`, com o helper que já existe — não um
     * ternário com "s" colado. Ele erra em qualquer idioma com mais de duas
     * formas, e o app é multi-idioma desde o início (brief, 3.8).
     */
    problems: (count: number) =>
      `${countOf(count, { one: 'row', other: 'rows' })} couldn't be read`,
    /** Quando a lista tem teto e a contagem não. */
    truncated: (shown: number, total: number) =>
      `Showing the first ${formatNumber(shown)} of ${formatNumber(total)}.`,
    when: (source: string, at: string) => `${source} · ${at}`,
  },

  failed: {
    title: (source: string) => `Import from ${source} didn't run`,
    /**
     * **Por que não rodou, e ela mora AQUI** — o import é quem produz o motivo,
     * e a explicação é de quem produziu o resultado (design system, seção 7).
     *
     * O sino a consome deste mesmo lugar. Ela vivia só lá, e a tela do import
     * dizia apenas "didn't run": quem acabou de clicar estava olhando esta tela,
     * e o motivo ficava a um painel de distância, num sino que a pessoa pode
     * nem ter aberto. **Duas contas da mesma coisa é como uma fica pra trás** —
     * então é uma função só, e o sino importa daqui.
     *
     * Cada frase diz o que aconteceu **e** o que fazer, porque a saída faz parte
     * da recusa. As duas neutras — `source-down` e `interrupted` — dizem
     * explicitamente que não há o que consertar: o barulho do sinal acompanha o
     * tamanho do fato.
     */
    why: (reason: string): string =>
      ({
        'user-not-found':
          'No profile by that name. Check the spelling and try again.',
        'private-profile':
          'That profile is private, so Watchpile cannot read it.',
        'source-refused':
          'The service turned the request down. Check what you entered.',
        'source-down':
          "The service didn't answer. Nothing to fix here — try again later.",
        'invalid-file':
          "That file isn't a Watchpile CSV. Check the columns and try again.",
        interrupted:
          'The server restarted while it was running. Start it again.',
        unexpected: 'Something went wrong on our side. Start it again.',
      })[reason] ?? 'It stopped before finishing. Start it again.',
  },

  /**
   * O vazio desta tela é o normal dela menos o bloco de resultado: a fonte está
   * sempre ali, e o que pode não existir é o rastro. Sem copy própria, então —
   * o bloco simplesmente não aparece.
   */
  error: {
    title: "Can't reach the server",
    body: 'The request failed. Check that Watchpile is running, then try again.',
    retry: 'Try again',
  },
}
