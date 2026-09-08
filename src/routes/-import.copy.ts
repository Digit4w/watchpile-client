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
