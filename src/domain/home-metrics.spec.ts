import { describe, expect, it } from 'vitest'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  contentHeight,
  contentRows,
  GRID_GAP,
  LIST_ROW_HEIGHT,
  metricsFor,
  ROW_PITCH,
  rowsPerContentRow,
  snapHeight,
  WIDGET_CHROME,
} from './home-metrics'

/**
 * O encaixe é uma propriedade dos NÚMEROS, não do componente — o que estes
 * testes protegem é a invariante que some em silêncio: mudar o padding do
 * widget, a altura da carta ou o gap da grade e só descobrir meses depois que
 * a última fileira voltou a ficar cortada.
 */
describe('as alturas do sistema fecham em linha inteira', () => {
  it.each([
    ['linha de lista', LIST_ROW_HEIGHT],
    ['carta de pôster', CARD_HEIGHT],
  ])('%s ocupa um número inteiro de linhas', (_name, height) => {
    expect(Number.isInteger(rowsPerContentRow(height))).toBe(true)
  })

  it('o chrome do widget vale exatamente uma linha', () => {
    // É esta igualdade que faz `n·(H + GAP) = PITCH·(h − 1)`. Sem ela nenhuma
    // das outras contas fecha.
    expect(WIDGET_CHROME).toBe(ROW_PITCH)
  })

  it('a carta é 2:3 exato', () => {
    expect(CARD_WIDTH / CARD_HEIGHT).toBeCloseTo(2 / 3, 10)
  })
})

describe('contentRows', () => {
  it.each([
    [3, 2],
    [4, 3],
    [5, 4],
    [10, 9],
  ])('lista de h=%i mostra %i linhas', (h, expected) => {
    expect(contentRows(h, LIST_ROW_HEIGHT)).toBe(expected)
  })

  it.each([
    [4, 1],
    [7, 2],
    [10, 3],
  ])('grade de h=%i mostra %i fileiras', (h, expected) => {
    expect(contentRows(h, CARD_HEIGHT)).toBe(expected)
  })

  it('as fileiras preenchem o conteúdo sem sobra nem falta', () => {
    for (const h of [4, 7, 10, 13]) {
      const n = contentRows(h, CARD_HEIGHT)
      const used = n * CARD_HEIGHT + (n - 1) * GRID_GAP
      expect(used).toBe(contentHeight(h))
    }
  })

  it('o mesmo vale pra lista, em todo h a partir do mínimo', () => {
    for (let h = 3; h <= 20; h++) {
      const n = contentRows(h, LIST_ROW_HEIGHT)
      const used = n * LIST_ROW_HEIGHT + (n - 1) * GRID_GAP
      expect(used).toBe(contentHeight(h))
    }
  })
})

describe('snapHeight', () => {
  it('lista para em qualquer linha — o passo dela é 1', () => {
    for (let h = 3; h <= 12; h++) {
      expect(snapHeight(h, 'list')).toBe(h)
    }
  })

  it.each([
    [4, 4],
    [5, 4],
    [6, 4],
    [7, 7],
    [8, 7],
    [9, 7],
    [10, 10],
  ])('grade pedindo h=%i para em %i', (requested, expected) => {
    expect(snapHeight(requested, 'grid')).toBe(expected)
  })

  it('nunca arredonda pra cima: quem chamou já limitou pelo vizinho', () => {
    for (let h = 4; h <= 30; h++) {
      expect(snapHeight(h, 'grid')).toBeLessThanOrEqual(h)
    }
  })

  it('todo resultado da grade é uma altura que encaixa exata', () => {
    for (let h = 4; h <= 30; h++) {
      expect(
        Number.isInteger(contentRows(snapHeight(h, 'grid'), CARD_HEIGHT)),
      ).toBe(true)
    }
  })

  it('scroll trava numa fileira só — é a definição do tipo', () => {
    for (const h of [4, 5, 6, 7, 12]) {
      expect(snapHeight(h, 'scroll')).toBe(4)
    }
  })

  it('devolve o pedido quando nem a menor altura válida cabe', () => {
    // Vizinho colado embaixo: `clampResize` já cortou pra 2, e forçar 4 aqui
    // sobreporia os dois. Fora de encaixe é feio; sobreposto é bug.
    expect(snapHeight(2, 'grid')).toBe(2)
    expect(snapHeight(3, 'scroll')).toBe(3)
  })

  it('respeita o mínimo de cada tipo', () => {
    expect(metricsFor('list').minH).toBe(3)
    expect(metricsFor('grid').minH).toBe(4)
    expect(snapHeight(metricsFor('grid').minH, 'grid')).toBe(4)
  })
})
