import type {
  ImportJob,
  ImportProblem,
  ImportSourceState,
} from '@/services/import'

/**
 * O que a tela de import DECIDE — a parte dela que não é desenho.
 *
 * ── Por que este módulo existe ──────────────────────────────────────────────
 * `/settings/import` foi construída sem teste nenhum do lado do cliente, e a
 * dívida estava registrada assim. **A saída não é instalar biblioteca de teste
 * de componente**: o Vitest daqui cobre `domain/`, que é puro por construção
 * (`biome.json` bloqueia React, Router e Query lá dentro), e o caminho que este
 * projeto já percorreu sete vezes é tirar a regra do componente e testá-la aqui
 * — `chip-fit`, `search-refusal`, `media-visibility`, `shows-counter`,
 * `initial-total`, `first-run-gate`, `provider-status`.
 *
 * **As duas primeiras regras daqui foram DEFEITOS de verdade**, vistos na tela
 * rodando em 07/09/2026, e é por isso que elas são as que mais valem congelar:
 * uma lista de problemas fora de ordem e três caixas empilhadas em coluna
 * única. Nenhuma das duas quebra teste de componente também — as duas são sobre
 * ORDEM, e ordem passa despercebida em asserção de existência.
 */

/**
 * Os problemas na ordem de quem vai CONSERTAR o arquivo.
 *
 * O servidor grava os problemas de LEITURA antes dos do aplicador, porque é
 * nessa ordem que ele os encontra — e a lista chegava `6, 7, 9, 8`. **A ordem
 * do servidor é DADO**: ela diz em que fase o problema apareceu, e isso é
 * verdade. O que a tela precisa é outra leitura do mesmo conjunto.
 *
 * **Problema sem linha vai pro fim**, e não pro começo: `row` nulo é o problema
 * que não pertence a nenhuma linha do arquivo, e quem está varrendo o arquivo
 * de cima a baixo o encontra depois de ter terminado.
 *
 * A ordenação é ESTÁVEL entre problemas da mesma linha — `sort` do V8 é estável
 * desde o ES2019 —, então dois problemas da linha 7 saem na ordem em que o
 * servidor os achou, que ali é a informação boa.
 */
export function orderedProblems(
  problems: readonly ImportProblem[] | null | undefined,
): ImportProblem[] {
  return [...(problems ?? [])].sort(
    (a, b) =>
      (a.row ?? Number.MAX_SAFE_INTEGER) - (b.row ?? Number.MAX_SAFE_INTEGER),
  )
}

export type SplitSources = {
  /** As fontes que são SERVIÇO — perfil por nome de usuário. */
  services: ImportSourceState[]
  /** A nossa, que é ARQUIVO. Nula numa instalação que não a ofereça. */
  csv: ImportSourceState | null
}

/**
 * O CSV se separa das outras, e a separação é de NATUREZA.
 *
 * As outras são serviços a reconhecer — marca, nome, campo de usuário; o CSV é
 * o **nosso formato**, e é ele que ocupa a fileira inteira da grade de duas
 * colunas. Três caixas numa grade de duas deixam uma órfã, e a órfã certa é a
 * que não é serviço.
 *
 * **O servidor diz QUAIS fontes existem; a tela diz como elas se arrumam.**
 * Renderizar na ordem do array dele — que é a ordem em que ele as declara, não
 * uma decisão de layout — empilhou as três em coluna única por dois dias, com o
 * CSV em primeiro. É o mesmo defeito da ordem dos problemas, um nível acima:
 * **herdar da resposta uma decisão que ela não tomou**.
 */
export function splitSources(
  sources: readonly ImportSourceState[] | null | undefined,
): SplitSources {
  const all = sources ?? []
  return {
    services: all.filter((source) => source.slug !== 'csv'),
    csv: all.find((source) => source.slug === 'csv') ?? null,
  }
}

/** Um dos quatro números do resultado. */
export type ResultFact = 'added' | 'skipped' | 'updated' | 'unmatched'

/**
 * Quais números o resultado mostra.
 *
 * **`added` SEMPRE, mesmo em zero.** É a resposta da pergunta que a pessoa
 * fez — "entrou o quê?" —, e um import que não trouxe nada precisa dizer isso
 * em voz alta, não sumir com a linha. Os outros três aparecem só quando há o
 * que contar: eles são recorte, e recorte vazio é ruído.
 *
 * **Job que FALHOU não mostra número nenhum**, e é decisão: ele não chegou a
 * rodar, então os zeros não seriam "nada entrou" e sim "nada foi tentado" — a
 * mesma frase para dois fatos diferentes. No lugar deles vai o motivo.
 */
export function resultFacts(job: {
  status: ImportJob['status']
  added: number
  skipped: number
  updated: number
  unmatched: number
}): ResultFact[] {
  if (job.status === 'failed') {
    return []
  }

  const facts: ResultFact[] = ['added']
  if (job.skipped > 0) {
    facts.push('skipped')
  }
  if (job.updated > 0) {
    facts.push('updated')
  }
  if (job.unmatched > 0) {
    facts.push('unmatched')
  }
  return facts
}

/**
 * A lista de problemas tem teto e a contagem não — a tela precisa dizer qual
 * das duas está vendo.
 *
 * O servidor guarda um número limitado de problemas por job e continua contando
 * os que passaram; sem esta frase, um CSV com mil linhas ruins mostraria vinte
 * problemas e a pessoa concluiria que foram vinte.
 */
export function isTruncated(shown: number, counted: number): boolean {
  return counted > shown
}
