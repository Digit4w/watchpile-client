import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Rect } from '@/domain/cover'
import {
  COVER_MAX_BYTES,
  centeredSquare,
  clampSquare,
  dragToImageScale,
} from '@/domain/cover'
import type { Pile } from '@/domain/media'
import {
  useRemovePileCover,
  useSetPileCover,
} from '@/hooks/mutations/piles/use-set-pile-cover'
import { cropToCover, type LoadedImage, loadImage } from '@/lib/cover-image'
import { pilesCopy } from '@/routes/-piles.copy'
import { PileArt } from './pile-art'

/** O lado da prévia de recorte, em CSS. Só ela — o arquivo sai em 400. */
const PREVIEW = 224

function Image() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <circle cx="7.5" cy="8.5" r="1.3" />
      <path d="M4 14l4-4 3 3 2-2 3 3" />
    </svg>
  )
}

/**
 * O ajuste de enquadramento: a imagem inteira ao fundo, o quadrado escolhido
 * em destaque, e o dedo move o quadrado.
 *
 * **O quadrado não redimensiona, só anda.** Ele já é o maior que cabe
 * (`centeredSquare`), então mudar o tamanho só poderia encolher — e uma capa
 * menor que o possível é uma escolha que ninguém quis fazer. Reduzir a decisão
 * a um eixo é o que permite o controle ser arrastar, sem alças de canto.
 */
function Framing({
  image,
  rect,
  onRect,
}: {
  image: LoadedImage
  rect: Rect
  onRect: (next: Rect) => void
}) {
  const dragging = useRef<{ x: number; y: number; rect: Rect } | null>(null)

  // A prévia mostra a imagem inteira encaixada num quadrado de `PREVIEW`; a
  // escala é a que leva coordenada de imagem para coordenada de tela.
  const displayScale = PREVIEW / Math.max(image.width, image.height)
  const displayedWidth = image.width * displayScale
  const displayedHeight = image.height * displayScale

  function onMove(event: PointerEvent) {
    const start = dragging.current
    if (!start) {
      return
    }
    // O dedo anda em pixels de TELA; o recorte anda em pixels de IMAGEM. Sem
    // esta conversão, arrastar 10px numa foto de 4000px moveria o recorte 10
    // pixels de imagem — um movimento que não sai do lugar.
    const factor = dragToImageScale(start.rect, PREVIEW)
    onRect(
      clampSquare(
        {
          x: start.rect.x - (event.clientX - start.x) * factor,
          y: start.rect.y - (event.clientY - start.y) * factor,
          size: start.rect.size,
        },
        image.width,
        image.height,
      ),
    )
  }

  useEffect(() => {
    function drop() {
      dragging.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', drop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', drop)
    }
  })

  return (
    // Os listeners ficam na JANELA e não no elemento: quem arrasta rápido tira
    // o ponteiro da caixa, e um `onPointerMove` local perderia o gesto no meio.
    <div
      className="relative mx-auto touch-none overflow-hidden rounded-md bg-surface"
      style={{ width: PREVIEW, height: PREVIEW }}
      onPointerDown={(event) => {
        dragging.current = {
          x: event.clientX,
          y: event.clientY,
          rect,
        }
      }}
    >
      <img
        src={image.objectUrl}
        alt=""
        draggable={false}
        className="pointer-events-none absolute cursor-grab select-none"
        style={{
          width: displayedWidth,
          height: displayedHeight,
          left: (PREVIEW - displayedWidth) / 2,
          top: (PREVIEW - displayedHeight) / 2,
        }}
      />
      {/* O véu por outside do quadrado, desenhado com uma sombra gigante em vez
       * de quatro retângulos: um elemento, e ele acompanha o quadrado sozinho. */}
      <div
        className="pointer-events-none absolute cursor-grab ring-1 ring-ink/70"
        style={{
          left: (PREVIEW - displayedWidth) / 2 + rect.x * displayScale,
          top: (PREVIEW - displayedHeight) / 2 + rect.y * displayScale,
          width: rect.size * displayScale,
          height: rect.size * displayScale,
          boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.6)',
        }}
      />
    </div>
  )
}

/**
 * O bloco `Cover` da folha de editar pilha (brief, 3.17).
 *
 * **O navegador é quem corta e reduz** — o servidor valida tipo e tamanho em
 * bytes e guarda o que recebeu. A decisão é de empacotamento: `sharp` seria um
 * segundo módulo nativo além do `better-sqlite3`, dobrando a superfície do
 * `electron:rebuild` a cada release.
 *
 * A frase diz o que acontece SEM capa, porque é o estado em que quase toda
 * pilha vive — e é o que liga este bloco à escada de identidade do container.
 */
export function PileCoverField({ pile }: { pile: Pile }) {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const setCover = useSetPileCover(pile.id)
  const removeCover = useRemovePileCover(pile.id)

  // O `objectURL` do arquivo escolhido segura o blob em memória até ser
  // revogado. Sem isto, trocar de imagem cinco vezes deixa cinco blobs presos.
  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image.objectUrl)
      }
    }
  }, [image])

  async function choose(file: File) {
    setError(null)

    // O teto é conferido aqui TAMBÉM, e não só no servidor: recusar depois de
    // subir 8MB numa rede doméstica lenta é fazer a pessoa esperar pra ouvir
    // não. O servidor continua conferindo, porque ele não confia no cliente.
    if (file.size > COVER_MAX_BYTES) {
      setError(pilesCopy.cover.tooLarge)
      return
    }

    try {
      const loaded = await loadImage(file)
      setImage(loaded)
      setRect(centeredSquare(loaded.width, loaded.height))
    } catch {
      setError(pilesCopy.cover.unreadable)
    }
  }

  async function save() {
    if (!image || !rect) {
      return
    }
    try {
      const blob = await cropToCover(image, rect)
      setCover.mutate(blob, {
        onSuccess: () => {
          setImage(null)
          setRect(null)
        },
      })
    } catch {
      setError(pilesCopy.cover.unreadable)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted text-xs">{pilesCopy.cover.label}</span>

      {image && rect ? (
        <div className="flex flex-col gap-3">
          <Framing image={image} rect={rect} onRect={setRect} />
          <p className="text-center text-faint text-xs">
            {pilesCopy.cover.dragHint}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={setCover.isPending}
              onClick={save}
            >
              {pilesCopy.cover.use}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setImage(null)
                setRect(null)
              }}
            >
              {pilesCopy.cover.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <PileArt pile={pile} className="w-24 shrink-0" />
          <div className="flex min-w-0 flex-col gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-start gap-2"
              onClick={() => input.current?.click()}
            >
              <Image />
              {pile.hasCover ? pilesCopy.cover.change : pilesCopy.cover.choose}
            </Button>
            {pile.hasCover && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="justify-start text-faint"
                disabled={removeCover.isPending}
                onClick={() => removeCover.mutate()}
              >
                {pilesCopy.cover.remove}
              </Button>
            )}
          </div>
        </div>
      )}

      <input
        ref={input}
        type="file"
        // A lista bate com a do servidor. `accept` é conveniência do seletor,
        // não validação — ele não impede arrastar outra coisa pra dentro.
        accept="image/webp,image/png,image/jpeg"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void choose(file)
          }
          // Zerado pra que escolher o MESMO arquivo de novo dispare `change`.
          event.target.value = ''
        }}
      />

      <p className="text-faint text-xs leading-relaxed">
        {pilesCopy.cover.hint}
      </p>
      {error && <p className="text-danger text-xs">{error}</p>}
      {setCover.isError && (
        <p className="text-danger text-xs">{setCover.error.message}</p>
      )}
    </div>
  )
}
