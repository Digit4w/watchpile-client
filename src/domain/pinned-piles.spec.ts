import { describe, expect, it } from 'vitest'
import type { Pile } from './media'
import { pinnedPiles } from './pinned-piles'

const pile = (id: number, name: string, pinnedAt: string | null): Pile =>
  ({ id, name, pinnedAt }) as unknown as Pile

describe('pinnedPiles', () => {
  it('fica só com as fixadas', () => {
    expect(
      pinnedPiles([
        pile(1, 'Backlog', null),
        pile(2, 'Comfort watch', '2026-09-01T00:00:00.000Z'),
      ]).map(({ id }) => id),
    ).toEqual([2])
  })

  it('ordena por quem fixou PRIMEIRO, e não por nome', () => {
    // A lista não pode dançar quando outra pilha entra — e ordenar por nome
    // mudaria de lugar um alvo que a pessoa já sabia onde estava, só porque
    // alguém renomeou a pilha.
    expect(
      pinnedPiles([
        pile(1, 'Zelda', '2026-09-01T00:00:00.000Z'),
        pile(2, 'Anime', '2026-09-05T00:00:00.000Z'),
      ]).map(({ name }) => name),
    ).toEqual(['Zelda', 'Anime'])
  })

  it('aguenta a consulta que ainda não chegou', () => {
    // `undefined` é o cache vazio, e é o primeiro quadro de toda tela.
    expect(pinnedPiles(undefined)).toEqual([])
    expect(pinnedPiles([])).toEqual([])
  })
})
