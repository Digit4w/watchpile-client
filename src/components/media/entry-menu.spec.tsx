import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Entry } from '@/domain/media'
import { renderWithRouter } from '@/test/render'
import { EntryMenu } from './entry-menu'

/**
 * O item `Reorder in this widget` — 10/09/2026, e o que ele afirma é o
 * INVENTÁRIO do menu, que é a coisa que já divergiu uma vez.
 *
 * Em 07/09 havia três menus para um objeto, com quatro ações, uma e nenhuma —
 * e nenhuma das diferenças tinha sido decidida. Este item é uma diferença
 * DECIDIDA, e é por isso que ela precisa de teste: sem ele, a próxima peça que
 * renderiza a carta escolhe de novo e escolhe diferente.
 */
vi.mock('@/services/entries', () => ({
  entriesService: { remove: vi.fn(), links: vi.fn(), update: vi.fn() },
}))
vi.mock('@/services/piles', () => ({
  pilesService: { list: vi.fn(), removeEntry: vi.fn() },
}))
vi.mock('@/services/media-types', () => ({
  mediaTypesService: { list: vi.fn() },
}))
vi.mock('@/services/preferences', () => ({
  preferencesService: { mediaTypes: vi.fn() },
}))

const { pilesService } = await import('@/services/piles')
const { mediaTypesService } = await import('@/services/media-types')
const { preferencesService } = await import('@/services/preferences')

const ENTRY: Entry = {
  id: 4,
  mediaType: 'anime',
  title: 'Nanatsu no Taizai',
  status: 'watching',
  rating: null,
  notes: null,
  progress: 24,
  total: null,
  timeSpent: null,
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
  art: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(pilesService.list).mockResolvedValue([])
  vi.mocked(mediaTypesService.list).mockResolvedValue(
    [] as unknown as Awaited<ReturnType<typeof mediaTypesService.list>>,
  )
  vi.mocked(preferencesService.mediaTypes).mockResolvedValue({ hidden: [] })
})

async function open(props: Partial<Parameters<typeof EntryMenu>[0]> = {}) {
  const user = userEvent.setup()
  renderWithRouter(<EntryMenu entry={ENTRY} {...props} />)
  // `find` e não `get`: o router monta a rota num tick posterior, e o primeiro
  // quadro é vazio de propósito.
  await user.click(await screen.findByRole('button', { name: 'More actions' }))
  return { user }
}

describe('EntryMenu', () => {
  it('NÃO oferece reordenar onde não há ordem manual', async () => {
    // `/library` e a grade de `/piles/:id` renderizam a mesma carta e não
    // reordenam nada. Um item que não faz nada é pior que um item a menos —
    // *item de menu nasce de ação, não de simetria de layout*.
    await open()

    expect(screen.queryByText(/Reorder/)).not.toBeInTheDocument()
  })

  it('oferece reordenar quando quem renderiza tem ordem, nomeando o ESCOPO', async () => {
    // `Reorder` sozinho não diz reordenar o quê, e a resposta errada é cara: a
    // mesma obra está na biblioteca, em pilhas e em outros widgets, e nenhum
    // deles muda.
    await open({ reorder: { on: false, toggle: () => {} } })

    expect(
      screen.getByRole('button', { name: /Reorder in this widget/ }),
    ).toBeVisible()
  })

  it('o MESMO item desliga, e o rótulo conta o estado', async () => {
    // Sair é tão explícito quanto entrar: um modo sem saída visível é
    // affordance mentindo.
    const toggle = vi.fn()
    const { user } = await open({ reorder: { on: true, toggle } })

    const item = screen.getByRole('button', { name: /Done reordering/ })
    await user.click(item)

    expect(toggle).toHaveBeenCalledTimes(1)
  })

  it('fecha o painel ao ligar, porque o que se faz em seguida é arrastar', async () => {
    // O painel tampa exatamente as cartas que a pessoa vai mover.
    const { user } = await open({ reorder: { on: false, toggle: () => {} } })

    await user.click(screen.getByRole('button', { name: /Reorder/ }))

    expect(
      screen.queryByRole('button', { name: /Reorder/ }),
    ).not.toBeInTheDocument()
  })
})
