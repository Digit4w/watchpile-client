import type { paths } from '@/infra/lib/api-types'
import { HttpError } from '@/infra/lib/http-client'

/**
 * Os seis motivos pelos quais uma busca não aconteceu (brief, 3.10).
 *
 * Eles existem para a busca **não mentir**: procurar num tipo sem provedor não
 * devolve lista vazia, porque lista vazia significa "procurei e não achei", e
 * usar a mesma tela pros dois casos faz a pessoa concluir que a obra não existe
 * no catálogo — quando não houve catálogo nenhum.
 *
 * **Eram cinco até 02/09/2026**, quando `provider-error` virou dois. Ela precisa
 * casar com o `z.enum` do servidor, e quem prova que casa é a checagem contra o
 * tipo gerado, no fim deste arquivo.
 */
export const SEARCH_REASONS = [
  'no-provider',
  'not-configured',
  'rate-limited',
  'provider-refused',
  'provider-down',
  'unreachable',
] as const

export type SearchReason = (typeof SEARCH_REASONS)[number]

/**
 * **A recusa tem a gravidade do fato** (design system, seção 5, 01/09/2026).
 *
 * Quatro dos seis motivos não são defeito: a busca não quebrou, ela não teve
 * onde acontecer. Pintá-los de `danger` é a régua do sinal virada contra si
 * mesma — o custo é o próximo aviso, o de verdade, não ser lido.
 *
 * **O que separa os dois grupos é se há o que ARRUMAR** — 02/09/2026, ao
 * dividir `provider-error`. Não é "quem falhou": o provedor cair do lado dele é
 * falha dele e mesmo assim entra em `condition`, porque a resposta de quem lê é
 * a mesma do `rate-limited` — esperar. `danger` fica onde alguém tem trabalho a
 * fazer.
 */
export type SearchSeverity = 'condition' | 'failure'

const SEVERITY: Record<SearchReason, SearchSeverity> = {
  /** Ninguém conectou provedor a este tipo. Condição desta instalação. */
  'no-provider': 'condition',
  /** O provedor existe e falta a chave. Condição desta instalação. */
  'not-configured': 'condition',
  /** Só esperar. Nada quebrou, e o limite é compartilhado pelo servidor. */
  'rate-limited': 'condition',
  /**
   * `4xx` — o provedor recusou o NOSSO pedido. Chave errada, parâmetro
   * inválido: há configuração a arrumar, e é o único caso que oferece o botão
   * de Settings.
   */
  'provider-refused': 'failure',
  /**
   * `5xx` — o provedor está falhando do lado dele, e não há o que configurar.
   * Mandar pra tela de provedores aqui seria pedir que se arrume uma
   * configuração que está certa, que foi o que o 504 do Jikan expôs.
   */
  'provider-down': 'condition',
  /** O provedor não respondeu. */
  unreachable: 'failure',
}

export type SearchRefusal = {
  reason: SearchReason
  severity: SearchSeverity
  message: string
  /**
   * A frase que o PROVEDOR escreveu, quando ele escreveu uma — 10/09/2026.
   *
   * **Ela não se junta ao `message`, e é decisão:** concatenada viraria copy
   * nossa, e a nossa copy passa pelo catálogo enquanto esta **vem em inglês e
   * não passa**. Separada, a tela pode atribuí-la — *a frase que EXPLICA um
   * resultado é da fonte que o produziu* (design system, seção 8).
   *
   * Nula é o caso comum: só `provider-refused` a carrega, e mesmo ali só quando
   * o provedor escreveu algo legível. Nula, o painel é o de ontem.
   */
  providerMessage: string | null
}

function isReason(value: unknown): value is SearchReason {
  return SEARCH_REASONS.includes(value as SearchReason)
}

/**
 * Lê a recusa de um erro de rede — ou devolve nulo, que quer dizer "isto não é
 * uma recusa, é o estado de ERRO".
 *
 * A distinção é a que a seção 6 do design system fixa: **na recusa o nosso
 * servidor respondeu, e respondeu certo**; no erro ele não respondeu. Tratar os
 * dois como um só daria um "Try again" que repete o mesmo nada.
 *
 * Fica em `domain/` porque é regra decidível, e regra decidível deste projeto
 * mora onde o Vitest alcança (`client/CLAUDE.md`).
 */
export function searchRefusalOf(error: unknown): SearchRefusal | null {
  if (!(error instanceof HttpError) || error.status !== 503) {
    return null
  }

  const body = error.data
  if (typeof body !== 'object' || body === null) {
    return null
  }

  const reason = (body as { reason?: unknown }).reason
  if (!isReason(reason)) {
    return null
  }

  const fromProvider = (body as { providerMessage?: unknown }).providerMessage

  return {
    reason,
    severity: SEVERITY[reason],
    message: error.message,
    /**
     * Validado e não confiado: o campo é novo no contrato, e uma instalação com
     * o servidor atrasado devolve o corpo sem ele — que é o caso que a régua de
     * 3.7 diz quebrar em RUNTIME e não em build.
     */
    providerMessage:
      typeof fromProvider === 'string' && fromProvider.trim() !== ''
        ? fromProvider
        : null,
  }
}

/**
 * A prova de que a lista acima é o `z.enum` do servidor, e não uma segunda
 * cópia à mão dele (brief, 3.7).
 *
 * Sem isto, motivo novo no contrato chega calado: o `isReason` recusa o valor
 * desconhecido, `searchRefusalOf` devolve nulo, e a tela mostra o estado de
 * ERRO no lugar da recusa — que é a saída errada, porque o nosso servidor
 * respondeu e respondeu certo. **Falha de contrato tem que quebrar o build, não
 * a tela.**
 *
 * A checagem vai nas **duas direções** de propósito: uma só provaria metade —
 * que a nossa lista cabe no contrato, mas não que ela o cobre inteiro, que é
 * justamente o caso do motivo novo.
 */
type ContractReason = NonNullable<
  paths['/api/search']['get']['responses'][503]['content']['application/json']['reason']
>

type _CoversTheContract = ContractReason extends SearchReason ? true : never
type _FitsTheContract = SearchReason extends ContractReason ? true : never

const _proof: [_CoversTheContract, _FitsTheContract] = [true, true]
void _proof
