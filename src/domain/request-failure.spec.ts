import { describe, expect, it } from 'vitest'
import { HttpError, UNREACHABLE } from '@/infra/lib/http-client'
import { requestFailure, shouldRetry } from './request-failure'

describe('requestFailure', () => {
  it('chama de inalcançável só o que nunca teve resposta', () => {
    const error = new HttpError(UNREACHABLE, 'Failed to fetch')
    expect(requestFailure(error)).toBe('unreachable')
  })

  it('trata resposta de erro do servidor como falha, não como ausência', () => {
    // O servidor respondeu — está de pé. Dizer "não consegui falar com ele"
    // mandaria a pessoa conferir o que está funcionando.
    expect(requestFailure(new HttpError(500, 'Boom'))).toBe('failed')
    expect(requestFailure(new HttpError(404, 'Not found'))).toBe('failed')
  })

  it('trata erro desconhecido como falha, nunca como inalcançável', () => {
    // Exceção do nosso próprio código aconteceu COM o servidor respondendo.
    expect(requestFailure(new TypeError('x is not a function'))).toBe('failed')
    expect(requestFailure('algo')).toBe('failed')
    expect(requestFailure(null)).toBe('failed')
  })
})

describe('shouldRetry', () => {
  it('nunca repete resposta 4xx', () => {
    // Determinística: repetir um 404 dá 404, e insistir só atrasa a explicação
    // que a tela já sabe dar.
    for (const status of [400, 401, 403, 404, 409, 499]) {
      expect(shouldRetry(0, new HttpError(status, ''))).toBe(false)
    }
  })

  it('dá uma segunda chance ao servidor inalcançável', () => {
    const error = new HttpError(UNREACHABLE, '')
    expect(shouldRetry(0, error)).toBe(true)
    expect(shouldRetry(1, error)).toBe(false)
  })

  it('dá uma segunda chance ao 5xx', () => {
    expect(shouldRetry(0, new HttpError(503, ''))).toBe(true)
    expect(shouldRetry(1, new HttpError(503, ''))).toBe(false)
  })

  it('não deixa erro desconhecido tentar pra sempre', () => {
    expect(shouldRetry(0, new Error('?'))).toBe(true)
    expect(shouldRetry(1, new Error('?'))).toBe(false)
  })
})
