/**
 * Formatação via `Intl`, nunca por concatenação (client/CLAUDE.md).
 *
 * O idioma ainda não tem dono — a biblioteca de i18n está em aberto de
 * propósito (brief, 3.8) —, então por ora a régua é `en`. Quando o catálogo
 * existir, o que muda é a origem desta constante, não quem chama.
 */
const LOCALE = 'en'

const number = new Intl.NumberFormat(LOCALE)
const pluralRules = new Intl.PluralRules(LOCALE)

/**
 * "1 title" / "248 titles" — e em pt-BR a regra de plural é outra, o que é
 * exatamente o motivo de a escolha não ser um `if (n === 1)`.
 *
 * `formas` traz só as categorias que o idioma usa; `other` é a única que todo
 * idioma tem, então ela é o fallback.
 */
export function countOf(
  amount: number,
  forms: { one?: string; other: string },
): string {
  const category = pluralRules.select(amount) as keyof typeof forms
  return `${number.format(amount)} ${forms[category] ?? forms.other}`
}

export function formatNumber(value: number): string {
  return number.format(value)
}

/**
 * A data curta da coluna "Added" — "12 Aug 2026".
 *
 * `Intl` e não `toLocaleDateString` solto: a ordem dos campos é regra de
 * idioma (em pt-BR é "12 de ago. de 2026"), e o banco guarda tudo em UTC
 * (CLAUDE.md) — formatar é responsabilidade da UI, e é aqui.
 */
const shortDate = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  return shortDate.format(new Date(iso))
}

/**
 * "2 days ago" — a coluna "Updated" das listas de `/piles`.
 *
 * `Intl.RelativeTimeFormat` e não uma escada de `if`: "há 2 dias" tem outra
 * ordem de palavras, e "1 day"/"2 days" já é regra de plural. A unidade é
 * escolhida pela maior que ainda dê um número inteiro ≥ 1, que é como se lê
 * uma data em linguagem natural — sete dias viram "1 week", não "7 days".
 *
 * `numeric: 'auto'` é o que rende "yesterday" em vez de "1 day ago".
 */
const relativeTime = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const elapsed = new Date(iso).getTime() - now

  for (const [unit, ms] of UNITS) {
    const amount = Math.trunc(elapsed / ms)
    if (amount !== 0) {
      return relativeTime.format(amount, unit)
    }
  }

  // Menos de um minuto. `0` com `numeric: 'auto'` vira "now", que é o que a
  // linha deve dizer de uma pilha mexida no segundo anterior.
  return relativeTime.format(0, 'second')
}

/**
 * "2.4 MB" — o tamanho de um cache, em `THIS INSTANCE / Storage`.
 *
 * `Intl` com `style: 'unit'` e não concatenação, pela régua do arquivo: o
 * separador decimal muda de idioma ("2,4 MB" em pt-BR) e o espaço antes da
 * unidade não é universal.
 *
 * **A base é 1024, e o rótulo diz "MB".** Tecnicamente isso é MiB — e a
 * inconsistência é deliberada: `WATCHPILE_ART_CACHE_MB` converte por 1024 no
 * servidor, então um teto de `512` precisa ler "512 MB" nesta tela. Um número
 * que não bate com o que o admin escreveu no `compose.yaml` seria pior que o
 * nome do prefixo.
 */
const BYTE_UNITS: [Intl.NumberFormatOptions['unit'], number][] = [
  ['gigabyte', 1024 ** 3],
  ['megabyte', 1024 ** 2],
  ['kilobyte', 1024],
]

export function formatBytes(bytes: number): string {
  for (const [unit, size] of BYTE_UNITS) {
    if (bytes >= size) {
      return new Intl.NumberFormat(LOCALE, {
        style: 'unit',
        unit,
        unitDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(bytes / size)
    }
  }

  // Abaixo de um kilobyte o número em bytes é mais honesto que "0.1 kB", e um
  // cache vazio precisa ler "0 byte" e não uma fração de nada.
  return new Intl.NumberFormat(LOCALE, {
    style: 'unit',
    unit: 'byte',
    unitDisplay: 'short',
  }).format(bytes)
}

/**
 * Minutos como a pessoa lê — `47m`, `2h30`, `2h`.
 *
 * ── Por que o dado é minuto e a leitura é hora ──────────────────────────────
 * `entries.time_spent` é inteiro em minutos (brief, 3.12, 10/09/2026), e a
 * divisão é da TELA. Guardar decimal seria a primeira fração do schema, e ela
 * viria só por causa da unidade escolhida na exibição — 3,5 horas e 210 minutos
 * são o mesmo fato.
 *
 * ── Por que não é `Intl` ────────────────────────────────────────────────────
 * `Intl.NumberFormat` com `unit: 'hour'` diria "2,5 h", que é o número certo na
 * forma errada: ninguém escreve o tempo jogado assim. `Intl.DurationFormat`
 * resolveria e **ainda não está no Node do Electron**. Então isto é uma junção
 * de dois números, e é por isso que os SUFIXOS ficam parametrizados: no dia em
 * que houver catálogo, quem chama passa os dele.
 *
 * ── `2h` e não `2h00` ───────────────────────────────────────────────────────
 * Zero minuto não é informação: o `00` só existe pra encher a casa, e a régua
 * do app é a mesma do `12 / ?` — o que não se sabe ou não existe não ganha
 * dígito de enfeite.
 */
export function formatMinutes(
  minutes: number,
  suffix: { hour: string; minute: string } = { hour: 'h', minute: 'm' },
): string {
  const safe = Math.max(0, Math.trunc(minutes))
  const hours = Math.floor(safe / 60)
  const rest = safe % 60

  if (hours === 0) {
    return `${safe}${suffix.minute}`
  }
  if (rest === 0) {
    return `${hours}${suffix.hour}`
  }
  /**
   * Os minutos vão com dois dígitos **dentro** de uma hora — `2h05`, nunca
   * `2h5`: ali eles são a fração, e fração sem casa fixa se lê como outro
   * número. Sozinhos (`5m`) não vão, porque ali são o valor inteiro.
   */
  return `${hours}${suffix.hour}${String(rest).padStart(2, '0')}`
}
