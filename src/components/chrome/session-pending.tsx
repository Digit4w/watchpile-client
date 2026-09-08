/**
 * O que ocupa a tela enquanto a sessão não respondeu.
 *
 * Um quadrado pulsando e nada mais: era a peça que `/`, `/library`, `/piles` e
 * `/piles/:id` desenhavam à mão, extraída junto com `useRequireSession` e a
 * única cópia dela desde 04/09/2026. Não passa pelo limiar de
 * `useDelayedPending` de propósito — aqui não há tela por baixo pra piscar, e o
 * que a espera cobre é a decisão de renderizar o app ou mandar pro login, que
 * não pode acontecer duas vezes.
 */
export function SessionPending() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-surface">
      <div className="h-8 w-8 animate-pulse rounded-md bg-raised" />
    </div>
  )
}
