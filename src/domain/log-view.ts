import type { components } from '@/infra/lib/api-types'

/**
 * O que a seção `THIS INSTANCE / Logs` decide sobre uma linha de log — 14/09/2026.
 *
 * Regra pura, e por isso aqui: a tela só desenha o que estas funções devolvem.
 * O desenho está no design system (seção 5) e no mockup de recorte de 14/09.
 */

export type LogLine = components['schemas']['LogLine']
export type LogLevelFilter = 'all' | 'warn' | 'error'

/**
 * O rótulo do nível é VOCABULÁRIO DO LOG, e não copy: `ERROR` e `WARN` são o
 * que o arquivo baixado diz e o que quem recebe o log procura. Traduzi-los
 * faria a tela e o arquivo discordarem.
 */
export function levelLabel(level: number): string {
  if (level >= 60) {
    return 'FATAL'
  }
  if (level >= 50) {
    return 'ERROR'
  }
  if (level >= 40) {
    return 'WARN'
  }
  if (level >= 30) {
    return 'INFO'
  }
  if (level >= 20) {
    return 'DEBUG'
  }
  return 'TRACE'
}

/**
 * **Só dois níveis ganham cor**, e só no rótulo: o nível é PEÇA e não cor da
 * linha (design system, seção 5). `INFO` e `DEBUG` ficam quietos — desbotar a
 * mensagem deles usaria o vocabulário de inerte.
 */
export type LevelTone = 'danger' | 'warning' | 'quiet'

export function levelTone(level: number): LevelTone {
  if (level >= 50) {
    return 'danger'
  }
  if (level >= 40) {
    return 'warning'
  }
  return 'quiet'
}

function valueText(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null) {
    return 'null'
  }
  return JSON.stringify(value)
}

/**
 * Os campos da linha como `chave=valor`, achatando objeto por ponto.
 *
 * O log de requisição chega como `{ req: { method, path }, res: { status } }`, e
 * `req.method=GET req.path=/api/auth/me res.status=401` se lê numa linha. Array
 * não se achata — vira JSON, porque índice numérico como chave (`ids.0=`) é
 * ruído.
 */
export function flattenFields(
  fields: Record<string, unknown>,
  prefix = '',
): string[] {
  const out: string[] = []
  for (const [key, value] of Object.entries(fields)) {
    const name = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flattenFields(value as Record<string, unknown>, name))
    } else {
      out.push(`${name}=${valueText(value)}`)
    }
  }
  return out
}

/** O início do dia LOCAL de um instante — é o fuso de quem lê que separa os dias. */
export function startOfDay(time: number): number {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export type LogItem =
  | { kind: 'day'; day: number }
  | { kind: 'line'; line: LogLine }

/**
 * A lista com os separadores de DIA no meio.
 *
 * A hora aparece como `HH:MM:SS`, sem data, e sem o separador duas linhas das
 * 23:59 e das 00:01 parecem fora de ordem. A primeira linha sempre abre um dia:
 * é ela que diz de quando é o que está no topo.
 */
export function withDaySeparators(lines: readonly LogLine[]): LogItem[] {
  const items: LogItem[] = []
  let current: number | null = null
  for (const line of lines) {
    const day = startOfDay(line.time)
    if (day !== current) {
      items.push({ kind: 'day', day })
      current = day
    }
    items.push({ kind: 'line', line })
  }
  return items
}

/**
 * O que o `Copy` leva: as linhas NA TELA, em texto legível (decisão do dono).
 *
 * Mesma ordem e mesma forma do que se vê — hora local, nível, mensagem, campos
 * —, com a stack indentada abaixo **sempre**, aberta na tela ou não: quem cola o
 * trecho numa issue precisa dela, e ela não ocupa espaço na área de
 * transferência de ninguém.
 *
 * A hora vem por parâmetro porque formatar é de `lib/format.ts`, que conhece o
 * idioma; esta regra só decide ONDE ela entra.
 */
export function copyText(
  lines: readonly LogLine[],
  formatTime: (time: number) => string,
): string {
  return lines
    .map((line) => {
      const head = [
        formatTime(line.time),
        levelLabel(line.level),
        line.msg,
        ...flattenFields(line.fields),
      ]
        .filter(Boolean)
        .join(' ')
      const stack = line.err?.stack ?? line.err?.message
      return stack
        ? `${head}\n${stack
            .split('\n')
            .map((row) => `    ${row.trimStart()}`)
            .join('\n')}`
        : head
    })
    .join('\n')
}

/** Se a rolagem está colada no fim — o que decide se a caixa acompanha o log. */
export function isAtEnd(
  box: { scrollTop: number; scrollHeight: number; clientHeight: number },
  slack = 8,
): boolean {
  return box.scrollHeight - box.scrollTop - box.clientHeight <= slack
}
