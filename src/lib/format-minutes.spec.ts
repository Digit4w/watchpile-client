import { describe, expect, it } from 'vitest'
import { formatMinutes } from './format'

describe('formatMinutes', () => {
  it('mostra só minutos abaixo de uma hora', () => {
    expect(formatMinutes(0)).toBe('0m')
    expect(formatMinutes(47)).toBe('47m')
    expect(formatMinutes(59)).toBe('59m')
  })

  it('mostra só a hora quando não sobra minuto', () => {
    // `2h00` só existe pra encher a casa, e o app não põe dígito de enfeite —
    // é a mesma régua do `12 / ?`.
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(120)).toBe('2h')
  })

  it('junta as duas, com o minuto em duas casas', () => {
    // DENTRO de uma hora o minuto é a fração, e fração sem casa fixa se lê como
    // outro número: `2h5` parece cinco de alguma coisa.
    expect(formatMinutes(65)).toBe('1h05')
    expect(formatMinutes(150)).toBe('2h30')
    expect(formatMinutes(2280)).toBe('38h')
    expect(formatMinutes(2295)).toBe('38h15')
  })

  it('aceita sufixo de fora, porque um dia haverá catálogo', () => {
    expect(formatMinutes(150, { hour: 'h', minute: 'min' })).toBe('2h30')
    expect(formatMinutes(47, { hour: 'h', minute: 'min' })).toBe('47min')
  })

  it('não deixa passar valor impossível', () => {
    // A coluna é inteira e não negativa, mas o número chega da REDE — e um
    // negativo aqui viraria `-1h-30`, que não é um tempo.
    expect(formatMinutes(-30)).toBe('0m')
    expect(formatMinutes(90.7)).toBe('1h30')
  })
})
