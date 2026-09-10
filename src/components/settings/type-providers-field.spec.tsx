import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MediaTypeInfo } from '@/domain/media-type'
import { HttpError } from '@/infra/lib/http-client'
import { render } from '@/test/render'
import { TypeProvidersField } from './type-providers-field'

/**
 * O controle que destrava tipo criado pelo admin (brief, 3.10).
 *
 * **A metade decidível já mora em `domain/`** — `linkableProviders` e
 * `pairInUseCount`, com specs. O que sobra aqui é o que não cabe lá:
 *
 * - vincular tem **DOIS passos**, e o segundo não pode ser escondido: quem
 *   escolhe um provedor está escolhendo um provedor **e um jeito de falar com
 *   ele**
 * - a recusa mora na **linha que a causou**, e não no topo do bloco
 * - sem provedor com receita a emprestar, o botão **não existe** — affordance
 *   descreve o que existe
 */
vi.mock('@/services/media-types', () => ({
  mediaTypesService: {
    list: vi.fn(),
    linkProvider: vi.fn(),
    unlinkProvider: vi.fn(),
  },
}))
vi.mock('@/services/providers', () => ({
  providersService: { list: vi.fn() },
}))

const { mediaTypesService } = await import('@/services/media-types')
const { providersService } = await import('@/services/providers')

const type = (slug: string, plural: string, providers: string[]) =>
  ({ slug, name: plural, plural, providers }) as unknown as MediaTypeInfo

const LIGHT_NOVEL = type('light-novel', 'Light novels', [])
const VOCAB = [
  type('anime', 'Anime', ['anilist']),
  type('manga', 'Manga', ['anilist']),
  type('movie', 'Movies', ['tmdb']),
  LIGHT_NOVEL,
]

const PROVIDERS = [
  { slug: 'anilist', name: 'AniList' },
  { slug: 'tmdb', name: 'TMDB' },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mediaTypesService.list).mockResolvedValue(
    VOCAB as unknown as Awaited<ReturnType<typeof mediaTypesService.list>>,
  )
  vi.mocked(providersService.list).mockResolvedValue(
    PROVIDERS as unknown as Awaited<ReturnType<typeof providersService.list>>,
  )
})

const add = () => screen.getByRole('button', { name: 'Add a provider' })

async function open(target: MediaTypeInfo = LIGHT_NOVEL) {
  const user = userEvent.setup()
  render(<TypeProvidersField type={target} />)
  await screen.findByRole('button', { name: 'Add a provider' })
  return { user }
}

describe('TypeProvidersField', () => {
  it('vincular tem DOIS passos: o provedor, e de qual tipo copiar', async () => {
    // Esconder o segundo passo faria a pessoa achar que escolheu um provedor
    // quando escolheu um provedor E um jeito de falar com ele — a junção carrega
    // o corpo da busca, o mapa de campos e o token.
    vi.mocked(mediaTypesService.linkProvider).mockResolvedValue(
      type('light-novel', 'Light novels', [
        'anilist',
      ]) as unknown as MediaTypeInfo,
    )
    const { user } = await open()

    await user.click(add())
    await user.click(screen.getByRole('button', { name: 'AniList' }))

    // O cabeçalho do segundo passo nomeia o provedor escolhido.
    expect(screen.getByText(/Serve it like — AniList/)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Manga' }))

    expect(mediaTypesService.linkProvider).toHaveBeenCalledWith(
      'light-novel',
      'anilist',
      'manga',
    )
  })

  it('só oferece copiar de tipos que AQUELE provedor já serve', async () => {
    // Uma receita que já responde por outro tipo é uma receita provada. `Movies`
    // não é servido pelo AniList, então copiar dele não é promessa nenhuma.
    const { user } = await open()

    await user.click(add())
    await user.click(screen.getByRole('button', { name: 'AniList' }))

    expect(screen.getByRole('button', { name: 'Anime' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Manga' })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Movies' }),
    ).not.toBeInTheDocument()
  })

  it('não oferece provedor que já serve este tipo', async () => {
    // A lista é de quem pode ENTRAR.
    const { user } = await open(type('anime', 'Anime', ['anilist']))

    await user.click(add())

    expect(
      screen.queryByRole('button', { name: 'AniList' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'TMDB' })).toBeVisible()
  })

  it('não desenha o botão quando não há receita a copiar', async () => {
    // Affordance descreve o que existe: um painel vazio seria pior que a frase.
    vi.mocked(mediaTypesService.list).mockResolvedValue([
      type('anime', 'Anime', []),
      LIGHT_NOVEL,
    ] as unknown as Awaited<ReturnType<typeof mediaTypesService.list>>)

    render(<TypeProvidersField type={LIGHT_NOVEL} />)

    expect(await screen.findByText(/no recipe to copy/i)).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Add a provider' }),
    ).not.toBeInTheDocument()
  })

  it('lista quem serve, e cada um tem como sair', async () => {
    vi.mocked(mediaTypesService.unlinkProvider).mockResolvedValue(
      type('anime', 'Anime', []) as unknown as MediaTypeInfo,
    )
    const { user } = await open(type('anime', 'Anime', ['anilist']))

    await user.click(screen.getByRole('button', { name: 'Stop using AniList' }))

    expect(mediaTypesService.unlinkProvider).toHaveBeenCalledWith(
      'anime',
      'anilist',
    )
  })

  it('a recusa mora na LINHA que a causou, com a contagem', async () => {
    // O alcance visual de uma recusa é o alcance real dela (décima quarta leva).
    // E a frase diz a CONSEQUÊNCIA, porque ela é invisível: sem a receita, arte
    // e detalhe param de carregar sem nada dizer por quê.
    vi.mocked(mediaTypesService.unlinkProvider).mockRejectedValue(
      new HttpError(409, 'in use', { entryCount: 12 }),
    )
    const { user } = await open(type('anime', 'Anime', ['anilist', 'tmdb']))

    await user.click(screen.getByRole('button', { name: 'Stop using AniList' }))

    const refusal = await screen.findByText(/12 titles already point at it/)
    expect(refusal).toBeVisible()
    // Na linha do AniList, e não na do TMDB.
    expect(
      screen.getByRole('button', { name: 'Stop using TMDB' }).parentElement
        ?.parentElement,
    ).not.toContainElement(refusal)
  })
})
