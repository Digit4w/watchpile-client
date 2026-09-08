/**
 * A regra do formulário de tipo de mídia — o primeiro do app com campo
 * traduzível (design system, seção 5, 31/08/2026).
 *
 * Pura de propósito: é a regra que decide se salvar é possível, e regra dessas
 * dentro de um componente só se testa montando o componente — que este repo não
 * sabe fazer (`vitest.config.ts` roda em `node`, e jsdom é decisão pendente).
 */

/** Um idioma preenchido na folha. Strings cruas, direto dos inputs. */
export type NameDraft = {
  name: string
  plural: string
  progressUnit: string
}

export type NameDraftMap = Record<string, NameDraft>

/**
 * Os idiomas que o PRODUTO fala (brief, 3.8): inglês como língua-base porque o
 * público de homelab é internacional, português junto desde o começo e não como
 * tradução retroativa.
 *
 * **Não é a lista de idiomas possíveis, é a que a folha OFERECE.** A biblioteca
 * de i18n e o formato do catálogo seguem em aberto de propósito
 * (client/CLAUDE.md); quando o catálogo existir, esta constante passa a sair
 * dele em vez de existir aqui.
 */
export const PRODUCT_LOCALES = ['en', 'pt-BR'] as const

/**
 * Os chips do alternador: os idiomas do produto **mais** qualquer outro que o
 * tipo já carregue.
 *
 * A segunda metade não é hipótese. O `PATCH` substitui o mapa INTEIRO — é o que
 * torna apagar uma tradução possível —, então uma folha que só conhecesse `en`
 * e `pt-BR` apagaria em silêncio um `es` que outra ferramenta tivesse escrito.
 * Mostrar o chip é o que faz o idioma desconhecido sobreviver a um salvamento.
 */
export function localesOf(names: NameDraftMap): string[] {
  const extras = Object.keys(names)
    .filter((locale) => !PRODUCT_LOCALES.includes(locale as 'en'))
    .sort()
  return [...PRODUCT_LOCALES, ...extras]
}

export type LocaleState = 'complete' | 'partial' | 'empty'

/**
 * Em que pé está um idioma.
 *
 * `progressUnit` **não** entra na conta: nulo é legítimo e por dois motivos
 * diferentes — filme não conta nada, jogo conta sem ter unidade natural (brief,
 * 3.12). Exigi-lo transformaria uma ausência com significado em campo faltando.
 */
export function localeState(draft: NameDraft | undefined): LocaleState {
  const name = draft?.name.trim() ?? ''
  const plural = draft?.plural.trim() ?? ''

  if (name !== '' && plural !== '') {
    return 'complete'
  }
  return name === '' && plural === '' ? 'empty' : 'partial'
}

/**
 * O ponto de `--color-warning` do alternador marca o idioma que **falta**, e
 * `empty` é o que falta — não `partial`, que é o idioma em que alguém está
 * digitando agora.
 *
 * **Idioma incompleto se marca, não se proíbe** (design system, seção 5): quem
 * lê num idioma sem tradução cai na cadeia de três degraus do brief 3.12 e
 * nunca num buraco, então exigir todos obrigaria um admin brasileiro a inventar
 * o nome em inglês de um tipo que só ele usa.
 */
export function isMissing(draft: NameDraft | undefined): boolean {
  return localeState(draft) === 'empty'
}

export type FormVerdict =
  | { savable: true }
  | { savable: false; reason: 'no-language' }
  | { savable: false; reason: 'half-filled'; locale: string }

/**
 * Se dá pra salvar, e quando não dá, por quê.
 *
 * Duas condições, e as duas viram frase na tela em vez de um botão apagado sem
 * explicação — **a recusa se anuncia antes do clique** (design system, seção 5).
 * O app não tem toast, então aceitar o clique e falhar não teria onde dizer o
 * motivo.
 *
 * 1. **Pelo menos um idioma completo.** É o que o servidor exige, e o que faz o
 *    terceiro degrau da queda de idioma nunca devolver string vazia
 * 2. **Nenhum idioma pela metade.** Um `name` sem `plural` o servidor recusaria
 *    com 400; mais que isso, mandar meio idioma preenchido significaria jogar
 *    fora o que a pessoa escreveu
 */
export function verdictFor(names: NameDraftMap): FormVerdict {
  const locales = localesOf(names)

  const half = locales.find(
    (locale) => localeState(names[locale]) === 'partial',
  )
  if (half) {
    return { savable: false, reason: 'half-filled', locale: half }
  }

  const complete = locales.some(
    (locale) => localeState(names[locale]) === 'complete',
  )
  return complete
    ? { savable: true }
    : { savable: false, reason: 'no-language' }
}

/**
 * O mapa que vai pro servidor: só os idiomas completos, aparados, com a unidade
 * vazia virando `null`.
 *
 * Idioma vazio **sai do mapa**, e é assim que se apaga uma tradução — o `PATCH`
 * substitui o mapa inteiro justamente pra isso. Chamar isto com um mapa que
 * `verdictFor` reprovou é o que a folha não faz.
 */
export function toNameMap(names: NameDraftMap) {
  const output: Record<
    string,
    { name: string; plural: string; progressUnit: string | null }
  > = {}

  for (const locale of localesOf(names)) {
    const draft = names[locale]
    if (localeState(draft) !== 'complete' || !draft) {
      continue
    }
    output[locale] = {
      name: draft.name.trim(),
      plural: draft.plural.trim(),
      progressUnit: draft.progressUnit.trim() || null,
    }
  }

  return output
}
