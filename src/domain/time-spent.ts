/**
 * O tempo investido, entre a tela e a coluna — 10/09/2026 (brief, 3.12).
 *
 * `entries.time_spent` é **minuto inteiro**, e o campo é lido em horas e
 * minutos. A tradução mora aqui pelo mesmo motivo de `progress-target.ts`: é
 * regra decidível, e ela decide **se uma escrita acontece**.
 *
 * ── Por que DUAS caixas, e não uma de horas com decimal ────────────────────
 * Uma caixa de horas obrigaria a aceitar `38,5` — e aí a fração volta, agora na
 * tela em vez do schema, com um round-trip que perde: `2h05` são 2,083 horas, e
 * mostrar `2,1` de volta seria a tela mentindo sobre o que está gravado. Duas
 * caixas não arredondam nada.
 */
export type TimeFields = { hours: string; minutes: string }

/**
 * O total em minutos que as duas caixas descrevem, ou nulo se elas não
 * descrevem um.
 *
 * **As duas vazias devolvem `null`**, que é o "nunca registrou" da coluna — e é
 * assim que se apaga. Uma vazia e a outra preenchida conta a vazia como zero:
 * quem escreve `38` em horas e deixa minutos em branco quis dizer 38h, não quis
 * dizer nada.
 */
export function minutesFrom({ hours, minutes }: TimeFields): number | null {
  const h = hours.trim()
  const m = minutes.trim()

  if (h === '' && m === '') {
    return null
  }

  const hoursValue = h === '' ? 0 : Number(h)
  const minutesValue = m === '' ? 0 : Number(m)

  if (!Number.isInteger(hoursValue) || hoursValue < 0) {
    return null
  }
  if (!Number.isInteger(minutesValue) || minutesValue < 0) {
    return null
  }
  /**
   * Minuto acima de 59 **passa**, e é decisão: quem digita `90` na caixa de
   * minutos quis dizer uma hora e meia, e recusar seria a tela cobrando uma
   * conversão que ela sabe fazer. Ela devolve `1h30` no próximo render, que é
   * a resposta.
   */
  return hoursValue * 60 + minutesValue
}

/**
 * O contrário: o total gravado, repartido nas duas caixas.
 *
 * **Nulo devolve as duas VAZIAS**, e não `0`/`0`: zero é "registrei, e é zero",
 * e desenhá-lo em toda obra nova diria que alguém registrou.
 */
export function splitMinutes(total: number | null): TimeFields {
  if (total === null) {
    return { hours: '', minutes: '' }
  }
  const safe = Math.max(0, Math.trunc(total))
  return {
    hours: String(Math.floor(safe / 60)),
    minutes: String(safe % 60),
  }
}
