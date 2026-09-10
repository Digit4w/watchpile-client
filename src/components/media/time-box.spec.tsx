import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Entry } from '@/domain/media'
import { render } from '@/test/render'
import { TimeBox } from './title-state'

/**
 * A caixa de tempo investido — e ela **não é o contador**.
 *
 * A metade decidível mora em `domain/time-spent.ts`, com specs. O que sobra
 * aqui é o que não cabe lá: quando a escrita acontece (blur, e não a cada
 * tecla), o que ela manda quando as duas caixas esvaziam, e o que a tela faz
 * com um valor que não é um tempo.
 *
 * **O corte é em `services/`.**
 */
vi.mock('@/services/entries', () => ({
  entriesService: { update: vi.fn() },
}))

const { entriesService } = await import('@/services/entries')

const ENTRY: Entry = {
  id: 3,
  mediaType: 'game',
  title: 'Elden Ring',
  status: 'watching',
  rating: null,
  notes: null,
  progress: 0,
  total: null,
  timeSpent: null,
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
  art: null,
}

const entry = (patch: Partial<Entry> = {}): Entry => ({ ...ENTRY, ...patch })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(entriesService.update).mockResolvedValue(ENTRY)
})

const hours = () => screen.getByRole('textbox', { name: 'Hours spent' })
const minutes = () => screen.getByRole('textbox', { name: 'Minutes spent' })
const sent = () => vi.mocked(entriesService.update).mock.calls[0]?.[1]

describe('TimeBox', () => {
  it('nasce VAZIA quando nunca se registrou, e não em zero', async () => {
    // Nulo é "nunca registrou"; zero é "registrei, e é zero". Desenhar `0`
    // diria que alguém registrou.
    render(<TimeBox entry={entry()} />)

    expect(hours()).toHaveValue('')
    expect(minutes()).toHaveValue('')
  })

  it('reparte o que está gravado nas duas caixas', () => {
    render(<TimeBox entry={entry({ timeSpent: 2295 })} />)

    expect(hours()).toHaveValue('38')
    expect(minutes()).toHaveValue('15')
  })

  it('grava no BLUR, e manda MINUTOS', async () => {
    // `3` a caminho de `38` é um número válido e viraria uma escrita.
    const user = userEvent.setup()
    render(<TimeBox entry={entry()} />)

    await user.type(hours(), '38')
    expect(entriesService.update).not.toHaveBeenCalled()

    // Tabular de `h` para `min` NÃO grava: o foco ficou dentro do par, e o
    // gesto é um só. Sem isso seriam duas escritas para uma edição, e a
    // primeira um valor que ninguém quis (`38h00`).
    await user.tab()
    expect(entriesService.update).not.toHaveBeenCalled()

    await user.type(minutes(), '30')
    await user.tab()

    await waitFor(() => expect(entriesService.update).toHaveBeenCalledTimes(1))
    expect(sent()).toEqual({ timeSpent: 2310 })
  })

  it('as duas caixas vazias LIMPAM', async () => {
    // É o "nunca registrou" da coluna, e é como se desfaz.
    const user = userEvent.setup()
    render(<TimeBox entry={entry({ timeSpent: 150 })} />)

    await user.clear(hours())
    await user.clear(minutes())
    await user.tab()

    await waitFor(() => expect(entriesService.update).toHaveBeenCalled())
    expect(sent()).toEqual({ timeSpent: null })
  })

  it('não escreve quando o valor não mudou', async () => {
    // Sair da caixa sem mexer não é um gesto de gravar.
    const user = userEvent.setup()
    render(<TimeBox entry={entry({ timeSpent: 150 })} />)

    await user.click(hours())
    await user.tab()
    await user.tab()

    expect(entriesService.update).not.toHaveBeenCalled()
  })

  it('converte minuto acima de 59 em vez de recusar', async () => {
    // Quem digita 90 quis dizer uma hora e meia, e a tela sabe fazer a conta.
    const user = userEvent.setup()
    render(<TimeBox entry={entry()} />)

    await user.type(minutes(), '90')
    await user.tab()

    await waitFor(() => expect(entriesService.update).toHaveBeenCalled())
    expect(sent()).toEqual({ timeSpent: 90 })
  })

  it('segue o servidor quando o valor gravado muda por fora', () => {
    // Acontece de verdade: outra aba escreve, ou a nossa própria escrita volta
    // atrás. Sem isto o campo ficaria parado num número que não é o que está
    // gravado — e ele é o único lugar onde esse número aparece.
    const { rerender } = render(<TimeBox entry={entry({ timeSpent: 150 })} />)
    expect(hours()).toHaveValue('2')

    rerender(<TimeBox entry={entry({ timeSpent: 2295 })} />)

    expect(hours()).toHaveValue('38')
    expect(minutes()).toHaveValue('15')
  })

  it('não deixa digitar o que não é dígito', async () => {
    // Recusar depois seria pior: o campo não tem onde explicar, e o app não tem
    // toast — então ele simplesmente não aceita.
    const user = userEvent.setup()
    render(<TimeBox entry={entry()} />)

    await user.type(hours(), '2.5a-')

    expect(hours()).toHaveValue('25')
  })
})
