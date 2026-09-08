import { describe, expect, it } from 'vitest'
import { dockMagnification } from './dockMotion'

describe('dockMagnification', () => {
  it('uses a restrained cosine falloff', () => {
    expect(dockMagnification(0)).toEqual({ scale: 1.18, lift: 10 })
    expect(dockMagnification(116)).toEqual({ scale: 1, lift: 0 })
    expect(dockMagnification(200)).toEqual({ scale: 1, lift: 0 })
  })
})
