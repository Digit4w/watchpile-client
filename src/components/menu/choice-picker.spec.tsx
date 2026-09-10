import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@/test/render'
import { ChoicePicker } from './choice-picker'

/**
 * A peça que substituiu o `<select>` nativo. O que ela DECIDE é qual linha está
 * marcada e quando o painel fecha — o resto é composição.
 *
 * O teste é de comportamento e não de estrutura: `aria-checked` é o que o
 * leitor de tela ouve, e é o que o `<select>` dava de graça e um popover só tem
 * se alguém escrever.
 */
const OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
] as const

function abrir() {
  return userEvent.click(screen.getByRole('button', { name: 'View as' }))
}

describe('ChoicePicker', () => {
  it('mostra o rótulo do valor atual, não o valor cru', async () => {
    render(
      <ChoicePicker
        options={OPTIONS}
        value="list"
        onSelect={() => {}}
        ariaLabel="View as"
      />,
    )

    expect(screen.getByRole('button', { name: 'View as' })).toHaveTextContent(
      'List',
    )
  })

  it('marca só a opção escolhida', async () => {
    render(
      <ChoicePicker
        options={OPTIONS}
        value="list"
        onSelect={() => {}}
        ariaLabel="View as"
      />,
    )
    await abrir()

    expect(screen.getByRole('menuitemradio', { name: 'Grid' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('escolher avisa o chamador e FECHA o painel', async () => {
    const onSelect = vi.fn()
    render(
      <ChoicePicker
        options={OPTIONS}
        value="list"
        onSelect={onSelect}
        ariaLabel="View as"
      />,
    )
    await abrir()
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Grid' }))

    expect(onSelect).toHaveBeenCalledWith('grid')
    // Fechar faz parte da escolha: painel que fica aberto sobre a peça que
    // acabou de mudar esconde justamente o efeito do clique.
    expect(
      screen.queryByRole('menuitemradio', { name: 'Grid' }),
    ).not.toBeInTheDocument()
  })

  it('desabilitado não abre', async () => {
    render(
      <ChoicePicker
        options={OPTIONS}
        value="list"
        onSelect={() => {}}
        ariaLabel="View as"
        disabled
      />,
    )
    const gatilho = screen.getByRole('button', { name: 'View as' })

    expect(gatilho).toBeDisabled()
    await userEvent.click(gatilho, { pointerEventsCheck: 0 })
    expect(
      screen.queryByRole('menuitemradio', { name: 'Grid' }),
    ).not.toBeInTheDocument()
  })
})
