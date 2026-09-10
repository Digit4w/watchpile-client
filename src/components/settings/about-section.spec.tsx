import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@/test/render'
import { AboutSection } from './about-section'

/**
 * A seção que passou semanas sem número nenhum, e agora decide entre três
 * estados de uma linha só.
 *
 * O que ela decide, e por que nada disso cabe em `domain/`:
 *
 * - **A versão é a do SERVIDOR.** É a decisão inteira desta seção, e ela é
 *   sobre QUAL consulta se faz — o `package.json` do cliente está a um import
 *   de distância e responderia a pergunta errada com um número plausível
 * - **Nulo é resposta, não erro.** O servidor responde assim quando o layout
 *   que o empacotou não trouxe o `package.json`; a linha fica e diz que não
 *   sabe, porque sumir esconderia que a pergunta foi feita
 * - **A espera mostra um traço, não some.** Uma das três linhas aparecendo
 *   depois das outras faria a lista pular
 */
vi.mock('@/services/meta', () => ({
  metaService: { get: vi.fn() },
}))

const { metaService } = await import('@/services/meta')

describe('About', () => {
  it('shows the version the server reports', async () => {
    vi.mocked(metaService.get).mockResolvedValue({ version: '0.1.0' })

    render(<AboutSection />)

    expect(await screen.findByText('0.1.0')).toBeInTheDocument()
  })

  it('says it does not know when the server answers null', async () => {
    // Null is a legitimate answer, not a failure: no layout the person can
    // fix, and nothing to retry.
    vi.mocked(metaService.get).mockResolvedValue({ version: null })

    render(<AboutSection />)

    expect(await screen.findByText('Unknown')).toBeInTheDocument()
  })

  it('keeps the row while the answer is in flight', async () => {
    // The label is what holds the row's place. Rendering the row only once
    // the answer lands would make the list jump.
    vi.mocked(metaService.get).mockReturnValue(new Promise(() => {}))

    render(<AboutSection />)

    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument()
  })

  it('never reads the version from the client bundle', async () => {
    // The whole point of the route: on a self-hosted install the server is
    // what defines what the installation IS, and the client can be anyone.
    // If this section ever stops asking the server, this goes red.
    vi.mocked(metaService.get).mockResolvedValue({ version: '9.9.9' })

    render(<AboutSection />)

    await waitFor(() => expect(metaService.get).toHaveBeenCalled())
    expect(await screen.findByText('9.9.9')).toBeInTheDocument()
  })

  it('still states the license and where the data lives', async () => {
    vi.mocked(metaService.get).mockResolvedValue({ version: '0.1.0' })

    render(<AboutSection />)

    expect(screen.getByText('AGPL-3.0')).toBeInTheDocument()
    expect(screen.getByText('SQLite')).toBeInTheDocument()
  })
})
