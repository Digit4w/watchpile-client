import { describe, expect, it } from 'vitest'
import type { Pile } from './media'
import { identityOf } from './pile-view'

function pile(titles: string[]): Pile {
  return {
    id: 1,
    name: 'Currently watching',
    description: null,
    entryCount: titles.length,
    preview: titles.map((title, index) => ({ id: index + 1, title })),
    hasCover: false,
    removeWhenCompleted: false,
    pinnedAt: null,
    createdAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
  }
}

describe('identityOf', () => {
  /**
   * A capa vence os outros três, e vence inclusive um mosaico cheio: escolha
   * explícita vence derivação. O mosaico é o que a pilha É; a capa é o que
   * alguém decidiu que ela é.
   */
  it('lets an uploaded cover win over a full mosaic', () => {
    const withCover = { ...pile(['A', 'B', 'C', 'D']), hasCover: true }
    expect(identityOf(withCover).kind).toBe('cover')
  })

  it('falls back down the ladder when the cover is removed', () => {
    const withCover = { ...pile(['A', 'B', 'C', 'D']), hasCover: true }
    expect(identityOf({ ...withCover, hasCover: false }).kind).toBe('mosaic')
  })

  it('draws the neutral tile for a pile with nothing in it', () => {
    expect(identityOf(pile([])).kind).toBe('empty')
  })

  it('draws a single piece for one title', () => {
    expect(identityOf(pile(['Berserk'])).kind).toBe('single')
  })

  /**
   * O caso que a regra existe pra decidir. Com duas ou três obras o mosaico
   * ficaria com buraco, e o mockup registra que buraco fica pior que uma capa
   * cheia — então elas caem no mesmo desenho de uma obra só, não num 2×2
   * incompleto.
   */
  it.each([2, 3])('falls back to a single piece with %i titles', (count) => {
    const titles = ['Alpha', 'Bravo', 'Charlie'].slice(0, count)

    expect(identityOf(pile(titles))).toEqual({
      kind: 'single',
      title: 'Alpha',
    })
  })

  it('draws the 2x2 mosaic from exactly four titles', () => {
    expect(identityOf(pile(['Alpha', 'Bravo', 'Charlie', 'Delta']))).toEqual({
      kind: 'mosaic',
      pieces: [
        { id: 1, title: 'Alpha' },
        { id: 2, title: 'Bravo' },
        { id: 3, title: 'Charlie' },
        { id: 4, title: 'Delta' },
      ],
    })
  })

  /**
   * O servidor corta em quatro, mas a regra não depende disso: um cliente
   * velho contra um servidor que passe a mandar mais não pode desenhar uma
   * quinta peça dentro de um 2×2.
   */
  it('never uses more than four pieces', () => {
    const identity = identityOf(
      pile(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']),
    )

    expect(identity).toEqual({
      kind: 'mosaic',
      pieces: [
        { id: 1, title: 'Alpha' },
        { id: 2, title: 'Bravo' },
        { id: 3, title: 'Charlie' },
        { id: 4, title: 'Delta' },
      ],
    })
  })
})
