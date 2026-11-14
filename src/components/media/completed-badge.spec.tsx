import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ENTRY_STATUSES } from '@/domain/media'
import { render } from '@/test/render'
import { CompletedBadge } from './completed-badge'

/**
 * O selo decide UMA coisa — aparecer ou não —, e a decisão é só do status: a
 * peça não recebe o progresso, então não tem como marcar `24 / 24` em
 * `watching` nem esquecer `completed` em `12 / 24`. O que se afirma aqui é que
 * ele existe, com nome, exatamente para `completed`.
 */
describe('CompletedBadge', () => {
  it('says "Completed" to a screen reader when the title is completed', () => {
    render(<CompletedBadge status="completed" />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('draws nothing for every other status', () => {
    for (const status of ENTRY_STATUSES.filter((s) => s !== 'completed')) {
      const { container, unmount } = render(<CompletedBadge status={status} />)
      expect(container).toBeEmptyDOMElement()
      unmount()
    }
  })
})
