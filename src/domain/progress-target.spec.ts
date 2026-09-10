import { describe, expect, it } from 'vitest'
import { progressDelta } from './progress-target'

const at =
  (progress: number, total: number | null = null) =>
  (typed: string) =>
    progressDelta({ typed, progress, total })

describe('progressDelta', () => {
  it('devolve o delta que leva o contador até o alvo', () => {
    expect(at(12)('40')).toBe(28)
  })

  it('anda para TRÁS com delta negativo, que é a mesma escrita', () => {
    // Corrigir não reescreve a linha: é evento novo no log (brief, 3.11).
    // Voltar de 364 para 12 são 352 cliques no `−`, e ninguém faz isso.
    expect(at(364)('12')).toBe(-352)
  })

  it('devolve NULO quando o alvo é o valor de agora', () => {
    // Não há evento a gravar. Zero obrigaria todo chamador a distinguir "não
    // mexeu" de "inválido" com um `=== 0` que um deles esqueceria.
    expect(at(12)('12')).toBeNull()
  })

  it('recusa o que não é inteiro não negativo', () => {
    for (const typed of ['', '  ', 'abc', '12abc', '-3', '1.5', 'NaN']) {
      expect(at(12)(typed)).toBeNull()
    }
  })

  it('recusa passar do teto quando há teto', () => {
    expect(at(12, 24)('25')).toBeNull()
    expect(at(12, 24)('24')).toBe(12)
  })

  it('NÃO tem teto quando o total é nulo', () => {
    // Nulo é "não se sabe o fim" (o `12 / ?` da 3.11), e num mangá em
    // publicação não há número alto demais — recusar ali seria a tela decidir
    // que a obra acabou.
    expect(at(12, null)('999')).toBe(987)
  })

  it('aceita zerar', () => {
    // Recomeçar do zero é um gesto real, e `0` não é vazio.
    expect(at(12)('0')).toBe(-12)
  })
})
