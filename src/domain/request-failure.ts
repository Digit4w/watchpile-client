import { HttpError, UNREACHABLE } from '@/infra/lib/http-client'

/**
 * Por que um pedido ao NOSSO servidor não deu certo.
 *
 * São duas coisas diferentes e o app tratava como uma só:
 *
 * - `unreachable` — não houve resposta. O servidor está parado, o endereço está
 *   errado, ou a máquina de quem olha perdeu a rede. **Não há o que tentar de
 *   novo até algo mudar fora do app.**
 * - `failed` — houve resposta, e ela deu errado. O servidor está de pé e algo
 *   dentro dele falhou. **Tentar de novo é razoável**, e o rastro está no log
 *   dele.
 *
 * Sem a separação, a copy genérica escolhia um lado calada: os três catálogos
 * diziam *"Can't reach the server"* para qualquer falha, inclusive um 500 em
 * que o servidor respondeu perfeitamente bem. É a mesma régua que já dividiu
 * `provider-error` em `provider-refused` e `provider-down` (02/09/2026) — **o
 * que separa os dois é o que a pessoa pode FAZER**, não quem falhou.
 */
export type RequestFailure = 'unreachable' | 'failed'

/**
 * **O padrão é `failed`, e isso é decisão.**
 *
 * O que chega aqui como erro desconhecido — uma exceção do nosso próprio
 * código, um `throw` de biblioteca — é falha nossa que aconteceu com o servidor
 * respondendo. Chamar isso de "não consegui falar com o Watchpile" mandaria a
 * pessoa conferir um servidor que está de pé, que é exatamente a má atribuição
 * que o conserto do 504 do Jikan tirou da busca.
 *
 * Só o `UNREACHABLE` que o `http-client` grava é `unreachable`, porque só ele
 * significa que a rede não completou.
 */
export function requestFailure(error: unknown): RequestFailure {
  if (error instanceof HttpError && error.status === UNREACHABLE) {
    return 'unreachable'
  }
  return 'failed'
}

/**
 * Se vale a pena o TanStack Query tentar de novo sozinho.
 *
 * `new QueryClient()` sem configuração tenta **três vezes com backoff**, o que
 * é o padrão da biblioteca e nunca foi decisão nossa. O custo aparecia
 * justamente onde mais dói: com o servidor parado, toda tela ficava ~7s no
 * esqueleto antes de admitir que não ia dar.
 *
 * Resposta do servidor com `4xx` **nunca** se repete: ela é determinística, e
 * repetir um 404 dá 404 — que é a mesma frase que o quinto estado obrigatório
 * das telas de detalhe já carrega (design system, seção 6). `401` idem, e o
 * 503 de recusa da busca traz `reason` e uma saída própria na tela, então
 * insistir por baixo só atrasaria a explicação.
 *
 * O que sobra — servidor inalcançável e `5xx` — tenta **uma vez a mais**, que
 * cobre o soluço de um servidor local subindo, sem transformar uma tela de erro
 * numa espera longa.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < 1
}
