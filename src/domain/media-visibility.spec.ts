import { describe, expect, it } from 'vitest'
import { offeredTypes } from './media-visibility'

const TYPES = [
  { slug: 'movie' },
  { slug: 'tv' },
  { slug: 'game' },
  { slug: 'book' },
]

function slugs(list: { slug: string }[]) {
  return list.map(({ slug }) => slug)
}

describe('offeredTypes', () => {
  it('offers everything when nothing is hidden', () => {
    expect(slugs(offeredTypes(TYPES, []))).toEqual([
      'movie',
      'tv',
      'game',
      'book',
    ])
  })

  it('drops what the reader hid', () => {
    expect(slugs(offeredTypes(TYPES, ['game', 'book']))).toEqual([
      'movie',
      'tv',
    ])
  })

  it('keeps the order the vocabulary came in', () => {
    expect(slugs(offeredTypes(TYPES, ['tv']))).toEqual([
      'movie',
      'game',
      'book',
    ])
  })

  /**
   * A regra que o módulo existe pra guardar: um recorte ligado não pode sumir
   * do controle que o desfaz.
   */
  it('keeps a hidden type that is the active choice', () => {
    expect(slugs(offeredTypes(TYPES, ['game'], 'game'))).toEqual([
      'movie',
      'tv',
      'game',
      'book',
    ])
  })

  it('keeps every hidden type that is part of a multiple choice', () => {
    expect(slugs(offeredTypes(TYPES, ['game', 'book'], ['book']))).toEqual([
      'movie',
      'tv',
      'book',
    ])
  })

  it('ignores a choice that is not hidden, and one that does not exist', () => {
    expect(slugs(offeredTypes(TYPES, ['game'], 'movie'))).toEqual([
      'movie',
      'tv',
      'book',
    ])
    expect(slugs(offeredTypes(TYPES, ['game'], 'podcast'))).toEqual([
      'movie',
      'tv',
      'book',
    ])
  })
})
