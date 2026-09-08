/**
 * Para onde mandar quem acabou de chegar — a regra pura por trás do portão do
 * `__root`.
 *
 * Ela morava dentro do componente, e mudá-la era mexer no único ponto por onde
 * TODA tela do app passa, sem rede nenhuma. Aqui ela é do mesmo tipo que
 * `widget-fit` e `chip-fit`: entra estado, sai decisão, e o componente só
 * obedece.
 */

export type SetupPending = 'account' | 'instance' | null

export type GateInput = {
  /** O que falta na INSTALAÇÃO, segundo `GET /api/auth/status`. */
  pending: SetupPending
  pathname: string
  /** A consulta de status ainda não respondeu. */
  statusPending: boolean
  /** A consulta de sessão ainda não respondeu. */
  sessionPending: boolean
  signedIn: boolean
}

export type GateDecision =
  /** Segura o render: a resposta ainda não existe. */
  | { kind: 'wait' }
  | { kind: 'redirect'; to: '/login' | '/setup' | '/' }
  | { kind: 'render' }

/**
 * Onde cada resposta da INSTALAÇÃO manda quem chegou.
 *
 * **`pending` é fato da instalação; a sessão é de quem está olhando**, e as
 * duas decidem juntas. Foi o defeito que só apareceu no navegador: com o admin
 * já criado e o wizard por terminar, um visitante DESLOGADO era mandado pra
 * `/setup` — uma tela que ele não consegue usar, porque a lista de tipos exige
 * sessão. Ele veria o estado de erro e concluiria que o servidor está quebrado.
 */
function destinationOf(
  pending: SetupPending,
  signedIn: boolean,
): '/login' | '/setup' | null {
  if (pending === 'account') {
    return '/login'
  }
  if (pending === 'instance') {
    return signedIn ? '/setup' : '/login'
  }
  return null
}

/**
 * Quando a sessão precisa ser ESPERADA antes de decidir.
 *
 * Só quando ela pode mudar o destino, e isso evita um ping-pong: em
 * `pending: 'account'` não existe usuário no servidor, e segurar a tela até um
 * 401 voltar poria o login atrás de uma espera que só pode terminar de um
 * jeito.
 *
 * **`/login` com nada pendente entrou em 07/09/2026.** Sem ela, quem já tem
 * sessão via o formulário de entrar por um quadro antes de ser mandado embora
 * — a piscada que a seção 11 recusa, e o motivo pelo qual este portão segura o
 * render em vez de só redirecionar.
 */
function needsSession(pending: SetupPending, onLogin: boolean): boolean {
  return pending === 'instance' || (pending === null && onLogin)
}

export function gateDecision({
  pending,
  pathname,
  statusPending,
  sessionPending,
  signedIn,
}: GateInput): GateDecision {
  const onLogin = pathname === '/login'

  if (statusPending || (needsSession(pending, onLogin) && sessionPending)) {
    return { kind: 'wait' }
  }

  const target = destinationOf(pending, signedIn)
  if (target) {
    return pathname === target
      ? { kind: 'render' }
      : { kind: 'redirect', to: target }
  }

  /**
   * **Com nada pendente, duas telas continuam sendo o lugar errado.**
   *
   * `/setup` porque não há o que configurar — o servidor recusa com 409 de
   * qualquer jeito, e uma tela alcançável que só sabe falhar é affordance
   * descrevendo o que não existe.
   *
   * `/login` porque quem já tem sessão não tem o que fazer num formulário de
   * entrar. Sem isto, voltar pelo histórico ou digitar o endereço servia a
   * tela de login a quem já estava dentro, e entrar de novo era a única saída
   * visível.
   */
  if (pathname === '/setup' || (onLogin && signedIn)) {
    return { kind: 'redirect', to: '/' }
  }

  return { kind: 'render' }
}
