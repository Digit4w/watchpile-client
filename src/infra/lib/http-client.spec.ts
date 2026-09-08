import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpError, httpClient, UNREACHABLE } from './http-client'

/**
 * O elo que `domain/request-failure` assume: que a rejeição crua do `fetch`
 * vira um `HttpError` antes de sair daqui. Sem ele a regra pura estaria certa
 * sobre um erro que nunca chegaria nesse formato.
 */
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('quando o servidor não responde', () => {
  it('converte a rejeição do fetch num HttpError inalcançável', async () => {
    // É o que o navegador lança com o servidor parado: um TypeError cru, sem
    // status e com mensagem que muda de motor.
    vi.stubGlobal('fetch', () =>
      Promise.reject(new TypeError('Failed to fetch')),
    )

    const error = await httpClient.get('/api/entries').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(HttpError)
    expect((error as HttpError).status).toBe(UNREACHABLE)
  })

  it('vale também para o corpo binário, que não passa por `request`', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.reject(new TypeError('Failed to fetch')),
    )

    const error = await httpClient
      .postBlob('/api/import/csv', new Blob(['a']))
      .catch((e: unknown) => e)

    expect((error as HttpError).status).toBe(UNREACHABLE)
  })
})

describe('quando o servidor responde', () => {
  it('mantém o status da resposta, que não é ausência de resposta', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Boom' }), { status: 500 }),
      ),
    )

    const error = await httpClient.get('/api/entries').catch((e: unknown) => e)

    expect((error as HttpError).status).toBe(500)
  })
})
