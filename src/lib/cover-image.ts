import { COVER_SIZE, type Rect } from '@/domain/cover'

/**
 * O desenho: canvas, `Blob` e `Image`. A aritmética do recorte fica em
 * `domain/cover.ts` — geometria se testa sem DOM, desenho não.
 */

export type LoadedImage = {
  element: HTMLImageElement
  width: number
  height: number
  /** Precisa ser revogado quando a folha fechar, senão o blob vaza. */
  objectUrl: string
}

export function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const element = new Image()

    element.onload = () =>
      resolve({
        element,
        width: element.naturalWidth,
        height: element.naturalHeight,
        objectUrl,
      })
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('unreadable-image'))
    }

    element.src = objectUrl
  })
}

/**
 * Recorta o quadrado escolhido e reduz para `COVER_SIZE`, em WebP.
 *
 * **Nunca amplia**: uma imagem de 120px vira um arquivo de 120px, não um de
 * 400 borrado. Esticar pixels não acrescenta informação nenhuma e só faz o
 * BLOB — que vive dentro do arquivo de backup — pesar mais por nada.
 *
 * `image/webp` porque é o menor dos três que o servidor aceita, e é suportado
 * por todo navegador que roda este app. Se o `toBlob` falhar (formato não
 * suportado num navegador exótico), a promessa REJEITA em vez de devolver
 * `null` calado — subir "nada" como capa é pior que dizer que não deu.
 */
export function cropToCover(image: LoadedImage, rect: Rect): Promise<Blob> {
  const side = Math.min(rect.size, COVER_SIZE)
  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side

  const context = canvas.getContext('2d')
  if (!context) {
    return Promise.reject(new Error('no-canvas-context'))
  }

  // `high` porque a redução costuma ser grande (4000px → 400) e o padrão do
  // navegador deixa serrilhado visível justamente nesse salto.
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image.element,
    rect.x,
    rect.y,
    rect.size,
    rect.size,
    0,
    0,
    side,
    side,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode-failed'))),
      'image/webp',
      0.85,
    )
  })
}
