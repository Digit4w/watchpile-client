import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@/test/render'
import { LibraryMenu } from './library-menu'

/**
 * Os quatro eixos de `/library` num popover, em **dois formatos** — e os dois
 * formatos não são inconsistência, são as duas curvas: recorte cresce
 * (`Media type` não tem teto, brief 3.10), arrumação não.
 *
 * O que ele decide, e por que nada disso cabe em `domain/`:
 *
 * - **a raiz mostra o VALOR ATUAL de cada eixo**, que é a coisa que a lista
 *   plana de 22 linhas não tinha — o recorte inteiro se lê num olhar, e é isso
 *   que paga o clique a mais
 * - **escolher fecha o painel E volta à raiz**, porque o resultado aparece
 *   ATRÁS do popover: deixá-lo aberto tampando a grade que acabou de mudar é
 *   esconder a resposta da pergunta
 * - **a sub-vista de tipo lista TODOS**, sempre — conteúdo de menu que depende
 *   da largura da janela muda de assunto sem ninguém pedir
 * - **o tipo escolhido que ainda não chegou na oferta cai no SLUG**, não em
 *   "qualquer tipo": dizer que não há filtro quando há é pior que um slug feio
 *   por um quadro
 *
 * O corte é em `services/`: `useOfferedMediaTypes` combina duas consultas e
 * aplica `offeredTypes`, e fingi-lo apagaria a parte que decide.
 */
vi.mock('@/services/media-types', () => ({
  mediaTypesService: { list: vi.fn() },
}))
vi.mock('@/services/preferences', () => ({
  preferencesService: { mediaTypes: vi.fn() },
}))

const { mediaTypesService } = await import('@/services/media-types')
const { preferencesService } = await import('@/services/preferences')

const type = (slug: string, plural: string) => ({
  slug,
  name: plural,
  plural,
  icon: 'sparkles',
  progressUnit: null,
  countsProgress: true,
  providers: [],
  effectiveProvider: null,
})

const TYPES = [
  type('anime', 'Anime'),
  type('movie', 'Movies'),
  type('game', 'Games'),
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mediaTypesService.list).mockResolvedValue(
    TYPES as unknown as Awaited<ReturnType<typeof mediaTypesService.list>>,
  )
  vi.mocked(preferencesService.mediaTypes).mockResolvedValue({ hidden: [] })
})

type Props = Parameters<typeof LibraryMenu>[0]

function open(props: Partial<Props> = {}) {
  const handlers = {
    onStatus: vi.fn(),
    onType: vi.fn(),
    onSort: vi.fn(),
    onView: vi.fn(),
  }
  const user = userEvent.setup()

  render(
    <LibraryMenu
      status={null}
      type={null}
      sort="updated"
      view="grid"
      {...handlers}
      {...props}
    >
      <button type="button">Sort and view</button>
    </LibraryMenu>,
  )

  return { user, ...handlers }
}

const trigger = () => screen.getByRole('button', { name: 'Sort and view' })
const axis = (name: RegExp) => screen.getByRole('button', { name })

describe('LibraryMenu', () => {
  it('mostra o valor atual de cada eixo na raiz', async () => {
    // O recorte inteiro num olhar, em vez de procurar quatro vistos em 22
    // linhas — é isso que paga o clique a mais da sub-vista.
    const { user } = open({ status: 'completed', type: 'movie' })
    await user.click(trigger())

    expect(axis(/^Status/)).toHaveTextContent('Completed')
    expect(axis(/^Media type/)).toHaveTextContent('Movies')
  })

  it('diz `Any` no eixo sem recorte', async () => {
    const { user } = open()
    await user.click(trigger())

    expect(axis(/^Status/)).toHaveTextContent('Any status')
    expect(axis(/^Media type/)).toHaveTextContent('Any type')
  })

  it('cai no SLUG enquanto o tipo escolhido não chegou na oferta', async () => {
    // `useOfferedMediaTypes` devolve vazio no intervalo entre as duas consultas
    // (régua de 04/09). Cair em "Any type" ali diria que não há filtro quando
    // há — o slug cru é feio, é verdade, e dura um quadro.
    const { user } = open({ type: 'manga' })
    await user.click(trigger())

    expect(axis(/^Media type/)).toHaveTextContent('manga')
  })

  it('a sub-vista de tipo lista TODOS os oferecidos, no plural', async () => {
    // Plural porque a linha nomeia um CONJUNTO de obras (design system, sexta
    // leva). E todos, sempre: conteúdo que depende da largura da janela muda de
    // assunto sem ninguém pedir.
    const { user } = open()
    await user.click(trigger())
    await user.click(axis(/^Media type/))

    for (const plural of ['Anime', 'Movies', 'Games']) {
      expect(
        await screen.findByRole('menuitemradio', { name: plural }),
      ).toBeVisible()
    }
    expect(
      screen.getByRole('menuitemradio', { name: 'Any type' }),
    ).toBeVisible()
  })

  it('a sub-vista substitui a raiz, e a volta traz a raiz de novo', async () => {
    // Abre NO LUGAR: o app segue com uma camada flutuante em vez de duas.
    const { user } = open()
    await user.click(trigger())
    await user.click(axis(/^Status/))

    expect(screen.queryByText('Sort by')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText('Sort by')).toBeVisible()
  })

  it('escolher na sub-vista aplica e FECHA', async () => {
    // O resultado aparece ATRÁS do popover: deixá-lo aberto tampando a grade
    // que acabou de mudar é esconder a resposta da pergunta.
    const { user, onStatus } = open()
    await user.click(trigger())
    await user.click(axis(/^Status/))
    await user.click(screen.getByRole('menuitemradio', { name: 'Completed' }))

    expect(onStatus).toHaveBeenCalledWith('completed')
    /**
     * **A ausência de `Sort by` NÃO serve aqui**, e conferir a quebra foi o que
     * mostrou: sem fechar, a tela fica na SUB-VISTA, onde `Sort by` também não
     * está — a asserção não distinguiria "fechou" de "continua onde estava".
     * Sumirem as linhas de escolha distingue: elas existem nos dois estados do
     * painel aberto e em nenhum do fechado.
     */
    await waitFor(() =>
      expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument(),
    )
  })

  it('reabre na RAIZ, nunca na sub-vista de onde se saiu', async () => {
    // Reabrir onde se estava mostraria estado de uma visita anterior, e a raiz
    // é justamente a coisa que o menu serve.
    const { user } = open()
    await user.click(trigger())
    await user.click(axis(/^Status/))
    await user.keyboard('{Escape}')

    await user.click(trigger())
    expect(screen.getByText('Sort by')).toBeVisible()
  })

  it('`Sort by` e `View as` ficam na RAIZ, sem sub-vista', async () => {
    // Recorte cresce, arrumação não: os dois são fechados por construção, e
    // dar sub-vista a eles cobraria um clique por nada.
    const { user, onSort } = open()
    await user.click(trigger())

    expect(screen.getByText('Sort by')).toBeVisible()
    expect(screen.getByText('View as')).toBeVisible()

    await user.click(screen.getByRole('menuitemradio', { name: 'Title A–Z' }))
    expect(onSort).toHaveBeenCalledWith('title')
  })

  it('limpar um eixo manda NULO, e é uma opção da própria lista', async () => {
    // O que desfaz a escolha mora no controle que a fez (régua de 29/08).
    const { user, onType } = open({ type: 'movie' })
    await user.click(trigger())
    await user.click(axis(/^Media type/))
    await user.click(
      await screen.findByRole('menuitemradio', { name: 'Any type' }),
    )

    expect(onType).toHaveBeenCalledWith(null)
  })
})
