import type { AnimationEvent, CSSProperties } from 'react'
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { HomeWidget } from '@/domain/home-widget'
import { widgetLabel } from '@/domain/home-widget'
import { useDeleteWidget } from '@/hooks/mutations/home-widgets/use-delete-widget'
import { usePiles } from '@/hooks/queries/piles/use-piles'
import { homeCopy } from '@/routes/-home.copy'
import './home-motion.css'
import { WidgetContent } from './widget-content'
import { WidgetRemove } from './widget-remove'
import { WidgetSettings } from './widget-settings'

const iconButton =
  'flex h-6 w-6 items-center justify-center rounded-sm text-faint transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised data-[state=open]:bg-raised'

/** Rótulo da fonte: nomes das piles, ou "biblioteca inteira" quando não há
 * nenhuma — que é o default do modelo, não um estado incompleto. */
function useSourceLabel(widget: HomeWidget): string {
  const piles = usePiles()

  if (widget.pileIds.length === 0) {
    return homeCopy.widget.wholeLibrary
  }
  const names = widget.pileIds
    .map((id) => piles.data?.find((pile) => pile.id === id)?.name)
    .filter(Boolean)

  return names.length > 0 ? names.join(' · ') : homeCopy.widget.wholeLibrary
}

type WidgetFrameProps = {
  widget: HomeWidget
  editing: boolean
  /** Posição na lista, só pra escalonar a entrada. */
  index: number
}

export function WidgetFrame({ widget, editing, index }: WidgetFrameProps) {
  const source = useSourceLabel(widget)
  // Com nome próprio, a fonte sai do cabeçalho — mas continua no `title`, pra
  // quem precisar lembrar de onde o widget puxa sem abrir as configurações.
  const derived = `${homeCopy.types[widget.type]} · ${source}`
  const remove = useDeleteWidget()

  /**
   * A saída em duas etapas (29/08/2026). Apagar direto era seco por um motivo
   * mecânico: a query invalida, o widget some do DOM no render seguinte e a
   * compactação puxa os vizinhos pra cima no MESMO quadro — some e reflow
   * acontecendo juntos, sem nada pra o olho seguir.
   *
   * Confirmar liga `leaving`, e o widget continua montado ocupando a célula
   * dele enquanto encolhe. Só quando a animação termina é que o `DELETE` sai e
   * os vizinhos sobem. Duas leituras em sequência em vez de um salto.
   *
   * Quem avisa o fim é o `animationend`, não um `setTimeout`: a duração é
   * token de CSS, e repeti-la em JS seria a mesma duplicação que escrever
   * `220ms` à mão no componente.
   */
  const [leaving, setLeaving] = useState(false)

  function handleAnimationEnd(event: AnimationEvent<HTMLElement>) {
    // O card também anima na ENTRADA: sem checar o nome, um widget removido
    // nos primeiros 220ms de vida dispararia o `DELETE` cedo demais. O prefixo
    // cobre a variante de `prefers-reduced-motion`, que só esmaece.
    if (
      leaving &&
      event.target === event.currentTarget &&
      event.animationName.startsWith('wp-widget-out')
    ) {
      // Sem o `onError` o widget ficaria em `opacity: 0` e sem eventos pra
      // sempre: a animação já rodou, e nada mais o traria de volta.
      remove.mutate(widget.id, { onError: () => setLeaving(false) })
    }
  }

  return (
    <section
      // A entrada anima o CARD, não o item da grade: o item é posicionado em
      // absoluto e já tem transição própria de `transform` — animar os dois
      // brigaria. Coreografia em `home-motion.css`.
      //
      // `ring` e não `border`: com `box-sizing: border-box` a borda sai de
      // DENTRO da altura, e 1px em cima mais 1px embaixo fazem o chrome valer
      // 74 em vez de 72 — o suficiente pra cortar a última fileira de cartas em
      // 2px. `ring` é `box-shadow`, que não participa do layout. Visualmente é
      // a mesma linha; aritmeticamente é a diferença entre encaixar e não.
      className={`flex h-full flex-col overflow-hidden rounded-lg bg-card p-4 ring-1 ring-line ring-inset ${
        leaving ? 'wp-widget-out pointer-events-none' : 'wp-widget-in'
      }`}
      style={{ '--wp-index': index } as CSSProperties}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* `h-6` e `mb-4` NÃO são estética: com `p-4` eles somam 72px de chrome,
       * que é uma linha de grade exata — a igualdade que faz a fileira de
       * cartas encaixar (`domain/home-metrics.ts`, WIDGET_CHROME). O `h-6`
       * ainda resolve um bug: os botões só existem no Edit Layout, e sem
       * altura fixa o header encolhia 8px ao sair do modo, mudando a altura do
       * conteúdo sozinho. */}
      <header className="mb-4 flex h-6 shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {editing && (
            <span
              // o handle é o que o react-grid-layout escuta pra arrastar; fora
              // do modo de edição ele não existe, e o widget fica imóvel
              className="widget-drag-handle cursor-grab text-faint active:cursor-grabbing"
              title={homeCopy.widget.drag}
              aria-hidden="true"
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <circle cx="6" cy="5" r="1.3" />
                <circle cx="6" cy="10" r="1.3" />
                <circle cx="6" cy="15" r="1.3" />
                <circle cx="12" cy="5" r="1.3" />
                <circle cx="12" cy="10" r="1.3" />
                <circle cx="12" cy="15" r="1.3" />
              </svg>
            </span>
          )}
          {/* O name do usuário quando existe; senão o rótulo derived. A regra
           * mora em `domain/home-widget.ts` — quem decide não é quem desenha.
           *
           * Uma linha só, e isso não é escolha estética: o header é `h-6` e
           * essa altura entra na conta do encaixe (`home-metrics.ts`, chrome
           * de 72px). Uma segunda linha com a fonte derivada quebraria a
           * fileira de cartas. */}
          <p
            title={derived}
            className="min-w-0 truncate font-medium text-faint text-xs uppercase tracking-wide"
          >
            {widgetLabel(widget, {
              type: homeCopy.types[widget.type],
              source,
            })}
          </p>
        </div>

        {editing && (
          <div className="flex shrink-0 items-center gap-1">
            {/*
             * Popover não-controlado de propósito: sair do Edit Layout
             * desmonta este bloco inteiro, e com isso o estado interno do
             * Radix zera. Guardar o aberto/fechado aqui fora só criaria a
             * chance de voltar pro modo de edição com o painel já aberto.
             *
             * As três regras que `design/mockups/home.html` registrou em
             * 24/08/2026 — um painel por vez, fecha ao clicar fora, fecha com
             * `Esc` — saem de graça do Radix: o `pointerdown` que abre o
             * painel de um vizinho é um clique fora deste.
             */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${iconButton} hover:text-ink data-[state=open]:text-ink`}
                  aria-label={homeCopy.widget.configure}
                >
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <line x1="3" y1="5" x2="17" y2="5" />
                    <circle
                      cx="7"
                      cy="5"
                      r="2"
                      fill="currentColor"
                      stroke="none"
                    />
                    <line x1="3" y1="10" x2="17" y2="10" />
                    <circle
                      cx="13"
                      cy="10"
                      r="2"
                      fill="currentColor"
                      stroke="none"
                    />
                    <line x1="3" y1="15" x2="17" y2="15" />
                    <circle
                      cx="9"
                      cy="15"
                      r="2"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </button>
              </PopoverTrigger>
              {/*
               * Portal do Radix: o painel sai do card e não é cortado pelo
               * `overflow-hidden` daqui nem pelo `overflow-y: auto` que um
               * widget encolhido liga — o segundo motivo registrado no mockup
               * pra ele flutuar em vez de morar dentro do card.
               *
               * Teto de altura porque o conteúdo cresce com o número de piles;
               * sem ele o painel passa da janela num servidor com muitas.
               */}
              <PopoverContent
                align="end"
                sideOffset={8}
                className="scrollbar-styled max-h-[min(70vh,28rem)] w-72 overflow-y-auto p-3"
              >
                <PopoverTitle className="mb-3 text-faint text-xs uppercase tracking-wide">
                  {homeCopy.widget.configure}
                </PopoverTitle>
                <WidgetSettings widget={widget} />
              </PopoverContent>
            </Popover>

            <WidgetRemove
              onConfirm={() => setLeaving(true)}
              disabled={leaving || remove.isPending}
              className={iconButton}
            />
          </div>
        )}
      </header>

      <div className="scrollbar-styled min-h-0 flex-1 overflow-y-auto">
        <WidgetContent widget={widget} />
      </div>
    </section>
  )
}
