import { describe, expect, it } from 'vitest'
import { minutesFrom, splitMinutes } from './time-spent'

describe('minutesFrom', () => {
  it('soma as duas caixas', () => {
    expect(minutesFrom({ hours: '2', minutes: '30' })).toBe(150)
    expect(minutesFrom({ hours: '38', minutes: '0' })).toBe(2280)
  })

  it('conta a caixa vazia como zero quando a outra tem valor', () => {
    // Quem escreve 38 em horas e deixa minutos em branco quis dizer 38h.
    expect(minutesFrom({ hours: '38', minutes: '' })).toBe(2280)
    expect(minutesFrom({ hours: '', minutes: '45' })).toBe(45)
  })

  it('devolve NULO com as duas vazias, que é como se apaga', () => {
    // Nulo é o "nunca registrou" da coluna, e é diferente de zero.
    expect(minutesFrom({ hours: '', minutes: '' })).toBeNull()
    expect(minutesFrom({ hours: '  ', minutes: '' })).toBeNull()
  })

  it('aceita zero explícito, que NÃO é o mesmo que vazio', () => {
    expect(minutesFrom({ hours: '0', minutes: '0' })).toBe(0)
  })

  it('deixa passar minuto acima de 59, e isso é decisão', () => {
    // Quem digita 90 quis dizer uma hora e meia; recusar seria a tela cobrando
    // uma conversão que ela sabe fazer.
    expect(minutesFrom({ hours: '0', minutes: '90' })).toBe(90)
    expect(minutesFrom({ hours: '1', minutes: '90' })).toBe(150)
  })

  it('recusa o que não é inteiro não negativo', () => {
    for (const fields of [
      { hours: '2.5', minutes: '' },
      { hours: '-1', minutes: '' },
      { hours: 'abc', minutes: '' },
      { hours: '', minutes: '1.5' },
      { hours: '', minutes: '-30' },
    ]) {
      expect(minutesFrom(fields)).toBeNull()
    }
  })
})

describe('splitMinutes', () => {
  it('reparte o total nas duas caixas', () => {
    expect(splitMinutes(150)).toEqual({ hours: '2', minutes: '30' })
    expect(splitMinutes(2280)).toEqual({ hours: '38', minutes: '0' })
    expect(splitMinutes(45)).toEqual({ hours: '0', minutes: '45' })
  })

  it('devolve VAZIO para nulo, e não zero', () => {
    // Zero é "registrei, e é zero" — desenhá-lo em toda obra nova diria que
    // alguém registrou.
    expect(splitMinutes(null)).toEqual({ hours: '', minutes: '' })
  })

  it('atravessa de ida e volta sem perder nada', () => {
    // É o que uma caixa de horas com decimal NÃO faria: `2h05` são 2,083 horas,
    // e mostrar 2,1 de volta seria a tela mentindo sobre o que está gravado.
    for (const total of [0, 5, 59, 60, 65, 150, 2280, 2295]) {
      expect(minutesFrom(splitMinutes(total))).toBe(total)
    }
  })
})
