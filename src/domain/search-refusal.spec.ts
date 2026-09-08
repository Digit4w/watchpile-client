import { describe, expect, it } from 'vitest'
import { HttpError } from '@/infra/lib/http-client'
import { searchRefusalOf } from './search-refusal'

function refusal(reason: string) {
  return new HttpError(503, 'qualquer frase', {
    message: 'qualquer frase',
    reason,
  })
}

describe('a recusa da busca', () => {
  it('condição da instalação não é falha', () => {
    // A busca não quebrou; ela não teve onde acontecer. `danger` aqui gastaria
    // o sinal que o próximo aviso, o de verdade, vai precisar.
    expect(searchRefusalOf(refusal('no-provider'))?.severity).toBe('condition')
    expect(searchRefusalOf(refusal('not-configured'))?.severity).toBe(
      'condition',
    )
    expect(searchRefusalOf(refusal('rate-limited'))?.severity).toBe('condition')
  })

  it('provedor que recusou ou sumiu é falha', () => {
    expect(searchRefusalOf(refusal('provider-refused'))?.severity).toBe(
      'failure',
    )
    expect(searchRefusalOf(refusal('unreachable'))?.severity).toBe('failure')
  })

  /**
   * **O que separa os dois grupos é se há o que ARRUMAR, não quem falhou.**
   *
   * O provedor cair do lado dele é falha DELE, e mesmo assim entra em
   * `condition`: a resposta de quem lê é a mesma do `rate-limited` — esperar.
   * Este é o teste que impede alguém de "consertar" a linha por simetria, vendo
   * um 5xx classificado como condição e achando que é engano.
   */
  it('provedor falhando do lado dele é condição: não há o que arrumar', () => {
    expect(searchRefusalOf(refusal('provider-down'))?.severity).toBe(
      'condition',
    )
  })

  /**
   * O motivo que saiu do contrato em 02/09/2026 não pode voltar por uma porta
   * lateral: um servidor velho falando com este cliente cai no estado de erro,
   * que é a saída certa pra uma forma que a tela não sabe desenhar.
   */
  it('o `provider-error` de antes da divisão não é mais recusa conhecida', () => {
    expect(searchRefusalOf(refusal('provider-error'))).toBeNull()
  })

  it('a frase do servidor viaja junto — cada motivo tem a sua saída', () => {
    expect(searchRefusalOf(refusal('rate-limited'))?.message).toBe(
      'qualquer frase',
    )
  })

  it('erro de rede NÃO é recusa — o servidor não respondeu', () => {
    // Aqui a saída é "Try again"; numa recusa ele repetiria o mesmo nada.
    expect(searchRefusalOf(new HttpError(500, 'boom'))).toBeNull()
    expect(searchRefusalOf(new Error('offline'))).toBeNull()
  })

  it('404 não é recusa: o tipo não existe, e tentar de novo dá 404 outra vez', () => {
    expect(searchRefusalOf(new HttpError(404, 'no media type'))).toBeNull()
  })

  it('503 sem motivo conhecido cai no estado de erro, não inventa forma', () => {
    expect(
      searchRefusalOf(new HttpError(503, 'x', { reason: 'sei-la' })),
    ).toBeNull()
    expect(searchRefusalOf(new HttpError(503, 'x', null))).toBeNull()
  })
})
