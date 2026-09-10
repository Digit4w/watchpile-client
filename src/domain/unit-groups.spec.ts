import { describe, expect, it } from 'vitest'
import { unitGroupSummary } from './unit-groups'

const seasons = [{ number: 1 }, { number: 2 }, { number: 3 }]

describe('unitGroupSummary', () => {
  it('junta o rótulo do par com a contagem', () => {
    expect(unitGroupSummary({ groups: seasons, label: 'Seasons' })).toEqual({
      label: 'Seasons',
      count: 3,
    })
  })

  it('devolve NULO sem grupos', () => {
    expect(unitGroupSummary({ groups: [], label: 'Seasons' })).toBeNull()
  })

  it('devolve NULO com grupos e sem rótulo, e isso é decisão', () => {
    // A tela não inventa um coletivo: um cabeçalho que o produto escreveu sobre
    // uma lista que o provedor organizou é a mesma mentira que `Seasons` num
    // mangá, com outra palavra.
    expect(unitGroupSummary({ groups: seasons, label: null })).toBeNull()
  })

  it('não conta o grupo ZERO', () => {
    // Numeração começa em 1, e os especiais do TMDB voltam como
    // `season_number: 0` — contá-los diria que Breaking Bad tem seis
    // temporadas. Mesma exclusão que o contador já faz.
    expect(
      unitGroupSummary({
        groups: [{ number: 0 }, ...seasons],
        label: 'Seasons',
      }),
    ).toEqual({ label: 'Seasons', count: 3 })
  })

  it('um grupo zero SOZINHO ainda dá seção, com contagem zero', () => {
    // Ele existe na lista e a pessoa pode abri-lo — o que ele não faz é entrar
    // na conta. Sumir com a seção esconderia os especiais.
    expect(
      unitGroupSummary({ groups: [{ number: 0 }], label: 'Seasons' }),
    ).toEqual({ label: 'Seasons', count: 0 })
  })
})
