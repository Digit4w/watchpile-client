import { describe, expect, it } from 'vitest'
import { showsCounter } from './shows-counter'

describe('showsCounter', () => {
  it('nega quando o TIPO não conta, qualquer que seja o total', () => {
    expect(showsCounter({ typeCounts: false, total: null })).toBe(false)
    expect(showsCounter({ typeCounts: false, total: 1 })).toBe(false)
    // Alcançável: `asks_total` sobrevive ligado num tipo que não conta, então
    // uma obra antiga pode ter total gravado. O tipo continua mandando.
    expect(showsCounter({ typeCounts: false, total: 24 })).toBe(false)
  })

  it('nega quando a OBRA tem uma unidade só, mesmo num tipo que conta', () => {
    // O caso visto na tela: um jogo com `total = 1` lia "− 1 / 1 +", que é a
    // pergunta do status escrita como contador.
    expect(showsCounter({ typeCounts: true, total: 1 })).toBe(false)
  })

  it('conta quando o total é conhecido e maior que um', () => {
    expect(showsCounter({ typeCounts: true, total: 2 })).toBe(true)
    expect(showsCounter({ typeCounts: true, total: 120 })).toBe(true)
  })

  it('conta quando o fim NÃO se sabe', () => {
    // `null` é o `12 / ?` da 3.11, e é o oposto de "não há o que contar":
    // há, e não se sabe quanto. Confundir os dois tiraria o contador de todo
    // mangá em publicação.
    expect(showsCounter({ typeCounts: true, total: null })).toBe(true)
  })
})
