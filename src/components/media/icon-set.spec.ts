import { describe, expect, it } from 'vitest'
import { FALLBACK_ICON, ICON_SET, iconFor } from './icon-set'

describe('iconFor', () => {
  it('resolve um glifo do acervo', () => {
    expect(iconFor('monitor-play')).toBe(ICON_SET['monitor-play'])
  })

  it('cai no genérico para glifo desconhecido', () => {
    /**
     * O caso real: o servidor devolve `icon` como string na leitura, e um banco
     * semeado por uma versão mais nova pode ter glifo que este build não
     * conhece. Sem o genérico, a carta renderizaria nada — que foi exatamente o
     * defeito silencioso que abrir o enum criou.
     */
    expect(iconFor('glifo-que-nao-existe')).toBe(FALLBACK_ICON)
    expect(iconFor('')).toBe(FALLBACK_ICON)
  })

  it('cobre os seis glifos que o servidor semeia', () => {
    for (const glyph of [
      'clapperboard',
      'monitor',
      'sparkles',
      'message-square',
      'gamepad-2',
      'book-open',
    ]) {
      expect(iconFor(glyph)).not.toBe(FALLBACK_ICON)
    }
  })

  it('tem o acervo inteiro, e o número bate com o do servidor', () => {
    expect(Object.keys(ICON_SET)).toHaveLength(94)
  })
})
