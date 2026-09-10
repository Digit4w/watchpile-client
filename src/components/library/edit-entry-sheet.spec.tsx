import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Entry } from '@/domain/media'
import { render } from '@/test/render'
import { EditEntrySheet } from './edit-entry-sheet'

/**
 * O PILOTO da suíte de componente, e ele foi escolhido pelo que afirma, não
 * por ser fácil.
 *
 * A regra que este arquivo fixa não existe em `domain/` e não tem como existir:
 * *o tipo de uma obra com vínculo não se troca*. Ela sai da régua de 07/09/2026
 * — o id de um provedor é único DENTRO do tipo, então trocar o tipo da obra sem
 * trocar o do vínculo deixa os dois discordando, e trocar o do vínculo junto
 * produziria uma identidade externa falsa. É regra de DADO decidida por uma
 * consulta, e o único lugar onde ela vive é a folha.
 *
 * **O corte é em `services/`**, a única camada que fala com a API. Acima dele
 * roda tudo de verdade: o TanStack Query, `useOfferedMediaTypes` com as duas
 * consultas que ele combina, e `offeredTypes` de `domain/`.
 */
vi.mock('@/services/entries', () => ({
  entriesService: { links: vi.fn(), update: vi.fn() },
}))
vi.mock('@/services/media-types', () => ({
  mediaTypesService: { list: vi.fn() },
}))
vi.mock('@/services/preferences', () => ({
  preferencesService: { mediaTypes: vi.fn() },
}))

const { entriesService } = await import('@/services/entries')
const { mediaTypesService } = await import('@/services/media-types')
const { preferencesService } = await import('@/services/preferences')

const TYPES = [
  {
    slug: 'anime',
    name: 'Anime',
    plural: 'Anime',
    icon: 'sparkles',
    progressUnit: 'Episodes',
    countsProgress: true,
    providers: ['mal'],
    effectiveProvider: 'mal',
  },
  {
    slug: 'movie',
    name: 'Movie',
    plural: 'Movies',
    icon: 'clapperboard',
    progressUnit: null,
    countsProgress: false,
    providers: ['tmdb'],
    effectiveProvider: 'tmdb',
  },
]

const ENTRY: Entry = {
  id: 7,
  mediaType: 'anime',
  title: 'Haikyuu!! Second Season',
  status: 'watching',
  rating: null,
  notes: null,
  progress: 0,
  total: 25,
  timeSpent: null,
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
  art: null,
}

beforeEach(() => {
  vi.mocked(mediaTypesService.list).mockResolvedValue(
    TYPES as unknown as Awaited<ReturnType<typeof mediaTypesService.list>>,
  )
  vi.mocked(preferencesService.mediaTypes).mockResolvedValue({ hidden: [] })
  vi.mocked(entriesService.update).mockResolvedValue(ENTRY)
})

function open(entry: Entry = ENTRY) {
  return render(<EditEntrySheet entry={entry} open onOpenChange={() => {}} />)
}

describe('EditEntrySheet', () => {
  it('tranca o tipo e diz o provedor quando a obra tem vínculo', async () => {
    vi.mocked(entriesService.links).mockResolvedValue([
      { provider: { slug: 'mal', name: 'MyAnimeList' } },
    ] as unknown as Awaited<ReturnType<typeof entriesService.links>>)

    open()

    // A recusa se anuncia ANTES do clique, com o motivo e o nome de quem a
    // causou — o app não tem toast pra explicá-la depois.
    expect(
      await screen.findByText(/came from MyAnimeList/i),
    ).toBeInTheDocument()
    // E não há o que clicar: os chips de tipo não existem, em vez de existirem
    // desabilitados.
    expect(
      screen.queryByRole('button', { name: 'Movie' }),
    ).not.toBeInTheDocument()
  })

  it('oferece os tipos quando a obra não tem vínculo nenhum', async () => {
    vi.mocked(entriesService.links).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof entriesService.links>>,
    )

    open()

    expect(
      await screen.findByRole('button', { name: 'Movie' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/came from/i)).not.toBeInTheDocument()
  })

  it('esconde o campo de total no tipo que não conta, e manda 1 ao salvar', async () => {
    vi.mocked(entriesService.links).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof entriesService.links>>,
    )
    const user = userEvent.setup()

    open()

    // Anime conta: o campo está lá, com o total que a obra já tinha.
    expect(await screen.findByLabelText(/Total Episodes/i)).toHaveValue('25')

    await user.click(screen.getByRole('button', { name: 'Movie' }))

    // Filme não conta — o campo SOME, em vez de ficar cinza ocupando a linha.
    expect(screen.queryByLabelText(/Total/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Save changes/i }))

    // `initialTotal` decide o 1, e é a MESMA regra com que a obra nasce.
    await waitFor(() => {
      expect(entriesService.update).toHaveBeenCalledWith(7, {
        mediaType: 'movie',
        title: 'Haikyuu!! Second Season',
        total: 1,
      })
    })
  })

  it('não deixa salvar enquanto nada mudou', async () => {
    vi.mocked(entriesService.links).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof entriesService.links>>,
    )

    open()

    // Abrir a folha não é editar: `Save changes` nasce inerte, e é isso que
    // impede uma escrita que não diz nada de virar uma linha em `updated_at`.
    expect(
      await screen.findByRole('button', { name: /Save changes/i }),
    ).toBeDisabled()
  })
})
