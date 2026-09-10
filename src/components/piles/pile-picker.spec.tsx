import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pile } from '@/domain/media'
import { HttpError } from '@/infra/lib/http-client'
import { render } from '@/test/render'
import { PilePicker } from './pile-picker'

/**
 * O seletor de pilhas da folha de criar obra, e o **gesto de meio de tarefa**
 * que a decisão de 29/08/2026 previu sem nenhuma tela exercer.
 *
 * ── O que este arquivo NÃO testa, e é decisão ──────────────────────────────
 * As três regras de GEOMETRIA que esta peça ensinou (chips sob o gatilho,
 * `side="top"` fixo, criar fecha o painel) só existem **em movimento**, e duas
 * delas são sobre posição: o jsdom não faz layout, então afirmar `side="top"`
 * seria afirmar uma prop, e afirmar "o botão não se moveu" seria afirmar uma
 * classe. *O que dava pra testar sem virar teste de estrutura está aqui; o
 * resto se prova no navegador, e foi lá que os três apareceram.*
 *
 * **A terceira é comportamento, e essa está coberta:** criar FECHA o painel, e
 * o motivo é o mesmo dos outros dois — limpar o filtro traz a lista inteira de
 * volta, e um painel ancorado pela base cresce pra cima, sob o cursor que
 * acabou de clicar.
 *
 * ── O corte é em `services/` ───────────────────────────────────────────────
 * Acima dele roda tudo: `usePiles` com `keepPreviousData`, `useCreatePile` com
 * a invalidação, e o `useDebounced` de verdade — é por isso que os testes que
 * digitam esperam a lista mudar em vez de afirmar no quadro seguinte.
 */
vi.mock('@/services/piles', () => ({
  pilesService: { list: vi.fn(), create: vi.fn() },
}))

const { pilesService } = await import('@/services/piles')

const pile = (id: number, name: string) =>
  ({
    id,
    name,
    description: null,
    entryCount: 0,
    preview: [],
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
  }) as unknown as Pile

const PILES = [pile(1, 'Comfort watch'), pile(2, 'Backlog')]

beforeEach(() => {
  // Sem isto as chamadas se acumulam entre testes, e um `not.toHaveBeenCalled`
  // no fim do arquivo falha por causa do teste de cima — a intermitência que
  // some quando se roda o teste sozinho.
  vi.clearAllMocks()
  vi.mocked(pilesService.list).mockResolvedValue(PILES)
})

/**
 * O primeiro argumento com que o serviço foi chamado.
 *
 * `mutationFn` é point-free (`mutationFn: pilesService.create`), e o TanStack
 * Query passa um SEGUNDO argumento de contexto junto — afirmar a chamada
 * inteira falaria sobre a assinatura da biblioteca, não sobre o que a tela
 * mandou.
 */
const sentToCreate = () => vi.mocked(pilesService.create).mock.calls[0]?.[0]

const openButton = () => screen.getByRole('button', { name: 'Add to a pile' })
const search = () =>
  screen.getByRole('textbox', { name: 'Find or create a pile' })
const row = (name: string) => screen.getByRole('button', { name })

async function open(selected: { id: number; name: string }[] = []) {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<PilePicker selected={selected} onChange={onChange} />)
  await user.click(openButton())
  await screen.findByRole('button', { name: 'Comfort watch' })
  return { user, onChange }
}

describe('PilePicker', () => {
  it('marca e desmarca, devolvendo a escolha inteira', async () => {
    const { user, onChange } = await open()

    await user.click(row('Comfort watch'))
    expect(onChange).toHaveBeenCalledWith([{ id: 1, name: 'Comfort watch' }])
  })

  it('tira a pilha já escolhida em vez de repetir', async () => {
    const chosen = [{ id: 1, name: 'Comfort watch' }]
    const { user, onChange } = await open(chosen)

    // A linha anuncia que está marcada, e tocá-la de novo é o gesto de tirar.
    expect(row('Comfort watch')).toHaveAttribute('aria-pressed', 'true')
    await user.click(row('Comfort watch'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('o escolhido volta como CHIP, e o chip é o que o desfaz', async () => {
    // *Escolha invisível é escolha esquecida* (design system, seção 5).
    const { user, onChange } = await open([{ id: 2, name: 'Backlog' }])

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /Remove Backlog/ }))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('não oferece criar com o campo vazio', async () => {
    await open()

    expect(screen.queryByText(/^Create/)).not.toBeInTheDocument()
  })

  it('não oferece criar um nome que a lista JÁ mostra, nem com outra caixa', async () => {
    // A comparação é contra o que está NA TELA, e sem acento nem
    // `toLocaleLowerCase`, porque a ordenação do servidor é `COLLATE NOCASE` e
    // também é só ASCII — os dois lados erram junto de propósito.
    const { user } = await open()

    await user.type(search(), 'comfort WATCH')

    await waitFor(() =>
      expect(screen.queryByText(/^Create/)).not.toBeInTheDocument(),
    )
  })

  it('cria com o que foi digitado, escolhe a nova, e FECHA o painel', async () => {
    // Fechar não é conveniência: limpar o filtro traz a lista inteira de volta,
    // e um painel ancorado pela base cresce PRA CIMA sob o cursor que acabou de
    // clicar — o segundo clique rápido marcaria a pilha errada, sem ruído.
    vi.mocked(pilesService.create).mockResolvedValue(pile(9, 'Rewatch'))
    const { user, onChange } = await open()

    await user.type(search(), 'Rewatch')
    await user.click(await screen.findByText(/Create/))

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([{ id: 9, name: 'Rewatch' }]),
    )
    expect(sentToCreate()).toEqual({ name: 'Rewatch' })
    await waitFor(() =>
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument(),
    )
  })

  it('Enter cria, porque o único campo do painel também é o de nome', async () => {
    vi.mocked(pilesService.create).mockResolvedValue(pile(9, 'Rewatch'))
    const { user, onChange } = await open()

    await user.type(search(), 'Rewatch')
    await screen.findByText(/Create/)
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([{ id: 9, name: 'Rewatch' }]),
    )
  })

  it('Enter não cria quando não há o que criar', async () => {
    const { user } = await open()

    await user.click(search())
    await user.keyboard('{Enter}')

    expect(pilesService.create).not.toHaveBeenCalled()
  })

  it('diz que a falha foi da criação, na peça que a pessoa tocou', async () => {
    // O app não tem toast, então a frase mora dentro do painel.
    vi.mocked(pilesService.create).mockRejectedValue(new HttpError(500, 'boom'))
    const { user, onChange } = await open()

    await user.type(search(), 'Rewatch')
    await user.click(await screen.findByText(/Create/))

    expect(await screen.findByText(/Couldn't create the pile/)).toBeVisible()
    // E o painel FICA: fechar aqui esconderia o que falhou.
    expect(search()).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('esquece o que foi digitado e a falha ao fechar', async () => {
    // Reabrir com o filtro de uma visita anterior mostraria uma lista recortada
    // que ninguém pediu — a mesma régua da sublista de `/search`.
    vi.mocked(pilesService.create).mockRejectedValue(new HttpError(500, 'boom'))
    const { user } = await open()

    await user.type(search(), 'Rewatch')
    await user.click(await screen.findByText(/Create/))
    await screen.findByText(/Couldn't create the pile/)

    await user.keyboard('{Escape}')
    await user.click(openButton())

    expect(await screen.findByRole('textbox')).toHaveValue('')
    expect(
      screen.queryByText(/Couldn't create the pile/),
    ).not.toBeInTheDocument()
  })

  it('cala o rótulo quando quem o abriga já o escreveu', async () => {
    // Na coluna da tela de detalhe a caixa já diz `Piles`, e os dois juntos
    // escreviam a palavra duas vezes, uma embaixo da outra.
    const { rerender } = render(
      <PilePicker selected={[]} onChange={() => {}} />,
    )
    expect(screen.getByText('Piles')).toBeVisible()

    rerender(<PilePicker selected={[]} onChange={() => {}} hideLabel />)
    expect(screen.queryByText('Piles')).not.toBeInTheDocument()
  })
})
