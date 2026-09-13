import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImportStatus } from '@/services/import'
import { render } from '@/test/render'
import { ImportSection } from './import-section'

/**
 * A SEGUNDA fase do import — 13/09/2026.
 *
 * O que estes testes afirmam é o que a tela **decide**, e não o que ela
 * desenha: aquecer e importar são dois fatos que CONVIVEM, o contador só
 * aparece quando há denominador, e a peça some quando o trabalho acaba.
 *
 * Medido no servidor, é por isso que ela existe: buscar a arte de 1.200 obras
 * leva 18,7 min no MyAnimeList e 52 min no AniList, e até este ciclo esse tempo
 * inteiro era invisível — o `status` ia a `done` e o sino disparava antes de o
 * aquecimento começar.
 *
 * **O corte é em `services/`**, que é a fronteira que a arquitetura já declara:
 * acima dele o TanStack Query, os hooks e a copy rodam de verdade.
 */
vi.mock('@/services/import', async (original) => ({
  ...(await original<typeof import('@/services/import')>()),
  importService: { status: vi.fn(), startCsv: vi.fn(), cancel: vi.fn() },
}))

const { importService } = await import('@/services/import')

const SOURCES: ImportStatus['sources'] = [
  { slug: 'csv', available: true, reason: null },
]

/** Um import que terminou, que é o estado em que o aquecimento começa. */
const TERMINADO = {
  id: 1,
  kind: 'import' as const,
  source: 'csv' as const,
  mode: 'skip' as const,
  status: 'done' as const,
  total: 400,
  processed: 400,
  added: 400,
  skipped: 0,
  updated: 0,
  unmatched: 0,
  problemCount: 0,
  problems: [],
  errorKind: null,
  errorParams: null,
  cancelRequestedAt: null,
  startedAt: new Date().toISOString(),
  finishedAt: new Date().toISOString(),
}

const AQUECENDO = {
  ...TERMINADO,
  id: 2,
  kind: 'enrich' as const,
  status: 'running' as const,
  total: 400,
  processed: 137,
  finishedAt: null,
}

function status(over: Partial<ImportStatus> = {}): ImportStatus {
  return {
    sources: SOURCES,
    running: null,
    mine: false,
    latest: null,
    enriching: null,
    ...over,
  } as ImportStatus
}

beforeEach(() => {
  vi.mocked(importService.status).mockReset()
})

describe('a segunda fase do import', () => {
  /**
   * **Os dois fatos convivem**, e é a decisão que mais viaja daqui: o import
   * terminou (e os números dele são o que a pessoa veio conferir) e a arte
   * ainda está chegando. Trocar um pelo outro faria o resultado sumir por quase
   * uma hora numa biblioteca grande — justo quando ele mais interessa.
   */
  it('mostra o aquecimento SEM esconder o resultado do import', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({ latest: TERMINADO, enriching: AQUECENDO }),
    )

    render(<ImportSection />)

    expect(await screen.findByText('Fetching artwork')).toBeInTheDocument()
    expect(screen.getByText('137 / 400')).toBeInTheDocument()
    // O bloco de resultado continua na tela, com os números do import.
    expect(screen.getByText('Last import')).toBeInTheDocument()
  })

  /**
   * Enquanto o total não foi escrito não há denominador, e `0 / 0` afirmaria um
   * total que não existe — a mesma régua da primeira fase, onde a fonte ainda
   * está sendo lida.
   */
  it('não inventa denominador antes de o total existir', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({ enriching: { ...AQUECENDO, total: null, processed: 0 } }),
    )

    render(<ImportSection />)

    expect(await screen.findByText('Starting…')).toBeInTheDocument()
    expect(screen.queryByText(/0 \/ 0/)).not.toBeInTheDocument()
  })

  /**
   * **Sem `Stop`**, e é decisão: o import ocupa o recurso, este não — ele cede
   * fichas a quem tem uma tela aberta. Um botão aqui ofereceria desistir de um
   * benefício sem custo.
   */
  it('não oferece parar o aquecimento', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({ latest: TERMINADO, enriching: AQUECENDO }),
    )

    render(<ImportSection />)

    await screen.findByText('Fetching artwork')
    expect(
      screen.queryByRole('button', { name: 'Stop' }),
    ).not.toBeInTheDocument()
  })

  /** Terminado o aquecimento, a peça sai e o resultado fica. */
  it('some quando o aquecimento acaba', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({ latest: TERMINADO, enriching: null }),
    )

    render(<ImportSection />)

    expect(await screen.findByText('Last import')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Fetching artwork')).not.toBeInTheDocument()
    })
  })
})
