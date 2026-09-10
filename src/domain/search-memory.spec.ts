import { describe, expect, it } from 'vitest'
import { rememberedType } from './search-memory'
import type { TypeSources } from './search-scope'

const jikan = { slug: 'jikan', name: 'Jikan' }
const kitsu = { slug: 'kitsu', name: 'Kitsu' }
const tmdb = { slug: 'tmdb', name: 'TMDB' }

const SOURCES: ReadonlyMap<string, TypeSources> = new Map([
  ['anime', { current: kitsu, options: [jikan, kitsu] }],
  ['movie', { current: tmdb, options: [tmdb] }],
])

const guardado = (value: unknown) => JSON.stringify(value)

describe('rememberedType', () => {
  it('devolve o tipo guardado quando ele ainda é oferecido', () => {
    expect(rememberedType(guardado('anime'), SOURCES)).toBe('anime')
  })

  it('esquece o tipo que não é mais oferecido', () => {
    // O admin apagou o tipo, ou o leitor o escondeu em YOU/Preferences
    // (04/09) — semear o escopo com ele abriria a busca num tipo fantasma.
    expect(rememberedType(guardado('manga'), SOURCES)).toBeNull()
  })

  it('esquece o tipo que existe mas ficou sem FONTE', () => {
    // Mesmo argumento de `defaultScope`: abrir num tipo sem provedor mostra
    // uma explicação no lugar de um campo pronto, e quem clicou em `Search`
    // quer buscar.
    const semFonte: ReadonlyMap<string, TypeSources> = new Map([
      ['movie', { current: tmdb, options: [tmdb] }],
    ])
    expect(rememberedType(guardado('anime'), semFonte)).toBeNull()
  })

  it('lê o formato ANTIGO e descarta a fonte que vinha nele', () => {
    // O `localStorage` sobrevive a uma release: quem usou o app antes de
    // 10/09 tem o par gravado, e ler isso como "não sei" mandaria de volta ao
    // padrão exatamente quem o remendo veio servir.
    expect(
      rememberedType(guardado({ type: 'anime', provider: 'jikan' }), SOURCES),
    ).toBe('anime')
  })

  it('não promove a fonte do formato antigo, nem quando ela ainda vale', () => {
    // Ela era do APARELHO e virou preferência de CONTA. Promovê-la aqui
    // escreveria na conta uma escolha feita noutro navegador — e a conta é o
    // que atravessa os dois.
    expect(rememberedType(guardado({ type: 'anime' }), SOURCES)).toBe('anime')
  })

  it('devolve nulo pra tudo que não é uma das duas formas', () => {
    // O storage é editável: um valor quebrado não pode custar mais que um
    // padrão.
    const lixo = [
      null,
      '',
      '{',
      'anime',
      guardado(null),
      guardado([]),
      guardado({}),
      guardado(''),
      guardado(42),
      guardado({ type: '' }),
      guardado({ type: 42 }),
    ]
    for (const raw of lixo) {
      expect(rememberedType(raw, SOURCES)).toBeNull()
    }
  })

  it('não confia num vocabulário vazio', () => {
    // Enquanto as duas consultas não chegaram, `sourceByType` está vazio — e o
    // tipo guardado não pode valer, senão a tela abriria num escopo que ela
    // ainda não sabe se existe. É o mesmo motivo pelo qual a oferta de tipos é
    // VAZIA e não é tudo antes de a preferência chegar (04/09).
    expect(rememberedType(guardado('anime'), new Map())).toBeNull()
  })
})
