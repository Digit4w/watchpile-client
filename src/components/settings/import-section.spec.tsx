import { fireEvent, screen, waitFor } from '@testing-library/react'
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
  importService: {
    status: vi.fn(),
    startCsv: vi.fn(),
    startProfile: vi.fn(),
    cancel: vi.fn(),
  },
}))
vi.mock('@/services/entries', () => ({
  entriesService: { refreshAll: vi.fn() },
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
  dismissedAt: null,
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
    refreshing: null,
    pending: 0,
    ...over,
  } as ImportStatus
}

beforeEach(() => {
  vi.mocked(importService.status).mockReset()
})

describe('o formulário enquanto um trabalho roda', () => {
  /**
   * Uma fonte de PERFIL, e não o CSV das outras fixtures. O botão do CSV já
   * nasce desabilitado por falta de arquivo, então afirmar `toBeDisabled()`
   * nele passaria com ou sem a regra — *dado de exemplo que não distingue as
   * duas implementações não confere regra nenhuma* (10/09/2026). Com o campo
   * preenchido, `busy` vira o ÚNICO portão que sobra.
   */
  const PERFIL: ImportStatus['sources'] = [
    { slug: 'mal', available: true, reason: null },
  ]

  const IMPORTANDO = {
    ...TERMINADO,
    id: 3,
    source: 'mal' as const,
    status: 'running' as const,
    total: 400,
    processed: 91,
    finishedAt: null,
  }

  async function preencherUsuario() {
    const campo = await screen.findByPlaceholderText(
      'Your MyAnimeList username',
    )
    fireEvent.change(campo, { target: { value: 'hatrask' } })
  }

  /**
   * **O formulário FICA, e a recusa se anuncia — 14/09/2026.**
   *
   * Ele sumia inteiro durante a primeira fase e voltava na segunda, o que é a
   * régua de 09/09 do `/search` furada aqui: *controle cuja existência depende
   * do estado da tela é controle que não se aprende*. A saída é a mesma que lá
   * — **o que varia é o CONTEÚDO, nunca a posição**.
   *
   * As DUAS metades são afirmadas de propósito: a peça continua na tela **e**
   * ela recusa. Só a primeira passaria com um formulário que aceita o clique e
   * falha depois, que é o que este app não pode fazer por não ter toast.
   */
  it('fica na tela com o botão recusando enquanto um import roda', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({ sources: PERFIL, running: IMPORTANDO, mine: true }),
    )

    render(<ImportSection />)
    await preencherUsuario()

    expect(
      screen.getByText('If a title is already in your library'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
    expect(screen.getByText(/Your import is still running/)).toBeInTheDocument()
  })

  /**
   * **Aquecer NÃO ocupa a vaga de importar**, e é o servidor que diz isso: o
   * índice único é por `kind`, então as duas correm juntas. Uma recusa escrita
   * para "qualquer trabalho" passaria no teste de cima e mentiria aqui — que é
   * exatamente o par que separa as duas implementações.
   */
  it('aceita um import novo enquanto só a arte está sendo buscada', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({
        sources: PERFIL,
        latest: TERMINADO,
        enriching: AQUECENDO,
        mine: true,
      }),
    )

    render(<ImportSection />)
    await preencherUsuario()

    expect(screen.queryByText(/still running/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import' })).not.toBeDisabled()
  })
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
   * **O aquecimento GANHOU `Stop` — 14/09/2026, e a regra mudou por um motivo.**
   *
   * Em 13/09 ele não tinha, e o argumento era que parar ofereceria desistir de
   * um benefício sem custo: o trabalho não ocupava o recurso, e o que se perdia
   * ao parar não voltava. **O `Continue` desfaz esse argumento por dentro** —
   * com uma retomada que acha o que falta, parar deixa de ser desistir e passa
   * a ser pausar.
   *
   * É a mesma forma de *o argumento de uma decisão pode ser sobre COMPETIÇÃO
   * por espaço, e quando a competição acaba a decisão não vale mais*: aqui o
   * argumento era sobre PERDA, e a perda deixou de existir.
   */
  it('oferece parar o aquecimento, agora que dá para continuar', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({ latest: TERMINADO, enriching: AQUECENDO }),
    )

    render(<ImportSection />)

    await screen.findByText('Fetching artwork')
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
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

describe('a varredura da biblioteca', () => {
  const VARRENDO = {
    ...TERMINADO,
    id: 3,
    kind: 'refresh' as const,
    source: null,
    status: 'running' as const,
    total: 400,
    processed: 137,
    updated: 0,
    finishedAt: null,
  }

  /**
   * **O controle não depende do estado**: com a varredura parada o botão está
   * lá, e é assim que ela se aprende. É a régua de 09/09 — *o que varia é o
   * conteúdo, nunca a posição*.
   */
  it('oferece o botão quando não há varredura nenhuma', async () => {
    vi.mocked(importService.status).mockResolvedValue(status())

    render(<ImportSection />)

    expect(
      await screen.findByRole('button', { name: 'Refresh library' }),
    ).toBeInTheDocument()
  })

  it('troca o botão pelo contador enquanto varre', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({ refreshing: VARRENDO }),
    )

    render(<ImportSection />)

    expect(await screen.findByText('137 / 400')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Refresh library' }),
    ).not.toBeInTheDocument()
    // Esta pode ser parada, ao contrário do aquecimento.
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  /**
   * **A varredura fica na tela depois de terminar**, ao contrário do
   * aquecimento: ela tem resultado, e o número de obras que ganharam contagem
   * nova é o que a pessoa apertou o botão para saber.
   */
  it('mostra o resultado quando termina', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({
        refreshing: {
          ...VARRENDO,
          status: 'done' as const,
          processed: 400,
          updated: 7,
        },
      }),
    )

    render(<ImportSection />)

    expect(
      await screen.findByText(/7 titles got a new count/),
    ).toBeInTheDocument()
  })

  it('diz quando nada mudou, em vez de mostrar um zero solto', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({
        refreshing: { ...VARRENDO, status: 'done' as const, updated: 0 },
      }),
    )

    render(<ImportSection />)

    expect(await screen.findByText(/already up to date/)).toBeInTheDocument()
  })

  /**
   * O defeito que este ciclo criou e que só a tela rodando mostrou:
   * `useCancelImport` escrevia a resposta em `running` e `latest` sem olhar o
   * `kind`, então cancelar a varredura **apagava o resultado do último
   * import**. Aqui o que se afirma é a convivência — os dois blocos na tela ao
   * mesmo tempo.
   */
  it('não esconde o resultado do import enquanto varre', async () => {
    vi.mocked(importService.status).mockResolvedValue(
      status({ latest: TERMINADO, refreshing: VARRENDO }),
    )

    render(<ImportSection />)

    expect(await screen.findByText('Last import')).toBeInTheDocument()
    expect(screen.getByText('Refresh title data')).toBeInTheDocument()
  })
})
