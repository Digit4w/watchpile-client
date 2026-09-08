import { describe, expect, it } from 'vitest'
import { centeredSquare, clampSquare, dragToImageScale } from './cover'

describe('centeredSquare', () => {
  it('takes the whole image when it is already square', () => {
    expect(centeredSquare(400, 400)).toEqual({ x: 0, y: 0, size: 400 })
  })

  it('centres horizontally on a landscape image', () => {
    expect(centeredSquare(1000, 400)).toEqual({ x: 300, y: 0, size: 400 })
  })

  it('centres vertically on a portrait image', () => {
    expect(centeredSquare(400, 1000)).toEqual({ x: 0, y: 300, size: 400 })
  })

  /**
   * Uma folga ímpar não divide em dois — arredondar para cima num lado e para
   * baixo no outro deixaria o quadrado a meio pixel, e o canvas desenharia uma
   * borda borrada que ninguém pediu.
   */
  it('rounds an odd margin instead of leaving half a pixel', () => {
    expect(centeredSquare(401, 400)).toEqual({ x: 1, y: 0, size: 400 })
  })
})

describe('clampSquare', () => {
  it('leaves a square that is already inside alone', () => {
    const rect = { x: 100, y: 0, size: 400 }
    expect(clampSquare(rect, 1000, 400)).toEqual(rect)
  })

  /**
   * Prender e não recusar: quem arrasta até a borda quer o canto, e um
   * enquadramento que trava um pixel antes dele se lê como defeito.
   */
  it('pins to the edge instead of refusing an overshooting drag', () => {
    expect(clampSquare({ x: 5000, y: 0, size: 400 }, 1000, 400)).toEqual({
      x: 600,
      y: 0,
      size: 400,
    })
    expect(clampSquare({ x: -80, y: 0, size: 400 }, 1000, 400)).toEqual({
      x: 0,
      y: 0,
      size: 400,
    })
  })

  it('has nowhere to move on the axis with no slack', () => {
    expect(clampSquare({ x: 100, y: 90, size: 400 }, 1000, 400).y).toBe(0)
  })

  /**
   * A imagem menor que o quadrado pedido é caso normal, não borda: alguém sobe
   * um ícone de 120px. O quadrado encolhe até caber, e é o `COVER_SIZE` da
   * escrita que decide o tamanho final do arquivo.
   */
  it('shrinks the square to fit an image smaller than it', () => {
    expect(clampSquare({ x: 0, y: 0, size: 400 }, 120, 120)).toEqual({
      x: 0,
      y: 0,
      size: 120,
    })
  })
})

describe('dragToImageScale', () => {
  it('moves the crop by image pixels, not screen pixels', () => {
    // Prévia de 200px sobre um recorte de 4000: um pixel de dedo anda 20 de imagem.
    expect(dragToImageScale({ x: 0, y: 0, size: 4000 }, 200)).toBe(20)
  })

  it('is one to one when the preview matches the crop', () => {
    expect(dragToImageScale({ x: 0, y: 0, size: 200 }, 200)).toBe(1)
  })
})
