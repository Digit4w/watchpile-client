import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MediaTypeInfo } from '@/domain/media-type'
import type { TypeSources } from '@/domain/search-scope'
import { render } from '@/test/render'
import { SearchScope, SourcePicker } from './search-scope'

/**
 * O controle de escopo e o de fonte, que são o **mesmo par de parâmetros da
 * consulta** e por isso moram no mesmo arquivo.
 *
 * Ele entrou primeiro na fila do item 27 porque **mudou duas vezes num dia**:
 * a fileira de chips caiu em 01/09, a fonte entrou no menu em 02/09, e em
 * 09/09 o `<select>` do `SourcePicker` virou popover. Peça que se mexe tanto é
 * onde uma regra some sem ninguém decidir.
 *
 * **Ele não fala com serviço nenhum** — recebe tudo por prop —, então não há o
 * que fingir: o corte em `services/` não tem o que cortar aqui. O que ele
 * decide, e que não cabe em `domain/` porque é sobre o que a pessoa vê e
 * toca:
 *
 * - o AGRUPAMENTO (quem tem fonte primeiro; o cabeçalho só existe com algo sob
 *   ele)
 * - que a fonte da URL vale **dentro do tipo ativo**, e em nenhum outro
 * - que abrir a lista de fontes não fecha o menu, mas escolher fecha
 * - que a sublista aberta **não sobrevive** ao fechamento do menu
 * - que com UMA fonte o seletor é TEXTO, porque um seletor de uma opção mente
 *   sobre ter escolha
 */

const type = (slug: string, plural: string): MediaTypeInfo =>
  ({
    slug,
    name: plural,
    plural,
    icon: 'sparkles',
    progressUnit: null,
    countsProgress: true,
    providers: [],
    effectiveProvider: null,
  }) as unknown as MediaTypeInfo

const jikan = { slug: 'jikan', name: 'Jikan' }
const kitsu = { slug: 'kitsu', name: 'Kitsu' }
const tmdb = { slug: 'tmdb', name: 'TMDB' }

const TYPES = [
  type('anime', 'Anime'),
  type('manga', 'Manga'),
  type('movie', 'Movies'),
  type('book', 'Books'),
]

/**
 * **`anime` e `manga` compartilham as duas fontes de propósito, com `current`
 * diferente**, e isso não é fixture caprichosa: sem esse par o teste da fonte
 * da URL **passava por acidente**.
 *
 * Com cada tipo tendo fontes disjuntas, quebrar `selectedFor` para ignorar o
 * tipo ativo não muda nada na tela — `effectiveSource` recebe um slug que não
 * está nas opções daquele tipo e cai na fonte efetiva, mascarando o defeito.
 * Só um tipo vizinho que ACEITA o mesmo slug separa as duas implementações.
 */
const SOURCES = new Map<string, TypeSources>([
  ['anime', { current: kitsu, options: [jikan, kitsu] }],
  ['manga', { current: kitsu, options: [jikan, kitsu] }],
  ['movie', { current: tmdb, options: [tmdb] }],
])

function open(props: Partial<Parameters<typeof SearchScope>[0]> = {}): {
  user: ReturnType<typeof userEvent.setup>
  onScope: ReturnType<typeof vi.fn>
  onSource: ReturnType<typeof vi.fn>
} {
  const onScope = vi.fn()
  const onSource = vi.fn()
  const user = userEvent.setup()

  render(
    <SearchScope
      scope="anime"
      source={null}
      types={TYPES}
      sourceByType={SOURCES}
      onScope={onScope}
      onSource={onSource}
      {...props}
    />,
  )

  return { user, onScope, onSource }
}

const trigger = () =>
  screen.getByRole('button', { name: 'Media type to search' })

describe('SearchScope', () => {
  it('agrupa quem tem fonte antes de quem não tem, com o nome da fonte na linha', async () => {
    const { user } = open()
    await user.click(trigger())

    // A fonte aparece na linha do tipo, e é o segundo alvo dela — `anime` e
    // `manga` respondem pelo Kitsu, então são duas.
    expect(screen.getByRole('menuitemradio', { name: /Anime/ })).toBeVisible()
    expect(screen.getAllByText('Kitsu')).toHaveLength(2)

    // O cabeçalho responde em PALAVRA o que a bolinha tentava dizer com um
    // glifo mudo — e ninguém SOME da lista, que era o defeito da fileira.
    expect(screen.getByText('No source')).toBeVisible()
    expect(screen.getByRole('menuitemradio', { name: /Books/ })).toBeVisible()
  })

  it('não desenha o cabeçalho quando não há nada sob ele', async () => {
    // Seção vazia com título é chrome que não faz nada.
    const { user } = open({ types: [type('anime', 'Anime')] })
    await user.click(trigger())

    expect(screen.queryByText('No source')).not.toBeInTheDocument()
  })

  it('mostra a fonte EFETIVA de cada tipo, e a da URL só no tipo ativo', async () => {
    // `provider` na URL é da consulta atual, e trocar de tipo a limpa. Mostrá-la
    // na linha de outro tipo prometeria uma fonte que aquele tipo não vai usar.
    //
    // `manga` aceita `jikan` tanto quanto `anime`, e é isso que faz a asserção
    // valer: com fontes disjuntas, `effectiveSource` esconderia o defeito.
    const { user } = open({ scope: 'anime', source: 'jikan' })
    await user.click(trigger())

    // Uma vez só: a linha de `anime`. A de `manga` mostra a efetiva dela.
    expect(screen.getAllByText('Jikan')).toHaveLength(1)
    expect(screen.getAllByText('Kitsu')).toHaveLength(1)
    expect(screen.getByText('TMDB')).toBeVisible()
  })

  it('abrir a lista de fontes NÃO fecha o menu; escolher uma fecha', async () => {
    // Escolher fonte é o segundo passo da mesma pergunta, não outra.
    const { user, onSource } = open()
    await user.click(trigger())
    await user.click(
      screen.getByRole('button', { name: 'Change source for Anime' }),
    )

    expect(screen.getByText('No source')).toBeVisible()

    await user.click(screen.getByRole('menuitemradio', { name: 'Jikan' }))
    expect(onSource).toHaveBeenCalledWith('anime', 'jikan')
  })

  it('esquece a sublista aberta ao fechar o menu', async () => {
    // Reabrir com uma sublista aberta mostraria estado de uma visita anterior,
    // e o menu passaria a ter memória que ninguém pediu.
    const { user } = open()
    await user.click(trigger())
    await user.click(
      screen.getByRole('button', { name: 'Change source for Anime' }),
    )
    expect(screen.getByRole('menuitemradio', { name: 'Jikan' })).toBeVisible()

    await user.keyboard('{Escape}')
    await user.click(trigger())

    expect(
      screen.queryByRole('menuitemradio', { name: 'Jikan' }),
    ).not.toBeInTheDocument()
  })

  it('escolher um tipo manda o slug e fecha', async () => {
    const { user, onScope } = open()
    await user.click(trigger())
    await user.click(screen.getByRole('menuitemradio', { name: /Movies/ }))

    expect(onScope).toHaveBeenCalledWith('movie')
  })

  it('deixa escolher um tipo SEM fonte, e ele não oferece troca de fonte', async () => {
    // A explicação continua a um clique (brief, 3.10) — o tipo sem fonte não
    // some, ele só não tem o segundo alvo.
    const { user, onScope } = open()
    await user.click(trigger())

    expect(
      screen.queryByRole('button', { name: 'Change source for Books' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('menuitemradio', { name: /Books/ }))
    expect(onScope).toHaveBeenCalledWith('book')
  })
})

describe('SourcePicker', () => {
  it('é TEXTO quando há uma fonte só', () => {
    // Um seletor de uma opção mente sobre ter escolha — e o rótulo `Source` ao
    // lado já explica que palavra é aquela.
    render(<SourcePicker sources={[tmdb]} current="tmdb" onSource={() => {}} />)

    expect(screen.getByText('TMDB')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Change source' }),
    ).not.toBeInTheDocument()
  })

  it('vira controle quando há mais de uma', async () => {
    const user = userEvent.setup()
    const onSource = vi.fn()
    render(
      <SourcePicker
        sources={[jikan, kitsu]}
        current="kitsu"
        onSource={onSource}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Change source' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Jikan' }))

    expect(onSource).toHaveBeenCalledWith('jikan')
  })
})
