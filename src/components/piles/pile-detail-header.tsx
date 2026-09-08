import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Pile } from '@/domain/media'
import { countOf, formatRelativeTime } from '@/lib/format'
import { pileDetailCopy } from '@/routes/-pile-detail.copy'
import { PileArt } from './pile-art'
import { PileDetailMenu } from './pile-detail-menu'

function Plus({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  )
}

function Pencil({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M13.5 3.5l3 3L7 16l-3.5.5L4 13z" />
    </svg>
  )
}

function Ellipsis() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="10" cy="4.5" r="1.3" />
      <circle cx="10" cy="10" r="1.3" />
      <circle cx="10" cy="15.5" r="1.3" />
    </svg>
  )
}

/**
 * Um selo discreto de estado da pilha.
 *
 * Existe porque **ajuste que age sozinho tem que se anunciar**: uma pilha com
 * `removeWhenCompleted` apaga associações sem ninguém pedir naquele instante,
 * e um ajuste invisível é um ajuste que a pessoa esquece que ligou — o mesmo
 * argumento que faz filtro definido no menu voltar como chip (design system,
 * seção 5).
 */
function EstadoChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-sm border border-line px-1.5 py-0.5 text-[11px] text-faint">
      {children}
    </span>
  )
}

/**
 * A descrição inteira — é o que esta tela tem e a listagem não, onde ela é uma
 * linha truncada.
 *
 * Três linhas antes do `More`, e a promessa de "inteira" é de
 * DISPONIBILIDADE, não de altura: uma descrição de dois mil caracteres
 * empurraria a pilha pra fora da primeira tela.
 *
 * O botão só aparece quando há o que revelar, e quem responde isso é medir —
 * `scrollHeight` contra `clientHeight`. Contar caracteres seria chutar com
 * fonte elástica e largura variável, e o botão apareceria numa descrição de
 * uma linha em tela larga (design system, seção 5: affordance descreve o que
 * existe).
 */
function Description({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [cropped, setCropped] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    function measure() {
      const target = ref.current
      if (target) {
        setCropped(target.scrollHeight > target.clientHeight + 1)
      }
    }

    measure()
    // A largura muda com a janela e com a sidebar recolhendo, e a mesma
    // descrição passa de duas linhas para quatro. `ResizeObserver` e não um
    // listener de `resize`: a sidebar não redimensiona a janela.
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="max-w-2xl">
      <p
        ref={ref}
        className={`text-muted text-sm leading-relaxed ${open ? '' : 'line-clamp-3'}`}
      >
        {text}
      </p>
      {(cropped || open) && (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="mt-0.5 rounded-sm text-faint text-xs outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
        >
          {open ? pileDetailCopy.less : pileDetailCopy.more}
        </button>
      )}
    </div>
  )
}

type PileDetailHeaderProps = {
  pile: Pile
  onAdd: () => void
  onEdit: () => void
  onDeleted: () => void
}

/**
 * A faixa de IDENTIDADE do cabeçalho de duas faixas (design system, seção 5,
 * 31/08/2026). Ela é sobre o conjunto inteiro: como se chama, quanto tem, e as
 * operações que valem pra ele todo.
 *
 * **Ela rola pra fora, e quem gruda é a faixa de controles.** É a divisão
 * semântica lida até o fim: quem você é não precisa ficar visível o tempo todo;
 * como você recorta, precisa. Um cabeçalho de 200px preso no topo comeria um
 * terço da tela pra repetir um nome que a pessoa acabou de ler.
 *
 * O quadrado tem 200px de lado — `--spacing-card-poster-h`, a ALTURA da carta
 * de mídia. Nenhum token novo, e a peça grande passa a rimar com a fileira de
 * cartas embaixo.
 */
export function PileDetailHeader({
  pile,
  onAdd,
  onEdit,
  onDeleted,
}: PileDetailHeaderProps) {
  const count =
    pile.entryCount === 0
      ? pileDetailCopy.count.none
      : countOf(pile.entryCount, pileDetailCopy.count)

  return (
    // `-mx` cancela o padding do `<main>` do shell pra faixa encostar nas
    // bordas; o `px` interno devolve o alinhamento com o conteúdo.
    <div className="-mx-4 px-4 pt-2 pb-6 md:-mx-8 md:px-8 md:pt-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <PileArt
          pile={pile}
          className="size-32 shrink-0 ring-1 ring-line md:size-card-poster-h"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2 md:min-h-card-poster-h">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              {/* `break-words` e não `truncate`: aqui o name É a identidade da
               * tela, e cortá-lo com reticências é diferente de cortar um
               * item numa lista de duzentos. */}
              <h1 className="break-words font-semibold text-2xl leading-tight tracking-tight md:text-3xl">
                {pile.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-faint text-sm">
                <span className="tabular-nums">{count}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {pileDetailCopy.updated} {formatRelativeTime(pile.updatedAt)}
                </span>
                {pile.removeWhenCompleted && (
                  <EstadoChip>{pileDetailCopy.removesCompleted}</EstadoChip>
                )}
                {pile.pinnedAt !== null && (
                  <EstadoChip>{pileDetailCopy.pinned}</EstadoChip>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 max-md:hidden">
              <Button onClick={onAdd} className="gap-2">
                <Plus />
                {pileDetailCopy.actions.add}
              </Button>
              <Button variant="outline" onClick={onEdit} className="gap-2">
                <Pencil />
                {pileDetailCopy.actions.edit}
              </Button>
              <PileDetailMenu pile={pile} onDeleted={onDeleted}>
                <button
                  type="button"
                  aria-label={pileDetailCopy.actions.menu}
                  className="flex size-9 items-center justify-center rounded-md text-muted outline-none transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ink/50"
                >
                  <Ellipsis />
                </button>
              </PileDetailMenu>
            </div>
          </div>

          {pile.description && <Description text={pile.description} />}

          {/* No celular as ações caem pro rodapé do cabeçalho, em alvos de
           * 44px (design system, seção 9) — a fileira de botões de 36px do
           * desktop não é tocável. */}
          <div className="mt-auto flex items-center gap-2 md:hidden">
            <Button onClick={onAdd} className="h-11 flex-1 gap-2">
              <Plus />
              {pileDetailCopy.actions.add}
            </Button>
            <Button
              variant="outline"
              onClick={onEdit}
              aria-label={pileDetailCopy.actions.edit}
              className="size-11 px-0"
            >
              <Pencil size={17} />
            </Button>
            <PileDetailMenu pile={pile} onDeleted={onDeleted} align="end">
              <button
                type="button"
                aria-label={pileDetailCopy.actions.menu}
                className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line text-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ink/50"
              >
                <Ellipsis />
              </button>
            </PileDetailMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
