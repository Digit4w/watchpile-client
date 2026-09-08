import { describe, expect, it } from 'vitest'
import { defaultGroup, unitOffset } from './unit-offset'

const TEMPORADAS = [
  { number: 1, count: 7 },
  { number: 2, count: 13 },
  { number: 3, count: 10 },
]

describe('unitOffset', () => {
  it('o primeiro grupo começa em zero', () => {
    expect(unitOffset(TEMPORADAS, 1)).toBe(0)
  })

  it('soma o que veio antes, e só o que veio antes', () => {
    expect(unitOffset(TEMPORADAS, 2)).toBe(7)
    expect(unitOffset(TEMPORADAS, 3)).toBe(20)
  })

  /**
   * O caso que quase passou: o TMDB numera especiais como temporada 0, e ela
   * vem antes da 1 na ordem numérica. Somá-la deslocaria a série inteira — o
   * contador conta a sequência principal, sem os especiais.
   */
  it('o grupo zero fica FORA da conta, e não desloca o resto', () => {
    const withSpecials = [{ number: 0, count: 4 }, ...TEMPORADAS]
    expect(unitOffset(withSpecials, 1)).toBe(0)
    expect(unitOffset(withSpecials, 2)).toBe(7)
  })

  /** E ele próprio não tem posição no contador: melhor não marcar que errar. */
  it('o grupo zero não tem offset', () => {
    expect(unitOffset([{ number: 0, count: 4 }], 0)).toBeNull()
  })

  /**
   * Sem contagem não há tradução possível, e inventar marcaria o episódio
   * errado — que é pior que não marcar.
   */
  it('devolve nulo quando um grupo anterior não diz quantas unidades tem', () => {
    const incomplete = [
      { number: 1, count: null },
      { number: 2, count: 13 },
    ]
    expect(unitOffset(incomplete, 2)).toBeNull()
  })

  it('o primeiro grupo não depende de contagem nenhuma', () => {
    const incomplete = [{ number: 1, count: null }]
    expect(unitOffset(incomplete, 1)).toBe(0)
  })

  it('grupo que não está na lista soma o que houver antes dele', () => {
    expect(unitOffset(TEMPORADAS, 9)).toBe(30)
  })

  it('lista vazia é zero, não erro', () => {
    expect(unitOffset([], 1)).toBe(0)
  })
})

describe('defaultGroup', () => {
  /**
   * O defeito visto na tela: com os especiais em grupo 0, "o primeiro da
   * lista" abria a série nos extras.
   */
  it('abre no primeiro da sequência principal, não nos especiais', () => {
    expect(defaultGroup([{ number: 0 }, { number: 1 }, { number: 2 }])).toBe(1)
  })

  it('não depende da ordem em que o provedor mandou', () => {
    expect(defaultGroup([{ number: 3 }, { number: 1 }, { number: 0 }])).toBe(1)
  })

  it('cai nos especiais quando não há mais nada', () => {
    expect(defaultGroup([{ number: 0 }])).toBe(0)
  })

  it('sem grupos, não há grupo', () => {
    expect(defaultGroup([])).toBeNull()
  })
})
