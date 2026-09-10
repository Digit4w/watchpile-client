import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '@/infra/lib/http-client'
import { render } from '@/test/render'
import { PreferencesSection } from './preferences-section'

/**
 * A seção que **escreve otimista**, e a única do app que escreve assim.
 *
 * O que ela decide, e por que nada disso cabe em `domain/`:
 *
 * - **A volta atrás é o cache anterior INTEIRO**, não o inverso do que se
 *   mandou — inverter suporia que nada mais mexeu na lista entre o clique e a
 *   falha. Isso só existe dentro do ciclo do TanStack Query, e é por isso que o
 *   corte é em `services/` e não no hook: fingir `useSetMediaTypeVisibility`
 *   apagaria exatamente a parte que este arquivo afirma
 * - **O último tipo visível não desliga**, e a recusa se anuncia ANTES do
 *   clique — a contagem é sobre os tipos QUE EXISTEM, não sobre o tamanho de
 *   `hidden`
 * - **Não há `Save`**: toggle anuncia efeito imediato, e é isso que
 *   `role="switch"` significa
 */
vi.mock('@/services/media-types', () => ({
  mediaTypesService: { list: vi.fn() },
}))
vi.mock('@/services/preferences', () => ({
  preferencesService: { mediaTypes: vi.fn(), setMediaTypes: vi.fn() },
}))

const { mediaTypesService } = await import('@/services/media-types')
const { preferencesService } = await import('@/services/preferences')

const type = (slug: string, name: string) => ({
  slug,
  name,
  plural: name,
  icon: 'sparkles',
  progressUnit: null,
  countsProgress: true,
  providers: [],
  effectiveProvider: null,
})

const TYPES = [
  type('anime', 'Anime'),
  type('movie', 'Movie'),
  type('book', 'Book'),
]

beforeEach(() => {
  vi.mocked(mediaTypesService.list).mockResolvedValue(
    TYPES as unknown as Awaited<ReturnType<typeof mediaTypesService.list>>,
  )
  vi.mocked(preferencesService.mediaTypes).mockResolvedValue({ hidden: [] })
})

const toggle = (name: string) =>
  screen.getByRole('switch', { name: `Show ${name}` })

async function open() {
  const user = userEvent.setup()
  const view = render(<PreferencesSection />)
  await screen.findByRole('switch', { name: 'Show Anime' })
  return { user, ...view }
}

describe('PreferencesSection', () => {
  it('não tem `Save`: o toggle é o efeito', async () => {
    await open()

    expect(
      screen.queryByRole('button', { name: /save/i }),
    ).not.toBeInTheDocument()
    expect(toggle('Anime')).toBeChecked()
  })

  it('esconder manda a lista INTEIRA de escondidos, não o que mudou', async () => {
    vi.mocked(preferencesService.setMediaTypes).mockResolvedValue({
      hidden: ['movie'],
    })
    const { user } = await open()

    await user.click(toggle('Movie'))

    expect(preferencesService.setMediaTypes).toHaveBeenCalledWith(['movie'])
  })

  it('vira o toggle na hora, antes de o servidor responder', async () => {
    // Otimista: um toggle que só vira depois da resposta se lê como um clique
    // que não pegou.
    let resolve: (value: { hidden: string[] }) => void = () => {}
    vi.mocked(preferencesService.setMediaTypes).mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )
    const { user } = await open()

    await user.click(toggle('Movie'))
    expect(toggle('Movie')).not.toBeChecked()

    resolve({ hidden: ['movie'] })
    await waitFor(() => expect(toggle('Movie')).not.toBeChecked())
  })

  it('volta ao estado anterior INTEIRO quando a escrita falha, e diz que voltou', async () => {
    vi.mocked(preferencesService.mediaTypes).mockResolvedValue({
      hidden: ['book'],
    })
    vi.mocked(preferencesService.setMediaTypes).mockRejectedValue(
      new HttpError(500, 'boom'),
    )
    const { user } = await open()

    expect(toggle('Book')).not.toBeChecked()

    await user.click(toggle('Movie'))

    // O que volta é o RETRATO de antes: `book` continua escondido. Inverter o
    // que se mandou teria devolvido só `movie`, e um `book` que outra aba
    // escondeu no meio do caminho voltaria a aparecer.
    await waitFor(() => expect(toggle('Movie')).toBeChecked())
    expect(toggle('Book')).not.toBeChecked()

    // A frase existe pra a volta não parecer um clique que não pegou — o app
    // não tem toast, e ela mora embaixo da lista que a pessoa tocou.
    expect(await screen.findByText(/didn't save/i)).toBeVisible()
  })

  it('não deixa desligar o ÚLTIMO visível, e diz o motivo antes do clique', async () => {
    vi.mocked(preferencesService.mediaTypes).mockResolvedValue({
      hidden: ['movie', 'book'],
    })
    await open()

    expect(toggle('Anime')).toBeDisabled()
    // O motivo chega às DUAS audiências, e por caminhos diferentes: preso ao
    // controle por `aria-describedby`, e como frase na tela. Um toggle que não
    // responde sem dizer por quê é o defeito que a recusa antecipada evita.
    expect(toggle('Anime')).toHaveAccessibleDescription(
      /At least one type stays visible/,
    )
    expect(screen.getAllByText(/At least one type stays visible/)).toHaveLength(
      2,
    )
    // Os desligados continuam clicáveis: o que trava é o último LIGADO.
    expect(toggle('Movie')).toBeEnabled()
  })

  it('não mostra o aviso do último enquanto há mais de um ligado', async () => {
    // Aviso permanente vira ruído: a frase existe pra explicar um toggle que
    // não responde.
    await open()

    expect(
      screen.queryByText(/At least one type stays visible/),
    ).not.toBeInTheDocument()
  })

  it('conta os visíveis sobre os tipos QUE EXISTEM, não sobre `hidden`', async () => {
    // Um slug escondido de um tipo que o admin apagou some do banco por
    // cascade, mas pode estar num cache velho aqui — e ele não pode fazer o
    // último ligado parecer o penúltimo.
    vi.mocked(preferencesService.mediaTypes).mockResolvedValue({
      hidden: ['movie', 'book', 'manga-apagado'],
    })
    await open()

    expect(toggle('Anime')).toBeDisabled()
  })
})
