import { describe, expect, it } from 'vitest'
import type { MediaTypeInfo } from './media-type'
import { linkableProviders } from './provider-recipes'

const type = (
  slug: string,
  plural: string,
  providers: string[],
): MediaTypeInfo =>
  ({ slug, name: plural, plural, providers }) as unknown as MediaTypeInfo

const VOCAB = [
  type('anime', 'Anime', ['anilist', 'kitsu', 'mal']),
  type('manga', 'Manga', ['anilist', 'kitsu', 'mal']),
  type('movie', 'Movies', ['tmdb']),
  type('light-novel', 'Light novels', []),
]

describe('linkableProviders', () => {
  it('oferece cada provedor com os tipos de onde copiar', () => {
    const offer = linkableProviders(VOCAB, 'light-novel')

    expect(offer.map((p) => p.slug)).toEqual([
      'anilist',
      'kitsu',
      'mal',
      'tmdb',
    ])
    expect(offer.find((p) => p.slug === 'anilist')?.sources).toEqual([
      { slug: 'anime', label: 'Anime' },
      { slug: 'manga', label: 'Manga' },
    ])
  })

  it('tira da oferta o provedor que JÁ serve este tipo', () => {
    // A lista é de quem pode ENTRAR. Trocar a receita de um par existente é
    // outro gesto, e ele parte da linha que já está lá.
    const offer = linkableProviders(VOCAB, 'anime')

    expect(offer.map((p) => p.slug)).toEqual(['tmdb'])
  })

  it('nunca oferece copiar do próprio tipo', () => {
    // Copiar de si mesmo não é receita nova, é um `UPDATE` que não muda nada — e
    // o servidor recusa com 400.
    const offer = linkableProviders(VOCAB, 'manga')

    for (const provider of offer) {
      expect(provider.sources.map((s) => s.slug)).not.toContain('manga')
    }
  })

  it('não oferece provedor que não serve tipo nenhum', () => {
    // Ele não está quebrado, está OCIOSO — e não tem receita a oferecer.
    const offer = linkableProviders(
      [type('anime', 'Anime', []), type('manga', 'Manga', [])],
      'manga',
    )

    expect(offer).toEqual([])
  })

  it('devolve vazio quando o tipo alvo nem existe no vocabulário', () => {
    // Acontece no intervalo entre duas consultas, e a régua de 04/09 vale:
    // enquanto não se sabe, a oferta é vazia e não é tudo.
    expect(linkableProviders([], 'light-novel')).toEqual([])
  })

  it('ordena por slug, que não muda com o idioma', () => {
    // Uma lista de escolha não pode se reordenar entre duas visitas, e o nome
    // é traduzível.
    const offer = linkableProviders(VOCAB, 'light-novel')

    expect(offer.map((p) => p.slug)).toEqual(
      [...offer.map((p) => p.slug)].sort(),
    )
  })
})
