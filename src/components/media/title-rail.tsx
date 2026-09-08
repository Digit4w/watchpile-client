import type { ReactNode } from 'react'
import { titleDetailCopy } from '@/routes/-title-detail.copy'

/**
 * Uma caixa da COLUNA ESQUERDA.
 *
 * ── Por que a coluna existe ─────────────────────────────────────────────────
 * A primeira versão desta tela punha o pôster à esquerda e empilhava o
 * formulário à direita: a coluna esquerda morria depois de 300px e a direita
 * seguia por mais 800. A página lia como **duas metades sem relação** — foi o
 * que o dono viu, e a palavra dele foi "desalinhado".
 *
 * A esquerda passou a ser uma coluna contínua de caixas pequenas, e a direita
 * ficou só com conteúdo. É o que faz a página ser uma coisa só.
 *
 * `ring` e não `border`, como toda caixa que segura conteúdo (design system,
 * seção 4).
 */
export function RailBox({
  label,
  extra,
  children,
}: {
  label: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-md ring-1 ring-line">
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1">
        <span className="text-[0.6875rem] text-faint uppercase tracking-wide">
          {label}
        </span>
        {extra}
      </div>
      {children}
    </div>
  )
}

/**
 * Uma linha de rótulo e valor. É tabela sem ser `<table>`, e em 200px ela
 * ainda lê porque o valor alinha à direita e trunca.
 */
export function RailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-3 py-1">
      <span className="shrink-0 text-faint text-xs">{label}</span>
      <span className="truncate text-ink text-xs tabular-nums">{value}</span>
    </div>
  )
}

/**
 * Os detalhes que vêm do provedor — pequeno, mas com informação.
 *
 * Nada disto `entries` guarda: é contexto que chega com o detalhe e envelhece
 * com ele. Linha sem valor **não entra**, em vez de aparecer vazia.
 */
export function DetailsBox({
  rows,
}: {
  rows: { label: string; value: string | number | null }[]
}) {
  const filled = rows.filter(
    ({ value }) => value !== null && value !== '' && value !== 0,
  )

  if (filled.length === 0) {
    return null
  }

  return (
    <RailBox label={titleDetailCopy.rail.details}>
      <div className="flex flex-col pb-2">
        {filled.map(({ label, value }) => (
          <RailRow key={label} label={label} value={String(value)} />
        ))}
      </div>
    </RailBox>
  )
}

/**
 * Links para fora — IMDb, Wikidata, a página do próprio provedor.
 *
 * **Vêm montados do servidor** (brief, 3.10): o molde é da definição, como o
 * da arte. E só os que o provedor devolveu chegam aqui, então a caixa some
 * inteira quando não há nenhum, em vez de mostrar um cabeçalho vazio.
 *
 * `rel="noreferrer"`: o destino não precisa saber de qual página se saiu.
 */
export function LinksBox({
  links,
}: {
  links: { label: string; url: string }[]
}) {
  if (links.length === 0) {
    return null
  }

  return (
    <RailBox label={titleDetailCopy.rail.links}>
      <div className="flex flex-col items-end pb-2">
        {links.map(({ label, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 text-ink text-xs outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ink/50"
          >
            {label}
          </a>
        ))}
      </div>
    </RailBox>
  )
}

/**
 * O que o log sabe — quando começou, a última vez, quantas escritas.
 *
 * **Só progresso**, e o rótulo diz "activity" e não "history" porque é isso
 * que ele é: mudança de status, nota e notas não é registrada em lugar nenhum
 * (brief, 3.11 — o log é de progresso). Caixa que promete histórico e mostra
 * metade é pior que uma que diz o que mostra.
 *
 * Some quando nunca houve evento: obra recém-adicionada não tem o que contar.
 */
export function ActivityBox({
  startedAt,
  lastAt,
  events,
  format,
}: {
  startedAt: string | null
  lastAt: string | null
  events: number
  /** A formatação de data é do chamador — ela vai virar preferência. */
  format: (iso: string) => string
}) {
  if (events === 0 || !startedAt || !lastAt) {
    return null
  }

  return (
    <RailBox label={titleDetailCopy.rail.activity}>
      <div className="flex flex-col pb-2">
        <RailRow
          label={titleDetailCopy.rail.started}
          value={format(startedAt)}
        />
        {lastAt !== startedAt && (
          <RailRow
            label={titleDetailCopy.rail.lastActivity}
            value={format(lastAt)}
          />
        )}
      </div>
    </RailBox>
  )
}
