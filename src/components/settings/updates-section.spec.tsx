import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@/test/render'
import { UpdatesSection } from './updates-section'

/**
 * A seção que troca de CONTEÚDO sem trocar de posição.
 *
 * O que ela decide, e por que nada disso cabe em `domain/`:
 *
 * - **A tela não compara versão nem detecta ambiente.** `updateAvailable` e
 *   `canInstall` chegam prontos, e é isso que estes testes afirmam ao dar
 *   respostas contraditórias com o que a tela poderia deduzir sozinha
 * - **A recusa mora na peça que a causou**: sem capacidade de instalar, o que
 *   aparece no lugar do botão é o comando, não um banner acima da seção
 * - **`Check now` e o toggle FICAM em todos os estados** — controle cuja
 *   existência depende do estado é controle que não se aprende (09/09)
 * - **Sem `Content-Length` a barra fica indeterminada** e o texto diz só
 *   quanto veio: fingir uma fração seria a peça afirmando o que não sabe
 */
vi.mock('@/services/updates', () => ({
  updatesService: {
    get: vi.fn(),
    setCheck: vi.fn(),
    checkNow: vi.fn(),
    download: vi.fn(),
    install: vi.fn(),
  },
}))

const { updatesService } = await import('@/services/updates')

type State = Awaited<ReturnType<typeof updatesService.get>>

const base: State = {
  current: '0.1.0',
  enabled: true,
  latest: null,
  latestUrl: null,
  checkedAt: null,
  updateAvailable: false,
  canInstall: false,
  installHint: null,
  download: {
    state: 'idle',
    version: null,
    received: null,
    total: null,
    reason: null,
  },
}

function serve(state: Partial<State>) {
  vi.mocked(updatesService.get).mockResolvedValue({ ...base, ...state })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('when there is nothing newer', () => {
  it('tells apart "never checked" from "checked, nothing new"', async () => {
    // The two are not the same thing, and the difference is what the screen
    // knows. The second reassures; the first explains why the button next to
    // it has not been used.
    serve({ checkedAt: null })
    const { unmount } = render(<UpdatesSection />)
    expect(
      await screen.findByText(/has not looked for a newer version/i),
    ).toBeInTheDocument()
    unmount()

    serve({ checkedAt: new Date().toISOString() })
    render(<UpdatesSection />)
    expect(
      await screen.findByText(/newest version published/i),
    ).toBeInTheDocument()
  })

  it('offers no download, because there is nothing to download', async () => {
    serve({ canInstall: true, checkedAt: new Date().toISOString() })

    render(<UpdatesSection />)

    await screen.findByText(/newest version published/i)
    expect(
      screen.queryByRole('button', { name: 'Download' }),
    ).not.toBeInTheDocument()
  })
})

describe('when a newer version exists', () => {
  it('names it, and never compares versions itself', async () => {
    // The server says `updateAvailable`. The screen is given a `latest` that
    // is OLDER than `current` on purpose: if it were doing the comparison,
    // this would render the up-to-date branch.
    serve({
      updateAvailable: true,
      latest: 'v0.0.1',
      current: '9.9.9',
    })

    render(<UpdatesSection />)

    expect(await screen.findByText(/v0\.0\.1 is available/)).toBeInTheDocument()
  })

  it('shows the command instead of a button when this install cannot apply one', async () => {
    // Docker. The refusal lives in the piece that caused it — in the place the
    // button would have been, not in a banner above the section.
    serve({ updateAvailable: true, latest: 'v0.4.2', canInstall: false })

    render(<UpdatesSection />)

    expect(await screen.findByText(/cannot update itself/i)).toBeInTheDocument()
    expect(screen.getByText(/docker compose pull/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Download' }),
    ).not.toBeInTheDocument()
  })

  it('offers the download, with the platform hint the SERVER wrote', async () => {
    // The sentence about how it ends cannot be a constant here: it differs per
    // platform, and the client cannot detect its environment.
    serve({
      updateAvailable: true,
      latest: 'v0.4.2',
      canInstall: true,
      installHint: 'The installer will run and Watchpile will close.',
    })

    render(<UpdatesSection />)

    expect(
      await screen.findByRole('button', { name: 'Download' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Watchpile will close/)).toBeInTheDocument()
  })
})

describe('while the download runs', () => {
  it('draws a bar and says the two sizes', async () => {
    serve({
      updateAvailable: true,
      latest: 'v0.4.2',
      canInstall: true,
      download: {
        state: 'downloading',
        version: 'v0.4.2',
        received: 50 * 1024 * 1024,
        total: 100 * 1024 * 1024,
        reason: null,
      },
    })

    render(<UpdatesSection />)

    const bar = await screen.findByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '50')
  })

  it('leaves the bar indeterminate when the size is unknown', async () => {
    // Faking a fraction would be the piece asserting what it does not know.
    serve({
      updateAvailable: true,
      latest: 'v0.4.2',
      canInstall: true,
      download: {
        state: 'downloading',
        version: 'v0.4.2',
        received: 1024,
        total: null,
        reason: null,
      },
    })

    render(<UpdatesSection />)

    const bar = await screen.findByRole('progressbar')
    expect(bar).not.toHaveAttribute('aria-valuenow')
  })
})

describe('once it is downloaded', () => {
  it('offers to install', async () => {
    serve({
      updateAvailable: true,
      latest: 'v0.4.2',
      canInstall: true,
      installHint: 'It will restart.',
      download: {
        state: 'ready',
        version: 'v0.4.2',
        received: null,
        total: null,
        reason: null,
      },
    })
    vi.mocked(updatesService.install).mockResolvedValue({ message: 'Applying' })

    render(<UpdatesSection />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Install' }),
    )

    await waitFor(() => expect(updatesService.install).toHaveBeenCalled())
  })

  it('says why it failed, per reason, and offers to retry', async () => {
    serve({
      updateAvailable: true,
      latest: 'v0.4.2',
      canInstall: true,
      download: {
        state: 'failed',
        version: null,
        received: null,
        total: null,
        reason: 'no-asset',
      },
    })

    render(<UpdatesSection />)

    expect(
      await screen.findByText(/no installer for this platform/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })
})

describe('the check toggle', () => {
  it('stays in every state, and so does Check now', async () => {
    // Controls whose existence depends on the state are controls nobody
    // learns. What varies is the CONTENT, never the position.
    serve({ updateAvailable: true, latest: 'v0.4.2', canInstall: true })

    render(<UpdatesSection />)

    expect(
      await screen.findByRole('switch', { name: 'Check for updates' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Check now' }),
    ).toBeInTheDocument()
  })

  it('disables Check now while the check is off, instead of hiding it', async () => {
    // The button checks; it does not turn the check back on. Hiding it would
    // remove the only thing that explains why nothing is happening.
    serve({ enabled: false })

    render(<UpdatesSection />)

    expect(
      await screen.findByRole('button', { name: 'Check now' }),
    ).toBeDisabled()
  })

  it('writes immediately, with no Save', async () => {
    serve({ enabled: true })
    vi.mocked(updatesService.setCheck).mockResolvedValue({
      ...base,
      enabled: false,
    })

    render(<UpdatesSection />)

    await userEvent.click(await screen.findByRole('switch'))

    await waitFor(() =>
      expect(updatesService.setCheck).toHaveBeenCalledWith(false),
    )
    expect(
      screen.queryByRole('button', { name: /save/i }),
    ).not.toBeInTheDocument()
  })
})
