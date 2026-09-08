import { describe, expect, it } from 'vitest'
import type { MediaTypeInfo } from '@/domain/media-type'
import type { Provider } from '@/services/providers'
import { defaultScope, effectiveSource, sourcesByType } from './search-scope'

function provider(slug: string, name: string): Provider {
  return { slug, name } as Provider
}

function type(
  slug: string,
  providers: string[] = [],
  effectiveProvider: string | null = null,
): MediaTypeInfo {
  return { slug, providers, effectiveProvider } as MediaTypeInfo
}

const TYPES = [type('movie'), type('tv'), type('anime'), type('manga')]

describe('quais fontes servem cada tipo', () => {
  it('mapeia pro NOME do provedor, não pro slug', () => {
    // Slug é chave; o nome é o que vai pra tela (design system, sexta leva).
    const map = sourcesByType(
      [type('movie', ['tmdb'])],
      [provider('tmdb', 'TMDB')],
    )
    expect(map.get('movie')?.current).toEqual({ slug: 'tmdb', name: 'TMDB' })
  })

  it('com dois provedores, quem responde é o CANÔNICO — não o primeiro por slug', () => {
    // O defeito de 02/09/2026: o servidor escolhia por `default_provider_slug`
    // e a tela por alfabeto, então o menu dizia "Jikan" e o Kitsu respondia.
    const map = sourcesByType(
      [type('anime', ['jikan', 'kitsu'], 'kitsu')],
      [provider('jikan', 'Jikan (MyAnimeList)'), provider('kitsu', 'Kitsu')],
    )
    expect(map.get('anime')?.current.slug).toBe('kitsu')
  })

  it('sem provedor padrão, o primeiro por SLUG — que é onde o servidor também cai', () => {
    const map = sourcesByType(
      [type('anime', ['kitsu', 'jikan'], null)],
      [provider('jikan', 'Jikan (MyAnimeList)'), provider('kitsu', 'Kitsu')],
    )
    expect(map.get('anime')?.current.slug).toBe('jikan')
  })

  it('as opções vêm ordenadas por slug, a mesma ordem do desempate', () => {
    const map = sourcesByType(
      [type('anime', ['kitsu', 'jikan'], 'kitsu')],
      [provider('jikan', 'Jikan (MyAnimeList)'), provider('kitsu', 'Kitsu')],
    )
    expect(map.get('anime')?.options.map((o) => o.slug)).toEqual([
      'jikan',
      'kitsu',
    ])
  })

  it('provedor associado que a tela não conhece cai fora, em vez de virar item sem rótulo', () => {
    const map = sourcesByType(
      [type('anime', ['jikan', 'fantasma'], null)],
      [provider('jikan', 'Jikan (MyAnimeList)')],
    )
    expect(map.get('anime')?.options.map((o) => o.slug)).toEqual(['jikan'])
  })

  it('efetivo apontando pra um que a tela não conhece cai na primeira opção real', () => {
    const map = sourcesByType(
      [type('anime', ['jikan', 'fantasma'], 'fantasma')],
      [provider('jikan', 'Jikan (MyAnimeList)')],
    )
    expect(map.get('anime')?.current.slug).toBe('jikan')
  })

  it('tipo sem provedor NÃO entra no mapa — é a ausência que diz "não há onde buscar"', () => {
    const map = sourcesByType([type('game', [])], [provider('tmdb', 'TMDB')])
    expect(map.has('game')).toBe(false)
  })

  it('sem provedor nenhum, mapa vazio — a instalação recém-criada', () => {
    expect(sourcesByType(TYPES, []).size).toBe(0)
  })
})

describe('qual fonte de fato responde', () => {
  const sources = {
    current: { slug: 'kitsu', name: 'Kitsu' },
    options: [
      { slug: 'jikan', name: 'Jikan (MyAnimeList)' },
      { slug: 'kitsu', name: 'Kitsu' },
    ],
  }

  it('sem pedido, a que manda', () => {
    expect(effectiveSource(sources, null)?.slug).toBe('kitsu')
  })

  it('com pedido válido, a pedida', () => {
    expect(effectiveSource(sources, 'jikan')?.slug).toBe('jikan')
  })

  it('pedido que não serve o tipo cai na que manda, e não some', () => {
    // O servidor recusa `provider` inválido com 400: a tela não pode prometer
    // uma fonte que a consulta vai recusar.
    expect(effectiveSource(sources, 'tmdb')?.slug).toBe('kitsu')
  })

  it('tipo sem fonte é nulo', () => {
    expect(effectiveSource(null, 'jikan')).toBeNull()
  })
})

describe('o escopo padrão', () => {
  const source = (slug: string): [string, unknown] => [slug, {}]

  it('abre no primeiro tipo que TEM fonte, não no primeiro do vocabulário', () => {
    expect(defaultScope(TYPES, new Map([source('tv')]))).toBe('tv')
  })

  it('respeita a ordem do vocabulário entre os que têm fonte', () => {
    expect(defaultScope(TYPES, new Map([source('tv'), source('movie')]))).toBe(
      'movie',
    )
  })

  it('sem nenhum com fonte, cai no primeiro — a explicação precisa de um escopo', () => {
    expect(defaultScope(TYPES, new Map())).toBe('movie')
  })

  it('sem vocabulário nenhum, nulo', () => {
    expect(defaultScope([], new Map())).toBeNull()
  })
})
