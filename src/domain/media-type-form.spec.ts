import { describe, expect, it } from 'vitest'
import {
  isMissing,
  localeState,
  localesOf,
  type NameDraftMap,
  toNameMap,
  verdictFor,
} from './media-type-form'

const empty = { name: '', plural: '', progressUnit: '' }

function draft(name: string, plural: string, progressUnit = ''): NameDraftMap {
  return { en: { name, plural, progressUnit } }
}

describe('localeState', () => {
  it('conta como completo quando nome e plural existem', () => {
    expect(
      localeState({ name: 'Movie', plural: 'Movies', progressUnit: '' }),
    ).toBe('complete')
  })

  it('ignora a unidade de progresso', () => {
    // Nulo é legítimo por dois motivos DIFERENTES — filme não conta nada, jogo
    // conta sem ter unidade natural (brief, 3.12). Exigi-la transformaria uma
    // ausência com significado em campo faltando.
    expect(
      localeState({ name: 'Game', plural: 'Games', progressUnit: '' }),
    ).toBe('complete')
  })

  it('trata só espaço como vazio', () => {
    expect(localeState({ name: '  ', plural: '  ', progressUnit: '' })).toBe(
      'empty',
    )
  })

  it('acusa metade preenchida', () => {
    expect(localeState({ name: 'Movie', plural: '', progressUnit: '' })).toBe(
      'partial',
    )
  })

  it('trata idioma ausente como vazio', () => {
    expect(localeState(undefined)).toBe('empty')
  })
})

describe('isMissing', () => {
  it('marca o idioma vazio, e não o que está sendo digitado', () => {
    // O ponto de `--color-warning` diz "falta traduzir", não "termina de
    // preencher" — quem digitou metade está no meio do trabalho.
    expect(isMissing(empty)).toBe(true)
    expect(isMissing({ name: 'Filme', plural: '', progressUnit: '' })).toBe(
      false,
    )
  })
})

describe('localesOf', () => {
  it('sempre oferece os idiomas do produto', () => {
    expect(localesOf({})).toEqual(['en', 'pt-BR'])
  })

  it('mantém um idioma que o produto não fala', () => {
    // Sem isto, salvar apagaria em silêncio uma tradução que outra ferramenta
    // escreveu: o PATCH substitui o mapa inteiro.
    const names = {
      es: { name: 'Película', plural: 'Películas', progressUnit: '' },
    }
    expect(localesOf(names)).toEqual(['en', 'pt-BR', 'es'])
  })

  it('não duplica um idioma do produto que já está no mapa', () => {
    expect(localesOf(draft('Movie', 'Movies'))).toEqual(['en', 'pt-BR'])
  })
})

describe('verdictFor', () => {
  it('deixa salvar com UM idioma preenchido, não todos', () => {
    // Exigir todos obrigaria um admin brasileiro a inventar o nome em inglês de
    // um tipo que só ele usa (design system, seção 5).
    expect(verdictFor(draft('Movie', 'Movies'))).toEqual({ savable: true })
  })

  it('recusa o formulário sem nenhum idioma', () => {
    expect(verdictFor({})).toEqual({ savable: false, reason: 'no-language' })
  })

  it('recusa idioma pela metade, dizendo qual', () => {
    // O servidor devolveria 400, e o app não tem toast pra dizer o motivo
    // depois — então a recusa se anuncia antes do clique.
    expect(
      verdictFor({
        en: { name: 'Movie', plural: 'Movies', progressUnit: '' },
        'pt-BR': { name: 'Filme', plural: '', progressUnit: '' },
      }),
    ).toEqual({ savable: false, reason: 'half-filled', locale: 'pt-BR' })
  })

  it('não confunde idioma vazio com idioma pela metade', () => {
    expect(
      verdictFor({
        en: { name: 'Movie', plural: 'Movies', progressUnit: '' },
        'pt-BR': empty,
      }),
    ).toEqual({ savable: true })
  })
})

describe('toNameMap', () => {
  it('apara o texto e transforma unidade vazia em nulo', () => {
    expect(toNameMap(draft('  Movie ', ' Movies ', '   '))).toEqual({
      en: { name: 'Movie', plural: 'Movies', progressUnit: null },
    })
  })

  it('tira do mapa o idioma vazio, que é como se apaga uma tradução', () => {
    const output = toNameMap({
      en: { name: 'Movie', plural: 'Movies', progressUnit: 'Parts' },
      'pt-BR': empty,
    })
    expect(Object.keys(output)).toEqual(['en'])
    expect(output.en?.progressUnit).toBe('Parts')
  })

  it('preserva um idioma fora dos do produto', () => {
    const output = toNameMap({
      es: { name: 'Película', plural: 'Películas', progressUnit: '' },
    })
    expect(output.es).toEqual({
      name: 'Película',
      plural: 'Películas',
      progressUnit: null,
    })
  })
})
