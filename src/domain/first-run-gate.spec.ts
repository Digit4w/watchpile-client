import { describe, expect, it } from 'vitest'
import { type GateInput, gateDecision } from './first-run-gate'

/**
 * O portão é o único ponto por onde TODA tela do app passa, e até 07/09/2026
 * ele não tinha teste nenhum — errar aqui não quebra uma tela, quebra a
 * entrada no produto.
 */
function input(over: Partial<GateInput> = {}): GateInput {
  return {
    pending: null,
    pathname: '/',
    statusPending: false,
    sessionPending: false,
    signedIn: false,
    ...over,
  }
}

describe('enquanto a resposta não existe', () => {
  it('segura o render enquanto o status da instalação não voltou', () => {
    expect(gateDecision(input({ statusPending: true }))).toEqual({
      kind: 'wait',
    })
  })

  it('espera a sessão quando ela decide entre o wizard e o login', () => {
    const decision = gateDecision(
      input({ pending: 'instance', sessionPending: true }),
    )
    expect(decision).toEqual({ kind: 'wait' })
  })

  it('NÃO espera a sessão quando falta criar a conta', () => {
    // Não há usuário no servidor, então a espera só pode terminar num 401 —
    // seria pôr o login atrás de uma pergunta já respondida.
    const decision = gateDecision(
      input({ pending: 'account', pathname: '/login', sessionPending: true }),
    )
    expect(decision).toEqual({ kind: 'render' })
  })
})

describe('o que a instalação exige', () => {
  it('manda pro login quando falta criar a conta', () => {
    expect(gateDecision(input({ pending: 'account' }))).toEqual({
      kind: 'redirect',
      to: '/login',
    })
  })

  it('manda pro wizard quem TEM sessão e falta configurar a instância', () => {
    const decision = gateDecision(
      input({ pending: 'instance', signedIn: true }),
    )
    expect(decision).toEqual({ kind: 'redirect', to: '/setup' })
  })

  it('manda pro login quem NÃO tem sessão e falta configurar a instância', () => {
    // O defeito que só apareceu no navegador: `/setup` exige sessão, então
    // mandar um deslogado pra lá o faz ver erro e concluir que o servidor
    // quebrou.
    expect(gateDecision(input({ pending: 'instance' }))).toEqual({
      kind: 'redirect',
      to: '/login',
    })
  })

  it('deixa renderizar quem já está no destino', () => {
    const decision = gateDecision(
      input({ pending: 'instance', signedIn: true, pathname: '/setup' }),
    )
    expect(decision).toEqual({ kind: 'render' })
  })
})

describe('com nada pendente', () => {
  it('tira do /login quem já tem sessão', () => {
    const decision = gateDecision(input({ pathname: '/login', signedIn: true }))
    expect(decision).toEqual({ kind: 'redirect', to: '/' })
  })

  it('DEIXA no /login quem não tem sessão', () => {
    // A regressão que este arquivo existe pra impedir: apertar o portão não
    // pode fechar a porta de entrada de quem precisa dela.
    expect(gateDecision(input({ pathname: '/login' }))).toEqual({
      kind: 'render',
    })
  })

  it('tira do /setup, porque não há o que configurar', () => {
    expect(gateDecision(input({ pathname: '/setup', signedIn: true }))).toEqual(
      {
        kind: 'redirect',
        to: '/',
      },
    )
  })

  it('não se mete em nenhuma outra rota', () => {
    for (const pathname of ['/', '/library', '/piles/3', '/settings/import']) {
      expect(gateDecision(input({ pathname, signedIn: true }))).toEqual({
        kind: 'render',
      })
    }
  })
})
