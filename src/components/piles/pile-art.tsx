import { ArtTile } from '@/components/media/entry-art'
import type { Pile } from '@/domain/media'
import { identityOf } from '@/domain/pile-view'
import { pileCoverUrl } from '@/services/piles'

/**
 * O glifo de pilha — o mesmo quatro-peças do símbolo da marca (design system,
 * seção 10) e do ícone de nav. A pilha vazia usa ele porque não há conteúdo
 * pra mostrar, e o que sobra pra dizer é o que aquilo É.
 */
export function PileGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="6" height="6" rx="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" />
    </svg>
  )
}

/**
 * As duas caixas em que o ladrilho aparece, e o que muda entre elas é só
 * TAMANHO DE GLIFO — nunca a regra de qual nível desenhar, que é de
 * `identityOf` e vale igual nos dois.
 *
 * `row` diverge do mockup de propósito: lá a linha reusava a classe do
 * ladrilho grande e punha uma inicial de 30px numa caixa de 40. Aqui ela
 * acompanha a caixa.
 */
const SCALE = {
  tile: { single: 'text-3xl', piece: 'text-base', glyph: 28 },
  row: { single: 'text-base', piece: 'text-[10px]', glyph: 18 },
} as const

type PileArtProps = {
  pile: Pile
  variant?: keyof typeof SCALE
  /**
   * A caixa. **Não é definida aqui** pelo mesmo motivo de `EntryArt`: o
   * ladrilho da grade (`w-full`) e a miniatura da lista (`w-10 shrink-0`) são
   * formas diferentes do mesmo elemento, e embutir uma delas obrigaria a outra
   * a desfazê-la.
   */
  className?: string
}

/**
 * A identidade visual da pilha, no nível que `identityOf` decidir.
 *
 * **Quadrado**, e essa é a forma que `/library` recusou pra obra e reservou
 * pra cá (design system, seção 4): obra é pôster (2:3) e capa (3:4); pilha não
 * tem proporção natural, e o quadrado é o que não sugere uma.
 *
 * O mosaico não tem `gap` de verdade: as quatro peças se separam pelo `bg-line`
 * que aparece nos `gap-px` — moldura interna de um pixel, não espaço.
 */
export function PileArt({ pile, variant = 'tile', className }: PileArtProps) {
  const box = `aspect-square overflow-hidden rounded-md ${className ?? ''}`
  const scale = SCALE[variant]
  const identity = identityOf(pile)

  if (identity.kind === 'cover') {
    return (
      // `alt=""` e não o nome da pilha: o nome está SOB o ladrilho, sempre
      // (design system, seção 4), então descrevê-la aqui faria o leitor de
      // tela dizer o mesmo duas vezes seguidas.
      //
      // `object-cover` é rede, não recorte: a imagem já sobe quadrada
      // (`domain/cover.ts`), e isto só evita que uma capa gravada antes de
      // alguma mudança de regra distorça o ladrilho.
      <img
        src={pileCoverUrl(pile)}
        alt=""
        loading="lazy"
        className={`object-cover ${box}`}
      />
    )
  }

  if (identity.kind === 'mosaic') {
    return (
      <div
        className={`grid grid-cols-2 grid-rows-2 gap-px bg-line ${box}`}
        aria-hidden="true"
      >
        {identity.pieces.map((piece) => (
          <ArtTile key={piece.id} title={piece.title} className={scale.piece} />
        ))}
      </div>
    )
  }

  if (identity.kind === 'single') {
    return (
      <ArtTile title={identity.title} className={`${box} ${scale.single}`} />
    )
  }

  return (
    <div
      className={`flex items-center justify-center bg-card text-faint ring-1 ring-line ring-inset ${box}`}
      aria-hidden="true"
    >
      <PileGlyph size={scale.glyph} />
    </div>
  )
}
