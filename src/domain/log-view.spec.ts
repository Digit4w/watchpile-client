import { describe, expect, it } from 'vitest'
import {
  copyText,
  flattenFields,
  isAtEnd,
  type LogLine,
  levelLabel,
  levelTone,
  rowKeys,
  startOfDay,
  withDaySeparators,
} from './log-view'

const line = (
  time: number,
  level: number,
  msg: string,
  extra: Partial<LogLine> = {},
): LogLine => ({ time, level, msg, fields: {}, err: null, ...extra })

describe('levelLabel e levelTone', () => {
  it('usa o vocabulário do pino, e só erro e aviso ganham cor', () => {
    expect([20, 30, 40, 50, 60].map(levelLabel)).toEqual([
      'DEBUG',
      'INFO',
      'WARN',
      'ERROR',
      'FATAL',
    ])
    expect([30, 40, 50, 60].map(levelTone)).toEqual([
      'quiet',
      'warning',
      'danger',
      'danger',
    ])
  })
})

describe('flattenFields', () => {
  it('achata objeto por ponto e deixa array como JSON', () => {
    expect(
      flattenFields({
        req: { method: 'GET', path: '/api/auth/me' },
        res: { status: 401 },
        ids: [1, 2],
        cancelled: false,
        title: '進撃の巨人',
      }),
    ).toEqual([
      'req.method=GET',
      'req.path=/api/auth/me',
      'res.status=401',
      'ids=[1,2]',
      'cancelled=false',
      'title=進撃の巨人',
    ])
  })
})

describe('withDaySeparators', () => {
  it('abre um dia na primeira linha e a cada virada, não a cada linha', () => {
    const night = new Date(2026, 8, 13, 23, 59).getTime()
    const later = new Date(2026, 8, 13, 23, 59, 30).getTime()
    const morning = new Date(2026, 8, 14, 0, 1).getTime()

    const kinds = withDaySeparators([
      line(night, 30, 'a'),
      line(later, 30, 'b'),
      line(morning, 30, 'c'),
    ]).map((item) => (item.kind === 'day' ? 'day' : item.line.msg))

    expect(kinds).toEqual(['day', 'a', 'b', 'day', 'c'])
  })

  it('separa pelo dia LOCAL', () => {
    const time = new Date(2026, 8, 14, 0, 30).getTime()
    expect(startOfDay(time)).toBe(new Date(2026, 8, 14).getTime())
  })
})

describe('copyText', () => {
  it('leva hora, nível, mensagem, campos e a stack indentada', () => {
    const text = copyText(
      [
        line(1, 30, 'import finished', { fields: { jobId: 41 } }),
        line(2, 50, 'art warm failed', {
          fields: { provider: 'mal' },
          err: {
            type: 'Error',
            message: 'locked',
            stack: 'Error: locked\n    at writeArt (art.store.js:88:18)',
          },
        }),
      ],
      (time) => `T${time}`,
    )

    expect(text).toBe(
      [
        'T1 INFO import finished jobId=41',
        'T2 ERROR art warm failed provider=mal',
        '    Error: locked',
        '    at writeArt (art.store.js:88:18)',
      ].join('\n'),
    )
  })

  it('cai na mensagem do erro quando não há stack', () => {
    const text = copyText(
      [
        line(1, 40, 'refused', {
          err: { type: null, message: 'nope', stack: null },
        }),
      ],
      () => '',
    )
    expect(text).toBe('WARN refused\n    nope')
  })
})

describe('rowKeys', () => {
  /**
   * O caso que o app rodando achou, 14/09/2026: uma rajada tem centenas de
   * "Request completed" no mesmo milissegundo, e as mais antigas que o `Load
   * older` põe no começo não podem mudar a chave das que já estavam.
   */
  it('não muda a chave das linhas que já estavam quando entra rajada antes', () => {
    const burst = (path: string) =>
      line(1, 30, 'Request completed', { fields: { req: { path } } })
    const current = [burst('/a'), burst('/b')]
    const older = [burst('/x'), burst('/y')]

    const before = rowKeys(current)
    const after = rowKeys([...older, ...current]).slice(older.length)

    expect(after).toEqual(before)
  })

  it('separa duas linhas idênticas campo a campo pela ocorrência', () => {
    const same = line(1, 30, 'Request completed')
    const keys = rowKeys([same, same])

    expect(new Set(keys).size).toBe(2)
  })
})

describe('isAtEnd', () => {
  it('tolera alguns pixels de folga no fim', () => {
    expect(
      isAtEnd({ scrollTop: 492, scrollHeight: 800, clientHeight: 300 }),
    ).toBe(true)
    expect(
      isAtEnd({ scrollTop: 400, scrollHeight: 800, clientHeight: 300 }),
    ).toBe(false)
  })
})
