import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ART_SLOTS, artGate } from '@/lib/art-gate'
import { RemoteArt } from './remote-art'

/**
 * O que o componente DECIDE: imagem da nossa origem espera vaga e é baixada por
 * `fetch` cancelável; a de fora vai direto pro `<img>`. A fila em si está
 * coberta em `lib/art-gate.spec.ts`.
 *
 * **O corte é no `fetch`**, que é a fronteira de rede desta peça — como
 * `services/` é a das outras. O jsdom não tem `IntersectionObserver` nem
 * `URL.createObjectURL`: o componente trata a ausência do primeiro como "está
 * perto", e o segundo é dublado aqui.
 */

type Pending = {
  url: string
  signal: AbortSignal
  resolve: (response: Response) => void
}

let pending: Pending[] = []
const held: Array<() => void> = []

beforeEach(() => {
  pending = []
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (url: string, init: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const signal = init.signal as AbortSignal
          signal.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          )
          pending.push({ url, signal, resolve })
        }),
    ),
  )
  URL.createObjectURL = vi.fn(() => 'blob:art')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  for (const release of held.splice(0)) {
    release()
  }
  vi.unstubAllGlobals()
})

/** Ocupa as vagas da fila, deixando `free` delas livres. */
function occupy(free = 0) {
  for (let i = 0; i < ART_SLOTS - free; i++) {
    held.push(artGate.request(() => {}))
  }
}

/**
 * Resposta dublada à mão, não `new Response(new Blob(...))`: o `Blob` é do
 * jsdom e o `Response` é do Node, e os dois não se conversam (`stream is not a
 * function`). O componente só lê `ok` e `blob()`.
 */
async function arrive(index: number, status = 200) {
  await act(async () => {
    pending[index]?.resolve({
      ok: status >= 200 && status < 300,
      status,
      blob: async () => new Blob(['x']),
    } as Response)
  })
}

describe('RemoteArt', () => {
  it('does not start downloading an image from our origin while the gate is full', () => {
    occupy()
    const { container } = render(
      <RemoteArt src="/api/entries/7/art" title="Frieren" />,
    )

    expect(fetch).not.toHaveBeenCalled()
    expect(container.querySelector('img')).toBeNull()

    act(() => held.shift()?.())
    expect(pending.map((p) => p.url)).toEqual(['/api/entries/7/art'])
  })

  it('draws the image from the downloaded bytes once they arrive', async () => {
    const { container } = render(
      <RemoteArt src="/api/entries/7/art" title="Frieren" />,
    )

    await arrive(0)
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:art')
  })

  it('leaves an image from another origin to the browser, outside the gate', () => {
    occupy()
    const { container } = render(
      <RemoteArt src="https://image.tmdb.org/t/p/w342/x.jpg" title="Frieren" />,
    )

    expect(fetch).not.toHaveBeenCalled()
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w342/x.jpg',
    )
  })

  it('gives the slot back when the bytes arrive, so the next download starts', async () => {
    occupy(1)
    render(<RemoteArt src="/api/entries/1/art" title="A" />)
    render(<RemoteArt src="/api/entries/2/art" title="B" />)
    expect(pending.map((p) => p.url)).toEqual(['/api/entries/1/art'])

    await arrive(0)
    expect(pending.map((p) => p.url)).toEqual([
      '/api/entries/1/art',
      '/api/entries/2/art',
    ])
  })

  /**
   * O caso que a primeira versão errou: tirar o `<img>` da tela não cancelava
   * o download, e a conexão continuava presa com a vaga já devolvida.
   */
  it('aborts the download on unmount and hands the slot on', () => {
    occupy(1)
    const first = render(<RemoteArt src="/api/entries/1/art" title="A" />)
    render(<RemoteArt src="/api/entries/2/art" title="B" />)

    first.unmount()

    expect(pending[0]?.signal.aborted).toBe(true)
    expect(pending.map((p) => p.url)).toEqual([
      '/api/entries/1/art',
      '/api/entries/2/art',
    ])
  })

  it('falls back to the tile on a failed response and frees the slot', async () => {
    occupy(1)
    const first = render(<RemoteArt src="/api/entries/1/art" title="Frieren" />)
    render(<RemoteArt src="/api/entries/2/art" title="B" />)

    await arrive(0, 404)

    expect(first.container.querySelector('img')).toBeNull()
    expect(first.container).toHaveTextContent('F')
    expect(pending.map((p) => p.url)).toContain('/api/entries/2/art')
  })
})
