import { describe, expect, it } from 'vitest'
import { gridSlice } from './grid-window'

/** A carta padrão de `/library`: 133,33px de coluna mínima e `gap-4`. */
const CARD = { rowHeight: 200, gap: 16 }

describe('gridSlice', () => {
  it('says nothing needs mounting when the list is empty', () => {
    const slice = gridSlice({
      count: 0,
      columns: 4,
      ...CARD,
      scrollTop: 0,
      viewport: 800,
    })
    expect(slice).toEqual({
      first: 0,
      count: 0,
      padTop: 0,
      padBottom: 0,
      totalHeight: 0,
    })
  })

  /**
   * A invariante que sustenta a barra de rolagem: os dois vãos mais o que foi
   * montado somam a altura da lista inteira. Se ela falhar, rolar muda o
   * tamanho da barra e a posição foge da mão de quem arrasta.
   *
   * Conferida ao longo de toda a rolagem, e não num ponto escolhido: o defeito
   * que ela pega — um gap sobrando no fim — só aparece na última linha.
   */
  it('keeps the two pads plus the mounted rows equal to the full height', () => {
    const count = 1200
    const columns = 6
    const rows = Math.ceil(count / columns)
    const step = CARD.rowHeight + CARD.gap

    for (let scrollTop = 0; scrollTop <= rows * step; scrollTop += 137) {
      const slice = gridSlice({
        count,
        columns,
        ...CARD,
        scrollTop,
        viewport: 900,
      })

      const mountedRows = Math.ceil(slice.count / columns)
      const rendered = mountedRows > 0 ? mountedRows * step - CARD.gap : 0

      expect(slice.padTop + rendered + slice.padBottom).toBe(slice.totalHeight)
    }
  })

  it('measures the whole list, not the mounted slice', () => {
    const slice = gridSlice({
      count: 1200,
      columns: 6,
      ...CARD,
      scrollTop: 0,
      viewport: 900,
    })

    // 200 linhas de 216 menos o gap que a última não tem
    expect(slice.totalHeight).toBe(200 * 216 - 16)
    expect(slice.count).toBeLessThan(1200)
  })

  /**
   * A fatia começa sempre no começo de uma linha. Sem isso a grade anda de
   * lado ao rolar: a primeira carta montada cairia numa coluna do meio e todas
   * as outras deslizariam junto.
   */
  it('starts the slice on a row boundary, at every scroll position', () => {
    for (let scrollTop = 0; scrollTop < 9000; scrollTop += 53) {
      const slice = gridSlice({
        count: 1200,
        columns: 5,
        ...CARD,
        scrollTop,
        viewport: 700,
      })
      expect(slice.first % 5).toBe(0)
    }
  })

  it('mounts only what the viewport and the overscan ask for', () => {
    const slice = gridSlice({
      count: 1200,
      columns: 6,
      ...CARD,
      scrollTop: 0,
      viewport: 900,
      overscan: 2,
    })

    // 900px de dobra cobre 5 linhas (⌈900/216⌉), mais 2 de overscan = 7
    expect(slice.count).toBe(7 * 6)
    expect(slice.first).toBe(0)
    expect(slice.padTop).toBe(0)
  })

  /**
   * Overscan zero e overscan dois têm que dar fatias DIFERENTES — senão o
   * parâmetro não faz nada e o teste acima estaria medindo outra coisa.
   */
  it('actually spends the overscan', () => {
    const base = {
      count: 1200,
      columns: 6,
      ...CARD,
      scrollTop: 4000,
      viewport: 900,
    }
    const tight = gridSlice({ ...base, overscan: 0 })
    const loose = gridSlice({ ...base, overscan: 2 })

    expect(loose.count).toBeGreaterThan(tight.count)
    expect(loose.first).toBeLessThan(tight.first)
  })

  it('treats a grid still below the fold as not scrolled', () => {
    const above = gridSlice({
      count: 1200,
      columns: 6,
      ...CARD,
      scrollTop: -350,
      viewport: 900,
    })
    const atTop = gridSlice({
      count: 1200,
      columns: 6,
      ...CARD,
      scrollTop: 0,
      viewport: 900,
    })

    expect(above).toEqual(atTop)
  })

  /**
   * A última linha quase nunca está cheia, e pedir `lastRow * columns` itens
   * dela leria além do fim da lista.
   */
  it('stops at the last item when the final row is short', () => {
    const slice = gridSlice({
      count: 1201,
      columns: 6,
      ...CARD,
      scrollTop: 999_999,
      viewport: 900,
    })

    expect(slice.first + slice.count).toBe(1201)
    expect(slice.padBottom).toBe(0)
  })

  /**
   * Lista é grade de uma coluna — os dois modos de lista de `/library` passam
   * por aqui com `columns: 1` e o gap zerado, e não por uma segunda conta.
   */
  it('serves a plain list as a one-column grid', () => {
    const slice = gridSlice({
      count: 1200,
      columns: 1,
      rowHeight: 56,
      gap: 0,
      scrollTop: 0,
      viewport: 560,
    })

    expect(slice.totalHeight).toBe(1200 * 56)
    expect(slice.count).toBe(14) // 10 de dobra + 4 de overscan
    expect(slice.first).toBe(0)
  })
})
