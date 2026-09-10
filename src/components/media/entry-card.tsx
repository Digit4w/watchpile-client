import { Link } from '@tanstack/react-router'
import type { Entry } from '@/domain/media'
import { useMediaTypeName } from '@/hooks/queries/media-types/use-media-type-name'
import { appCopy } from '@/lib/copy'
import { EntryActions } from './entry-actions'
import { EntryArt } from './entry-art'
import { EntryProgress } from './entry-progress'
import { MediaTypeIcon } from './media-type-icon'

/**
 * A carta de mídia — a arte é a carta inteira, com título e contador por cima
 * de um degradê na base. Vem de `design/mockups/home.html` (23–24/08/2026), e
 * a decisão registrada lá é que texto sobre a arte, com scrim, passou a valer
 * também em carta de grade/rolagem, não só no hero grande (design system,
 * seção 4).
 *
 * **A altura é fixa (200px); a largura vem de quem chama.** Só a altura entra
 * na conta que faz uma fileira caber exata na grade da Home
 * (`domain/home-metrics.ts`) — a largura não aparece nela. Na grade a carta
 * preenche a trilha até um teto; na rolagem horizontal ela tem largura fixa,
 * porque ali não há trilha nenhuma pra preencher.
 *
 * Os dois atalhos do hover são reais: o lápis abre o progresso exato mais o
 * status, e o `⋯` leva a remover a obra (`entry-actions.tsx`). O que continua
 * de fora é o botão de favoritar do mockup — não existe coluna de favorito no
 * schema, e botão que não faz nada é pior que botão ausente.
 */
export function EntryCard({
  entry,
  pileId,
  reorder,
  className,
}: {
  entry: Entry
  /**
   * Reordenar esta obra no widget que a contém — só a Home passa, e só ela tem
   * ordem manual de carta (medido em 10/09/2026: `/library` e a grade de
   * `/piles/:id` renderizam esta mesma carta sem embrulhá-la em nada
   * arrastável).
   *
   * **Ele viaja pro menu e o desenho da carta não muda** — que é a decisão de
   * reuso da seção 4: a carta é a MESMA em toda tela. Quem muda o desenho é a
   * classe que o invólucro põe enquanto o modo está ligado.
   */
  reorder?: { on: boolean; toggle: () => void }
  /**
   * Quando a carta é mostrada dentro de uma pilha. Só serve pra o menu ganhar
   * `Remove from pile` — o desenho da carta não muda em nada, que é a decisão
   * de reuso do design system (seção 4): a carta é a MESMA em toda tela.
   */
  pileId?: number
  className?: string
}) {
  const typeName = useMediaTypeName()

  return (
    // `group` é o gancho do hover; a camada de atalhos escuta por ele.
    //
    // `div` e não `li`: quem é o item da lista é o invólucro que arrasta
    // (`Sortable`, em `widget-content.tsx`), e `<ul>` só aceita `<li>` como
    // filho direto.
    <div
      className={`group relative h-full w-full overflow-hidden rounded-md ${className ?? ''}`}
    >
      <EntryArt entry={entry} className="absolute inset-0 text-3xl" />

      {/**
       * **A CARTA INTEIRA é o link — 07/09/2026, decisão do dono.** As três
       * formas de carta do app passam a concordar: a de busca já era link
       * inteiro, e esta e a compacta linkavam só pelo título.
       *
       * A régua nunca foi "carta linka pelo título"; era *aquela carta só
       * CONSEGUIA linkar pelo título*, e a distinção estava escondida atrás de
       * um detalhe de CSS. O que bloqueava era a camada de atalhos ligar
       * `pointer-events` no hover — ela cobre a carta inteira e absorvia o
       * clique justo quando alguém clica. Agora ela é `pointer-events: none`
       * para sempre e quem captura são os dois botões dela.
       *
       * **Vem logo depois da arte, e sem `z-index`.** Assim ele fica abaixo da
       * camada de atalhos (que vem depois, também em `z` automático) e abaixo
       * dos selos e da faixa, que são `z-10` — o que mantém os botões, o
       * contador e o `⋯` acima dele sem nenhum deles precisar mudar.
       *
       * `aria-label` porque o link não tem texto dentro: o título visível mora
       * na faixa de baixo, que é `z-10` e portanto outro contexto de
       * empilhamento. `ring-inset` porque a carta é `overflow-hidden` e um anel
       * pra fora seria cortado.
       */}
      <Link
        to="/library/$entryId"
        params={{ entryId: String(entry.id) }}
        aria-label={entry.title}
        className="absolute inset-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ink/70 focus-visible:ring-inset"
      />

      <EntryActions entry={entry} pileId={pileId} reorder={reorder} />

      {/* O type de mídia, em selo de vidro no canto (design system, seção 2 —
       * decisão fechada em 29/08/2026). Sem provedor de metadados a arte é a
       * inicial do título num degradê, e numa grade de tipos misturados isso
       * é uma parede de retângulos iguais: o selo é o que diz que aquela é a
       * série e a do lado é o jogo. Canto e não centro, como a seção 4 já
       * registrava a partir do `yamtrack`.
       *
       * `title` e não `aria-label` no `<span>`: um `span` sem papel não expõe
       * nome acessível, então quem lê o rótulo é o `sr-only` do ícone. */}
      <span
        className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center rounded-sm bg-glass p-1 text-ink backdrop-blur-md"
        title={typeName(entry.mediaType)}
      >
        <MediaTypeIcon type={entry.mediaType} labelled />
      </span>

      {entry.rating !== null && (
        // Vidro fosco sobre a arte (design system, seção 2). `z-10` porque o
        // degradê da base é irmão e desenha depois.
        // `pointer-events-none`: com a carta inteira clicável, um selo sem
        // interação nenhuma não pode virar um buraco morto no canto. O selo de
        // TIPO fica clicável de propósito — ele tem `title`, e tooltip precisa
        // receber o ponteiro.
        <span className="pointer-events-none absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 rounded-sm bg-glass px-1.5 py-0.5 text-[10px] text-ink backdrop-blur-md">
          <svg
            width="9"
            height="9"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 1l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1L4.6 17l1.3-6L1.3 7.2l6.1-.6L10 1z" />
          </svg>
          {/* O leitor de tela ouve "Rating 8.1"; a estrela é decoração. Rótulo
           * e número ficam separados de propósito — juntá-los numa string só
           * viraria concatenação, que é o que trava tradução. */}
          <span className="sr-only">{appCopy.entry.rating}</span>
          {entry.rating.toFixed(1)}
        </span>
      )}

      {/* `pt-8` é o comprimento do degradê, não espaçamento: é o que dá ao
       * texto um fundo que escurece aos poucos em vez de uma faixa com borda
       * dura. */}
      {/* `z-10` como o selo de nota: a camada de hover cobre a carta inteira, e
       * sem isto ela ficaria por cima do `+/−`, que é a ação mais usada da
       * tela. Mesmo motivo pelo qual o mockup dá `z-10` ao selo. */}
      {/* `from-35%`: sólido até 35% da band, e só então a rampa. Medido em
       * 01/09/2026 contra um pôster BRANCO — o pior caso (design system, seção
       * 9): com a rampa começando na base o topo do título caía em 2,56:1,
       * contra os 4,5 não negociáveis; a 35% fecha em 5,36.
       *
       * A carta ainda desenha a inicial num degradê escuro, onde isso não
       * muda nada visível. Entra agora porque a arte de provedor já existe em
       * `/search`, e chega aqui no ciclo do cache de arte — o scrim tinha sido
       * calibrado contra o ladrilho neutro e nunca contra uma capa de verdade. */}
      {/* `pointer-events-none` na FAIXA: ela é `z-10`, acima do link, e sem
       * isto o clique sobre o título morreria nela. Quem volta ao fluxo é só o
       * contador, que é controle de escrita. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-0.5 bg-gradient-to-t from-35% from-surface to-transparent px-2 pt-8 pb-2">
        {/**
         * **O título é um `<span>`, e o link é a carta** (07/09/2026). `<a>`
         * dentro de `<a>` é inválido, então o `Link` daqui saiu — a promessa
         * de que se clica no nome continua cumprida, porque o nome está DENTRO
         * do alvo.
         *
         * O sublinhado FICA, agora por `group-hover` (decisão do dono). Ele é o
         * único sinal de navegação que a carta tem: a camada de hover é sobre
         * AÇÕES — o lápis, o `⋯` —, e nada nela diz "clique pra abrir". O
         * contra-argumento registrado é que sublinhar só o título sugere que só
         * ele é clicável quando a carta toda é; isso é prometer menos do que se
         * entrega, que é o lado seguro de errar, e é o comportamento de hoje.
         */}
        <span className="truncate font-medium text-ink text-xs group-focus-within:underline group-hover:underline">
          {entry.title}
        </span>
        <span className="pointer-events-auto">
          <EntryProgress entry={entry} variant="card" />
        </span>
      </div>
    </div>
  )
}
