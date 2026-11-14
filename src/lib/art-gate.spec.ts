import { describe, expect, it } from 'vitest'
import { createArtGate, sharesOurConnections } from './art-gate'

describe('createArtGate', () => {
  it('grants up to the slot count at once and holds the rest', () => {
    const gate = createArtGate(2)
    const granted: number[] = []
    for (const id of [1, 2, 3, 4]) {
      gate.request(() => granted.push(id))
    }
    expect(granted).toEqual([1, 2])
  })

  it('hands a released slot to the oldest waiter', () => {
    const gate = createArtGate(1)
    const granted: string[] = []
    const releaseA = gate.request(() => granted.push('a'))
    gate.request(() => granted.push('b'))
    gate.request(() => granted.push('c'))

    releaseA()
    expect(granted).toEqual(['a', 'b'])
  })

  it('drops a waiter that gives up, so it never takes a slot', () => {
    const gate = createArtGate(1)
    const granted: string[] = []
    const releaseA = gate.request(() => granted.push('a'))
    const cancelB = gate.request(() => granted.push('b'))
    gate.request(() => granted.push('c'))

    cancelB()
    releaseA()
    expect(granted).toEqual(['a', 'c'])
  })

  it('ignores a second release, so one image cannot free two slots', () => {
    const gate = createArtGate(1)
    const granted: string[] = []
    const releaseA = gate.request(() => granted.push('a'))
    const releaseB = gate.request(() => granted.push('b'))
    gate.request(() => granted.push('c'))

    releaseA()
    releaseA()
    // só `b` entrou: o segundo release de `a` não abriu vaga para `c`
    expect(granted).toEqual(['a', 'b'])

    releaseB()
    expect(granted).toEqual(['a', 'b', 'c'])
  })
})

describe('sharesOurConnections', () => {
  const base = 'http://hermes.local:3210/library'

  it('counts relative and same-origin addresses as ours', () => {
    expect(sharesOurConnections('/api/entries/12/art', base)).toBe(true)
    expect(
      sharesOurConnections('http://hermes.local:3210/api/entries/12/art', base),
    ).toBe(true)
  })

  it('leaves another origin out, including another port on the same host', () => {
    expect(
      sharesOurConnections('https://image.tmdb.org/t/p/w342/x.jpg', base),
    ).toBe(false)
    expect(sharesOurConnections('http://hermes.local:8080/x.jpg', base)).toBe(
      false,
    )
  })
})
