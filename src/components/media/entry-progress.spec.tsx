import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Entry } from '@/domain/media'
import { render } from '@/test/render'
import { EntryProgress } from './entry-progress'

/**
 * A peça que decide qual acompanhamento a obra ganha — e ela **já esteve
 * errada uma vez**, em 07/09/2026, no dia em que nasceu: a primeira versão
 * esvaziou a célula de LEITURA em vez da de controle, e o defeito que isso
 * escondia era pior — duas peças computando a mesma pergunta com entradas
 * diferentes, o que deixava umas linhas em branco e outras duplicadas.
 *
 * **Metade da decisão já mora em `domain/`** (`showsCounter`, com specs), que é
 * o primeiro passo da régua. O que sobra aqui é o que não tem como morar lá, e
 * é por isso que este arquivo existe:
 *
 * - a resposta depende de uma **consulta** (o vocabulário da instância diz se o
 *   tipo conta), e o intervalo entre o pedido e a resposta é um estado próprio
 * - quem substitui quem é pergunta de **layout**: `statusInRow` decide entre o
 *   controle de status e um vão da largura do contador que não foi desenhado
 * - o `+`/`−` é uma **escrita**, e os limites dela são de tela
 *
 * **O corte é em `services/`.** Acima dele roda tudo de verdade — o TanStack
 * Query, `useMediaTypeMap`, `useCountsProgress` e `showsCounter`.
 */
vi.mock('@/services/media-types', () => ({
  mediaTypesService: { list: vi.fn() },
}))
vi.mock('@/services/entries', () => ({
  entriesService: { addProgress: vi.fn() },
}))

const { mediaTypesService } = await import('@/services/media-types')
const { entriesService } = await import('@/services/entries')

const TYPES = [
  {
    slug: 'manga',
    name: 'Manga',
    plural: 'Manga',
    icon: 'message-square',
    progressUnit: 'Chapters',
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
  id: 12,
  mediaType: 'manga',
  title: 'Berserk',
  status: 'watching',
  rating: null,
  notes: null,
  progress: 3,
  total: null,
  timeSpent: null,
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
  art: null,
}

const entry = (patch: Partial<Entry> = {}): Entry => ({ ...ENTRY, ...patch })

const types = () =>
  vi
    .mocked(mediaTypesService.list)
    .mockResolvedValue(
      TYPES as unknown as Awaited<ReturnType<typeof mediaTypesService.list>>,
    )

beforeEach(() => {
  types()
  vi.mocked(entriesService.addProgress).mockResolvedValue(ENTRY)
})

const counter = () => screen.queryByText(/\d+ \/ /)
const plus = () => screen.getByRole('button', { name: 'Increase progress' })
const minus = () => screen.getByRole('button', { name: 'Decrease progress' })

describe('EntryProgress', () => {
  it('não desenha NADA enquanto o vocabulário não chegou', () => {
    // A régua de 04/09 com o agravante que é só desta peça: o contador é
    // controle de ESCRITA, e desenhá-lo por um quadro num tipo que não conta
    // deixa um clique gravar progresso que o modelo diz não existir. Um quadro
    // em branco não faz isso — e é por isso que o teste NÃO espera.
    const { container } = render(<EntryProgress entry={entry()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('conta quando o tipo conta e o total é desconhecido', async () => {
    render(<EntryProgress entry={entry()} />)

    // `12 / ?` é o estado desenhado pra "não se sabe o fim" (brief, 3.11) —
    // não é o caso de exceção, é um mangá em publicação.
    expect(await screen.findByText('3 / ?')).toBeInTheDocument()
  })

  it('troca o contador pelo STATUS quando o TIPO não conta', async () => {
    render(<EntryProgress entry={entry({ mediaType: 'movie', total: 1 })} />)

    expect(await screen.findByText('Watching')).toBeInTheDocument()
    expect(counter()).not.toBeInTheDocument()
  })

  it('troca o contador pelo STATUS quando a OBRA tem uma unidade só', async () => {
    // A segunda pergunta é da obra, e ela vale em tipo nenhum excluído: um
    // jogo de quarenta horas continua contando, e este mangá de volume único
    // não. `1` e `null` são OPOSTOS.
    render(<EntryProgress entry={entry({ total: 1 })} />)

    expect(await screen.findByText('Watching')).toBeInTheDocument()
    expect(counter()).not.toBeInTheDocument()
  })

  it('deixa a célula VAZIA quando a linha já mostra o status noutra coluna', async () => {
    // *Uma linha não diz a mesma palavra duas vezes*, e quem sai é o CONTROLE
    // — quem manda é o cabeçalho da coluna (07/09/2026, decisão do dono, que
    // INVERTEU a régua que eu tinha registrado de manhã).
    const { container } = render(
      <EntryProgress entry={entry({ total: 1 })} statusInRow />,
    )

    await waitFor(() => expect(container).not.toBeEmptyDOMElement())
    expect(screen.queryByText('Watching')).not.toBeInTheDocument()
    expect(counter()).not.toBeInTheDocument()
    // A largura fica: sem o vão, a coluna vizinha anda exatamente na linha em
    // que a obra não tem o que contar.
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('`statusInRow` não apaga o contador de quem TEM o que contar', async () => {
    // A coluna `Status` existir não tira o contador da linha — as duas
    // perguntas são independentes, e confundi-las foi o defeito de 07/09.
    render(<EntryProgress entry={entry()} statusInRow />)

    expect(await screen.findByText('3 / ?')).toBeInTheDocument()
  })

  it('escreve o delta, e desfazer é uma escrita como outra qualquer', async () => {
    const user = userEvent.setup()
    render(<EntryProgress entry={entry()} />)
    await screen.findByText('3 / ?')

    await user.click(plus())
    expect(entriesService.addProgress).toHaveBeenCalledWith(12, { delta: 1 })

    // O `−` não é um "cancelar" local: é evento novo com delta negativo no log
    // append-only (brief, 3.11).
    await user.click(minus())
    expect(entriesService.addProgress).toHaveBeenCalledWith(12, { delta: -1 })
  })

  it('não deixa descer abaixo de zero nem passar do total conhecido', async () => {
    const { unmount } = render(<EntryProgress entry={entry({ progress: 0 })} />)
    await screen.findByText('0 / ?')
    expect(minus()).toBeDisabled()
    expect(plus()).toBeEnabled()
    unmount()

    render(<EntryProgress entry={entry({ progress: 24, total: 24 })} />)
    await screen.findByText('24 / 24')
    expect(plus()).toBeDisabled()
    expect(minus()).toBeEnabled()
  })

  it('não trava o `+` numa obra sem total conhecido', async () => {
    // O teto só existe onde há denominador. Num mangá em publicação, travar o
    // `+` seria a tela decidir que a obra acabou.
    render(<EntryProgress entry={entry({ progress: 999 })} />)
    await screen.findByText('999 / ?')

    expect(plus()).toBeEnabled()
  })
})
