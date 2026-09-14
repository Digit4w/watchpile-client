import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LogLine } from '@/domain/log-view'
import { render } from '@/test/render'
import { LogsSection } from './logs-section'

/**
 * O que a seção de logs DECIDE, e que não cabe em `domain/`:
 *
 * - o filtro troca a LISTA inteira, e o vazio de quem filtrou oferece desfazer
 *   o recorte em vez de dizer que não há log
 * - o `Copy` leva o que está NA TELA — com o filtro ligado, só as linhas
 *   filtradas —, e confirma na própria peça
 * - a stack abre no lugar
 * - `Load older` põe as linhas mais antigas ANTES das que já estavam
 *
 * O corte é em `services/`, como manda `src/test/render.tsx`.
 */
vi.mock('@/services/logs', () => ({
  logsService: { read: vi.fn() },
  LOG_DOWNLOAD_URL: '/api/logs/download',
}))

const { logsService } = await import('@/services/logs')

const T0 = new Date(2026, 8, 14, 8, 14, 20).getTime()

const line = (
  offset: number,
  level: number,
  msg: string,
  extra: Partial<LogLine> = {},
): LogLine => ({
  time: T0 + offset * 1000,
  level,
  msg,
  fields: {},
  err: null,
  ...extra,
})

const USAGE = { files: 1, bytes: 2048, limitBytes: 15 * 1024 * 1024 }

const ALL = [
  line(0, 30, 'import finished', { fields: { jobId: 41 } }),
  line(1, 40, 'provider search unreachable', { fields: { provider: 'kitsu' } }),
  line(2, 50, 'art warm failed', {
    err: {
      type: 'Error',
      message: 'locked',
      stack: 'Error: locked\n    at writeArt',
    },
  }),
]

function page(lines: LogLine[], hasOlder = false) {
  return { lines, hasOlder, usage: USAGE }
}

beforeEach(() => {
  vi.mocked(logsService.read).mockImplementation(async ({ level, before }) => {
    if (before !== undefined) {
      return page([line(-5, 30, 'older line')])
    }
    if (level === 'error') {
      return page([])
    }
    if (level === 'warn') {
      return page(ALL.filter((l) => l.level >= 40))
    }
    return page(ALL, true)
  })
})

function open(search = '') {
  const user = userEvent.setup()
  const view = render(
    <NuqsTestingAdapter searchParams={search}>
      <LogsSection />
    </NuqsTestingAdapter>,
  )
  return { user, ...view }
}

describe('LogsSection', () => {
  it('mostra nível, mensagem e campos de cada linha', async () => {
    open()

    expect(await screen.findByText('art warm failed')).toBeInTheDocument()
    expect(screen.getByText('ERROR')).toBeInTheDocument()
    expect(screen.getByText('WARN')).toBeInTheDocument()
    expect(screen.getByText('provider=kitsu')).toBeInTheDocument()
  })

  it('filtrar sem resultado oferece desfazer o recorte', async () => {
    const { user } = open()
    await screen.findByText('art warm failed')

    await user.click(screen.getByRole('button', { name: 'Errors' }))

    expect(await screen.findByText('No errors')).toBeInTheDocument()
    expect(screen.queryByText('art warm failed')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show all' }))

    expect(await screen.findByText('art warm failed')).toBeInTheDocument()
  })

  it('Copy leva só as linhas na tela, e confirma na própria peça', async () => {
    const { user } = open('?level=warn')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    await screen.findByText('art warm failed')

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = writeText.mock.calls[0]?.[0] as string
    expect(copied).toContain('provider search unreachable provider=kitsu')
    expect(copied).toContain('art warm failed')
    // `import finished` é INFO e o filtro é `warn`: não estava na tela.
    expect(copied).not.toContain('import finished')
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
  })

  it('a stack abre no lugar', async () => {
    const { user } = open()
    await screen.findByText('art warm failed')

    expect(screen.queryByText(/at writeArt/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show details' }))

    expect(screen.getByText(/at writeArt/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Hide details' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('Load older põe as mais antigas ANTES das que já estavam', async () => {
    const { user } = open()
    await screen.findByText('art warm failed')

    await user.click(screen.getByRole('button', { name: 'Load older' }))
    await screen.findByText('older line')

    const messages = screen
      .getAllByText(/older line|import finished|art warm failed/)
      .map((node) => node.textContent)
    expect(messages).toEqual([
      'older line',
      'import finished',
      'art warm failed',
    ])
    await waitFor(() =>
      expect(logsService.read).toHaveBeenCalledWith({
        level: 'all',
        before: T0,
      }),
    )
  })

  it('não oferece Download nem Copy quando não há o que levar', async () => {
    vi.mocked(logsService.read).mockResolvedValue({
      lines: [],
      hasOlder: false,
      usage: { files: 0, bytes: 0, limitBytes: USAGE.limitBytes },
    })
    open()

    expect(await screen.findByText('Nothing logged yet')).toBeInTheDocument()
    const actions = screen.getByText('Server log').closest('section')
    expect(actions).not.toBeNull()
    const scope = within(actions as HTMLElement)
    expect(scope.getByRole('button', { name: 'Copy' })).toBeDisabled()
    expect(scope.getByRole('button', { name: 'Download' })).toBeDisabled()
  })
})
