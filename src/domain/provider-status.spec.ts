import { describe, expect, it } from 'vitest'
import type { Provider } from '@/services/providers'
import { conditionOf, pendingCount } from './provider-status'

type Credential = Provider['credentials'][number]

function credential(source: Credential['source']): Credential {
  return {
    key: 'api_key',
    label: 'API key',
    configured: source !== 'none',
    hint: null,
    source,
    overridden: source === 'env' || source === 'file',
  }
}

function provider(over: Partial<Provider> = {}): Provider {
  return {
    slug: 'tmdb',
    name: 'TMDB',
    baseUrl: 'https://api.themoviedb.org/3',
    attribution: null,
    authStyle: 'query-key',
    credentials: [credential('stored')],
    options: [],
    optionValues: {},
    mediaTypes: ['movie'],
    ready: true,
    ...over,
  }
}

describe('a condição de um provedor', () => {
  it('provedor configurado com chave própria não tem condição', () => {
    expect(conditionOf(provider())).toBeNull()
  })

  it('falta credencial', () => {
    expect(
      conditionOf(
        provider({ ready: false, credentials: [credential('none')] }),
      ),
    ).toBe('needs-credential')
  })

  it('roda na chave embutida', () => {
    // Não é defeito — é ambiente. Por isso é condição, e não erro.
    expect(
      conditionOf(provider({ credentials: [credential('embedded')] })),
    ).toBe('embedded-key')
  })

  it('provedor sem credencial declarada nasce sem condição', () => {
    // AniList e Open Library respondem requisição pública.
    expect(conditionOf(provider({ credentials: [] }))).toBeNull()
  })
})

describe('o contador do selo', () => {
  it('NÃO conta provedor que não serve tipo nenhum', () => {
    // Provedor sem tipo é ocioso, não quebrado: ele não afeta a busca de
    // ninguém, então a chave que falta nele não é pendência.
    const idle = provider({
      slug: 'comicvine',
      mediaTypes: [],
      ready: false,
      credentials: [credential('none')],
    })
    expect(pendingCount([idle])).toBe(0)
  })

  it('conta três em warning como DOIS quando um está fora de uso', () => {
    // É o caso do "cheio demais" do mockup, e o que prova que o número pode
    // chegar a zero.
    const list = [
      provider({ credentials: [credential('embedded')] }),
      provider({
        slug: 'igdb',
        mediaTypes: ['game'],
        ready: false,
        credentials: [credential('none')],
      }),
      provider({
        slug: 'comicvine',
        mediaTypes: [],
        ready: false,
        credentials: [credential('none')],
      }),
    ]
    expect(pendingCount(list)).toBe(2)
  })

  it('chega a ZERO quando tudo em uso está configurado', () => {
    // Se não chegasse, o selo ficaria aceso pra sempre e ensinaria a ser
    // ignorado — que é o defeito que o recorte existe pra evitar.
    expect(pendingCount([provider(), provider({ slug: 'anilist' })])).toBe(0)
  })

  it('lista vazia não acende nada', () => {
    expect(pendingCount([])).toBe(0)
  })
})
