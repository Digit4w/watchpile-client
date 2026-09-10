import { describe, expect, it } from 'vitest'
import type { Entry } from './media'
import { canReorder, orderedIds } from './pile-detail-view'

describe('canReorder', () => {
  it('allows dragging in the two list modes, in manual order', () => {
    expect(canReorder('manual', 'list')).toBe(true)
    expect(canReorder('manual', 'compact-list')).toBe(true)
  })

  /**
   * Na carta não há canto livre pra alça, e `touch-none` numa tela cheia de
   * cartas engole a rolagem do dedo. Quem quer reordenar troca de modo.
   */
  it('refuses dragging in the two grid modes, even in manual order', () => {
    expect(canReorder('manual', 'grid')).toBe(false)
    expect(canReorder('manual', 'compact-grid')).toBe(false)
  })

  /**
   * A ordem manual continua existindo quando se ordena por título — ela só não
   * é a que está na tela. Arrastar ali seria uma promessa que o servidor não
   * pode cumprir, porque `after` se refere à ordem que o usuário não está
   * vendo.
   */
  it('refuses dragging in a derived order, in any mode', () => {
    for (const view of [
      'list',
      'compact-list',
      'grid',
      'compact-grid',
    ] as const) {
      expect(canReorder('title', view)).toBe(false)
      expect(canReorder('rating', view)).toBe(false)
      expect(canReorder('added', view)).toBe(false)
    }
  })
})

function entry(over: Partial<Entry> & { id: number }): Entry {
  return {
    mediaType: 'tv',
    title: 'Untitled',
    status: 'watching',
    rating: null,
    notes: null,
    progress: 0,
    total: null,
    timeSpent: null,
    art: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

describe('orderedIds', () => {
  /**
   * A ordem manual JÁ é a que chegou do servidor, por `position`. Reordenar
   * aqui seria refazer com menos informação o que o servidor decidiu.
   */
  it('keeps the order the server sent in manual mode', () => {
    const entries = [entry({ id: 3 }), entry({ id: 1 }), entry({ id: 2 })]
    expect(orderedIds(entries, 'manual')).toEqual([3, 1, 2])
  })

  it('sorts by title with locale rules, not code points', () => {
    const entries = [
      entry({ id: 1, title: 'Zulu' }),
      entry({ id: 2, title: 'Álbum' }),
      entry({ id: 3, title: 'Arcane' }),
    ]
    // Álbum, Arcane, Zulu. Sem `localeCompare` o "Á" tem code point acima do
    // "Z" e o primeiro cairia por último — e o catálogo pt-BR (brief, 3.8)
    // enche a biblioteca de acento.
    expect(orderedIds(entries, 'title')).toEqual([2, 3, 1])
  })

  /**
   * Sem nota e nota zero são coisas diferentes. Um `?? 0` faria a lista abrir
   * com tudo que ninguém avaliou.
   */
  it('sends unrated titles to the end, never to the top as a zero', () => {
    const entries = [
      entry({ id: 1, rating: null }),
      entry({ id: 2, rating: 0 }),
      entry({ id: 3, rating: 9 }),
    ]
    expect(orderedIds(entries, 'rating')).toEqual([3, 2, 1])
  })

  it('does not mutate the array it was given', () => {
    const entries = [entry({ id: 2, title: 'B' }), entry({ id: 1, title: 'A' })]
    orderedIds(entries, 'title')
    // O array vem do cache do TanStack Query; `sort` muta no lugar.
    expect(entries.map(({ id }) => id)).toEqual([2, 1])
  })
})
