import { describe, expect, it } from 'vitest'
import type { ImportProblem, ImportSourceState } from '@/services/import'
import {
  isTruncated,
  orderedProblems,
  resultFacts,
  splitSources,
} from './import-view'

const problem = (
  kind: ImportProblem['kind'],
  row: number | null,
): ImportProblem => ({ kind, row, params: {} }) as ImportProblem

const source = (slug: string): ImportSourceState =>
  ({ slug, available: true, reason: null }) as unknown as ImportSourceState

describe('orderedProblems', () => {
  /**
   * O caso que abriu a regra, visto na tela: o servidor grava os problemas de
   * LEITURA antes dos do aplicador, e a lista chegava `6, 7, 9, 8`.
   */
  it('ordena pela linha do arquivo, não pela ordem em que o servidor achou', () => {
    const vindos = [
      problem('invalid-status', 6),
      problem('invalid-status', 7),
      problem('missing-identity', 9),
      problem('missing-identity', 8),
    ]

    expect(orderedProblems(vindos).map((p) => p.row)).toEqual([6, 7, 8, 9])
  })

  /**
   * `row` nulo é o problema que não pertence a linha nenhuma — quem varre o
   * arquivo de cima a baixo o encontra depois de ter terminado.
   */
  it('manda problema sem linha para o FIM, nunca para o começo', () => {
    const vindos = [
      problem('unknown-media-type', null),
      problem('invalid-status', 3),
    ]

    expect(orderedProblems(vindos).map((p) => p.row)).toEqual([3, null])
  })

  /**
   * Entre problemas da MESMA linha a ordem do servidor é a informação boa — ela
   * diz em que fase cada um apareceu.
   */
  it('preserva a ordem do servidor entre problemas da mesma linha', () => {
    const vindos = [
      problem('invalid-status', 7),
      problem('missing-identity', 7),
      problem('invalid-number', 7),
    ]

    expect(orderedProblems(vindos).map((p) => p.kind)).toEqual([
      'invalid-status',
      'missing-identity',
      'invalid-number',
    ])
  })

  it('não muta o array que recebeu', () => {
    const vindos = [problem('invalid-status', 9), problem('invalid-status', 2)]

    orderedProblems(vindos)

    expect(vindos.map((p) => p.row)).toEqual([9, 2])
  })

  it('aguenta ausência — job que falhou não tem lista', () => {
    expect(orderedProblems(null)).toEqual([])
    expect(orderedProblems(undefined)).toEqual([])
  })
})

describe('splitSources', () => {
  /**
   * O defeito que a regra congela: a tela renderizava na ordem do array do
   * servidor, que é a ordem em que ele DECLARA as fontes — não uma decisão de
   * layout. Com o CSV em primeiro, as três empilhavam em coluna única.
   */
  it('tira o CSV do meio dos serviços, seja qual for a ordem que chegou', () => {
    const { services, csv } = splitSources([
      source('csv'),
      source('anilist'),
      source('mal'),
    ])

    expect(services.map((s) => s.slug)).toEqual(['anilist', 'mal'])
    expect(csv?.slug).toBe('csv')
  })

  it('preserva a ordem dos SERVIÇOS como o servidor a declarou', () => {
    const { services } = splitSources([
      source('mal'),
      source('csv'),
      source('anilist'),
    ])

    // Quais fontes existem, e em que ordem elas se leem entre si, é do
    // servidor. O que a tela decide é só onde o CSV vai.
    expect(services.map((s) => s.slug)).toEqual(['mal', 'anilist'])
  })

  /** Uma instalação pode não oferecer o CSV; a grade continua desenhável. */
  it('devolve CSV nulo quando ele não está entre as fontes', () => {
    expect(splitSources([source('mal')]).csv).toBeNull()
    expect(splitSources([]).csv).toBeNull()
    expect(splitSources(null).services).toEqual([])
  })
})

describe('resultFacts', () => {
  const job = (over: Partial<Parameters<typeof resultFacts>[0]> = {}) => ({
    status: 'done' as const,
    added: 0,
    skipped: 0,
    updated: 0,
    unmatched: 0,
    ...over,
  })

  /**
   * Zero em `added` é a resposta da pergunta que a pessoa fez. Sumir com a
   * linha faria um import que não trouxe nada parecer que não terminou.
   */
  it('mostra `added` SEMPRE, inclusive em zero', () => {
    expect(resultFacts(job())).toEqual(['added'])
    expect(resultFacts(job({ added: 426 }))).toEqual(['added'])
  })

  it('mostra os outros três só quando há o que contar', () => {
    expect(resultFacts(job({ skipped: 4 }))).toEqual(['added', 'skipped'])
    expect(resultFacts(job({ updated: 2 }))).toEqual(['added', 'updated'])
    expect(resultFacts(job({ unmatched: 9 }))).toEqual(['added', 'unmatched'])
  })

  it('mantém a ordem dos quatro quando todos aparecem', () => {
    expect(
      resultFacts(job({ added: 1, skipped: 1, updated: 1, unmatched: 1 })),
    ).toEqual(['added', 'skipped', 'updated', 'unmatched'])
  })

  /**
   * Job que falhou não chegou a rodar: os zeros diriam "nada entrou" quando o
   * fato é "nada foi tentado" — a mesma frase para duas coisas diferentes.
   */
  it('não mostra número nenhum num job que FALHOU', () => {
    expect(resultFacts(job({ status: 'failed', added: 12 }))).toEqual([])
  })
})

describe('isTruncated', () => {
  it('avisa quando a contagem passa do que a lista guarda', () => {
    expect(isTruncated(20, 1000)).toBe(true)
  })

  it('cala quando a lista mostra tudo', () => {
    expect(isTruncated(20, 20)).toBe(false)
    expect(isTruncated(0, 0)).toBe(false)
  })
})
