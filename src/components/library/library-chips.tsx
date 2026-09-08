import { useLayoutEffect, useRef, useState } from 'react'
import { MediaTypeIcon } from '@/components/media/media-type-icon'
import { fittingChips } from '@/domain/chip-fit'
import type { EntryStatus, MediaType } from '@/domain/media'
import { useOfferedMediaTypes } from '@/hooks/queries/media-types/use-offered-media-types'
import { useCompactViewport } from '@/hooks/use-compact-viewport'
import { appCopy } from '@/lib/copy'
import { libraryCopy } from '@/routes/-library.copy'

/**
 * `relative` não é decoração (design system, seção 8, sétima leva — 01/09/2026).
 *
 * O `sr-only` do Tailwind é `position: absolute`. Sem um ancestral posicionado
 * DENTRO da fileira que rola, o containing block dele vira o `<header>` sticky
 * de `library-header.tsx` — que está FORA do `overflow-x-auto` —, o recorte
 * deixa de valer e o rótulo invisível empurra a página inteira na horizontal.
 * O chip com `Xis` é o único que carrega um `sr-only` hoje, mas a classe é
 * compartilhada e o próximo que ganhar um não vai lembrar disto.
 */
const ON =
  'relative flex h-11 shrink-0 items-center gap-1.5 rounded-sm border border-ink bg-ink px-3 text-sm text-surface md:h-9'
const OFF =
  'relative flex h-11 shrink-0 items-center gap-1.5 rounded-sm border border-line px-3 text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink md:h-9'

/** O `gap-2` da fileira, em pixel. A conta precisa do número, não da classe. */
const GAP = 8

function Close() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
    </svg>
  )
}

/**
 * A fileira de recorte. Os chips são o TIPO DE MÍDIA — o que não contradiz
 * "sem navegação por tipo de mídia" (brief, 6): o brief recusa tipo como
 * DESTINO na nav e diz, na mesma frase, que tipo é filtro. Chip é filtro.
 *
 * Escolha ÚNICA, não múltipla: `GET /api/entries` aceita um `mediaType`, e um
 * chip que aceitasse dois prometeria um recorte que o servidor não faz.
 *
 * O status entra aqui pela esquerda quando está ligado, como chip removível,
 * mesmo tendo sido definido no menu. É a resposta ao filtro invisível: quem
 * ligou "Watching" três dias atrás precisa ver por que a biblioteca encolheu.
 *
 * ── O tipo transborda pro menu quando não cabe — 01/09/2026 ─────────────────
 * Medido: **oito chips ocupam 784px numa fileira de 1201**, e num monitor de
 * 1280 sobram nove. O enum de tipos abriu (brief, 3.10), então esse número não
 * tem teto — e o transbordo era **rolagem horizontal silenciosa no desktop**,
 * que é o mesmo defeito que derrubou a fileira de escopo de `/search`: um
 * controle sem teto tem que ser menu.
 *
 * Aqui a saída é OUTRA, e a diferença importa. Em `/search` o tipo é parâmetro
 * obrigatório da consulta e foi inteiro pro campo. Aqui ele é **filtro
 * opcional, com `All`** — esconder um filtro ligado é justamente o que a
 * decisão de 29/08 proíbe. Então: `All` mais quantos couberem, medido; o resto
 * na seção `Media type` do menu; e o escolhido **sempre na fileira**, no lugar
 * dele no vocabulário.
 *
 * **No celular a fileira continua rolando com todos.** Rolar chip é idioma
 * nativo ali, e o dedo tem como descobrir o que está fora da tela — o ponteiro
 * não. Quem decide é o breakpoint e não o apontador, porque o que muda junto é
 * o resto do chrome (a barra de abas, o cabeçalho de 56px), e não o alvo.
 *
 * 44px de alvo no toque e 36 no ponteiro (design system, seção 9).
 */
export function LibraryChips({
  type,
  status,
  onType,
  onClearStatus,
}: {
  type: MediaType | null
  status: EntryStatus | null
  onType: (next: MediaType | null) => void
  onClearStatus: () => void
}) {
  // O tipo ATIVO entra mesmo escondido: filtro ligado que some da fileira é o
  // defeito que a medição existe pra evitar, um nível acima.
  const list = useOfferedMediaTypes(type)
  const compact = useCompactViewport()

  const rowRef = useRef<HTMLDivElement>(null)
  const fixedRef = useRef<HTMLDivElement>(null)
  /**
   * As larguras são intrínsecas — dependem do rótulo traduzido e da fonte, não
   * do tamanho da janela —, então se medem UMA vez e ficam. É isso que impede
   * o laço clássico: esconder um chip mudaria a medição se ela dependesse do
   * que está na tela.
   */
  const widths = useRef<Map<string, number>>(new Map())
  const [livre, setLivre] = useState(0)

  /**
   * A medição guarda PARA QUAL vocabulário ela vale, e não um booleano.
   *
   * Vocabulário novo — tipo criado em Settings, idioma trocado — invalida as
   * larguras, que são de rótulos que podem não existir mais. Como estado, a
   * comparação acontece no render e não precisa de um efeito que reage a uma
   * dependência que ele não lê.
   */
  const [measuredFor, setMeasuredFor] = useState<string | null>(null)
  const listKey = list.map(({ slug }) => slug).join()
  const measured = measuredFor === listKey

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) {
      return
    }

    /**
     * A passada de medição renderiza TODOS os chips, e é a única em que eles
     * existem juntos no DOM. `useLayoutEffect` para que ela aconteça antes da
     * pintura: com `useEffect` a fileira cheia apareceria por um quadro.
     */
    if (!measured) {
      for (const element of row.querySelectorAll<HTMLElement>('[data-chip]')) {
        const slug = element.dataset.chip
        if (slug) {
          widths.current.set(slug, element.getBoundingClientRect().width)
        }
      }
      setMeasuredFor(listKey)
      return
    }

    /**
     * Mede a BORDA, não a largura.
     *
     * `clientWidth` inclui o `px-1` da fileira, e `getBoundingClientRect()` do
     * bloco fixo começa depois dele — subtrair uma da outra superestimaria o
     * espaço em 8px, o que num limiar deixa entrar um chip a mais e traz de
     * volta a rolagem silenciosa que isto existe pra tirar. Indo da direita
     * útil até onde o fixo termina, não há padding pra adivinhar.
     */
    const measureSpace = () => {
      const box = row.getBoundingClientRect()
      const right =
        box.right - Number.parseFloat(getComputedStyle(row).paddingRight)
      const fixedEnds = fixedRef.current?.getBoundingClientRect().right
      setLivre(right - (fixedEnds ?? box.left) - GAP)
    }

    measureSpace()

    /**
     * Observa a fileira E o bloco fixo. Só a fileira não basta: quando o chip
     * de status entra ou sai, a largura dela não muda — mas o espaço livre
     * muda, e sem isto a conta ficaria com o valor de antes.
     */
    const observer = new ResizeObserver(measureSpace)
    observer.observe(row)
    if (fixedRef.current) {
      observer.observe(fixedRef.current)
    }
    return () => observer.disconnect()
  }, [measured, listKey])

  /**
   * Enquanto não mediu — e sempre no celular — a fileira sai inteira. No
   * celular isso é o comportamento final; na primeira passada do desktop é o
   * que dá o que medir, e dura um layout, não um quadro.
   */
  const showAll = compact || !measured
  const active =
    type === null ? -1 : list.findIndex(({ slug }) => slug === type)

  const visible = showAll
    ? list.map((_, index) => index)
    : fittingChips({
        widths: list.map(({ slug }) => widths.current.get(slug) ?? 0),
        gap: GAP,
        available: livre,
        required: active === -1 ? null : active,
      })

  return (
    <div
      ref={rowRef}
      className="scrollbar-none -mx-1 flex h-14 items-center gap-2 overflow-x-auto px-1"
    >
      {/* O que não entra na count: o chip de status e o `All` saem sempre, e a
       * largura deles é o que se desconta do espaço livre. Medir os dois
       * juntos, num invólucro, é mais barato e mais correto que somar peças —
       * o divisor e os gaps de dentro vêm de graça. */}
      <div ref={fixedRef} className="flex shrink-0 items-center gap-2">
        {status && (
          <>
            <button type="button" onClick={onClearStatus} className={ON}>
              {appCopy.statuses[status]}
              <Close />
              <span className="sr-only">{libraryCopy.filters.clearStatus}</span>
            </button>
            <span className="h-6 w-px shrink-0 bg-line" aria-hidden="true" />
          </>
        )}

        <button
          type="button"
          onClick={() => onType(null)}
          aria-pressed={type === null}
          className={type === null ? ON : OFF}
        >
          {libraryCopy.filters.all}
        </button>
      </div>

      {visible.map((index) => {
        const info = list[index]
        if (!info) {
          return null
        }

        return (
          <button
            key={info.slug}
            type="button"
            data-chip={info.slug}
            onClick={() => onType(info.slug)}
            aria-pressed={type === info.slug}
            className={type === info.slug ? ON : OFF}
          >
            <MediaTypeIcon type={info.slug} size={14} strokeWidth={1.7} />
            {info.plural}
          </button>
        )
      })}
    </div>
  )
}
