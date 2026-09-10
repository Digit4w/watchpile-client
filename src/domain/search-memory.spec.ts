import { describe, expect, it } from 'vitest'
import { rememberedScope } from './search-memory'
import type { TypeSources } from './search-scope'

const jikan = { slug: 'jikan', name: 'Jikan' }
const kitsu = { slug: 'kitsu', name: 'Kitsu' }
const tmdb = { slug: 'tmdb', name: 'TMDB' }

const SOURCES: ReadonlyMap<string, TypeSources> = new Map([
  ['anime', { current: kitsu, options: [jikan, kitsu] }],
  ['movie', { current: tmdb, options: [tmdb] }],
])

const guardado = (value: unknown) => JSON.stringify(value)

describe('rememberedScope', () => {
  it('devolve o par guardado quando os dois ainda valem', () => {
    expect(
      rememberedScope(guardado({ type: 'anime', provider: 'jikan' }), SOURCES),
    ).toEqual({ type: 'anime', provider: 'jikan' })
  })

  it('aceita o tipo sem fonte escolhida', () => {
    // Quem nunca trocou de fonte tem só o tipo — e é o caso comum.
    expect(
      rememberedScope(guardado({ type: 'movie', provider: null }), SOURCES),
    ).toEqual({ type: 'movie', provider: null })
  })

  it('esquece o tipo que não é mais oferecido', () => {
    // O admin apagou o tipo, ou o leitor o escondeu em YOU/Preferences
    // (04/09) — semear o escopo com ele abriria a busca num tipo fantasma.
    expect(
      rememberedScope(guardado({ type: 'manga', provider: 'kitsu' }), SOURCES),
    ).toBeNull()
  })

  it('esquece a FONTE que não serve mais aquele tipo, mas guarda o tipo', () => {
    // O slug de um provedor só é legível dentro do par (brief, 3.10). Nulo cai
    // na fonte efetiva, que é a resposta certa — pedir um par que o servidor
    // recusa com 400 não é.
    expect(
      rememberedScope(guardado({ type: 'anime', provider: 'tmdb' }), SOURCES),
    ).toEqual({ type: 'anime', provider: null })
  })

  it('devolve nulo pra tudo que não é a forma esperada', () => {
    // O storage é editável e sobrevive a uma versão em que o formato era
    // outro: um valor quebrado não pode custar mais que um padrão.
    const lixo = [
      null,
      '',
      'anime',
      '{',
      guardado(null),
      guardado([]),
      guardado({}),
      guardado({ type: '' }),
      guardado({ type: 42 }),
    ]
    for (const raw of lixo) {
      expect(rememberedScope(raw, SOURCES)).toBeNull()
    }
  })

  it('não confia num vocabulário vazio', () => {
    // Enquanto as duas consultas não chegaram, `sourceByType` está vazio — e o
    // par guardado não pode valer, senão a tela abriria num escopo que ela
    // ainda não sabe se existe. É o mesmo motivo pelo qual a oferta de tipos é
    // VAZIA e não é tudo antes de a preferência chegar (04/09).
    expect(
      rememberedScope(
        guardado({ type: 'anime', provider: 'jikan' }),
        new Map(),
      ),
    ).toBeNull()
  })
})
