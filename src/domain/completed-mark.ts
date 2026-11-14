import type { EntryStatus } from './media'

/**
 * O ✓ de `completed` na carta — 14/11/2026, decisão do dono, com mockup
 * (`design/mockups/entry-card.html`, item 1 do handoff).
 *
 * ── O que decide é o STATUS, nunca o número ─────────────────────────────────
 * Status e progresso são independentes (brief, 3.16): `completed` em `12 / 24`
 * é legítimo (parei ali e dou por encerrado), e `24 / 24` em `watching`
 * também. Deduzir "acabou" de `progress === total` marcaria a segunda e
 * esqueceria a primeira — exatamente a inferência que a carta fazia sem
 * marcar nada, e que este ✓ veio substituir.
 *
 * ── Por que o "/ total" some num caso só ────────────────────────────────────
 * Medido no mockup: no piso da carta (133px) o número longo come a largura dos
 * botões `+`/`−`, e `✓ 1094 / 1094` os deixava com 14px. Quando a obra está
 * concluída **no fim**, o ✓ já diz o que o "/ 1094" diria, então ele sai e
 * sobra `✓ 1094`. Concluída no MEIO, o total é informação — é ele que diz que
 * parou antes — e fica. Total desconhecido também fica: `551 / ?` diz que o
 * fim não é sabido, e isso não é redundante com ✓.
 */
export function completedMark({
  status,
  progress,
  total,
}: {
  status: EntryStatus
  progress: number
  total: number | null
}): { done: boolean; showTotal: boolean } {
  const done = status === 'completed'
  return { done, showTotal: !(done && total !== null && progress === total) }
}
