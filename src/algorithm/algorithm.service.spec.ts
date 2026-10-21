import { AlgorithmService } from './algorithm.service.js'

/** True when every element is <= the next one. */
const isAscending = (values: number[]) =>
  values.every((v, i) => i === 0 || values[i - 1] <= v)

/** Counts occurrences, so two arrays can be compared as multisets without sorting. */
const counts = (values: number[]) => {
  const map = new Map<number, number>()
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1)
  return map
}

/** Ascending array of random integers in [0, max], built without sorting. */
const randomAscending = (length: number, max = 1000) => {
  const values: number[] = []
  let current = 0
  for (let i = 0; i < length; i++) {
    current += Math.floor(Math.random() * (max / Math.max(length, 1) + 1))
    values.push(current)
  }
  return values
}

describe('AlgorithmService', () => {
  const service = new AlgorithmService()
  const merge = service.merge.bind(service)

  describe('merge', () => {
    it('merges the example collections', () => {
      expect(merge([10, 7, 4, 1], [0, 2, 5, 8], [0, 3, 6, 9, 12])).toEqual([
        0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12,
      ])
    })

    describe('empty collections', () => {
      it('returns an empty array when all collections are empty', () => {
        expect(merge([], [], [])).toEqual([])
      })

      it.each([
        ['collection_1 only', [3, 2, 1], [], [], [1, 2, 3]],
        ['collection_2 only', [], [1, 2, 3], [], [1, 2, 3]],
        ['collection_3 only', [], [], [1, 2, 3], [1, 2, 3]],
        ['collection_1 empty', [], [1, 4], [2, 3], [1, 2, 3, 4]],
        ['collection_2 empty', [4, 1], [], [2, 3], [1, 2, 3, 4]],
        ['collection_3 empty', [4, 1], [2, 3], [], [1, 2, 3, 4]],
      ])('handles %s', (_, c1, c2, c3, expected) => {
        expect(merge(c1, c2, c3)).toEqual(expected)
      })
    })

    describe('single elements', () => {
      it('merges one element from each collection', () => {
        expect(merge([5], [0], [3])).toEqual([0, 3, 5])
      })

      it('handles a zero in every collection', () => {
        expect(merge([0], [0], [0])).toEqual([0, 0, 0])
      })
    })

    describe('duplicates', () => {
      it('keeps duplicates within a collection', () => {
        expect(merge([5, 5, 2, 2], [1, 1, 3], [4, 4])).toEqual([
          1, 1, 2, 2, 3, 4, 4, 5, 5,
        ])
      })

      it('keeps duplicates across collections', () => {
        expect(merge([3, 2, 1], [1, 2, 3], [1, 2, 3])).toEqual([
          1, 1, 1, 2, 2, 2, 3, 3, 3,
        ])
      })

      it('handles collections of the same repeated value', () => {
        expect(merge([7, 7], [7], [7, 7, 7])).toEqual([7, 7, 7, 7, 7, 7])
      })
    })

    describe('ordering between collections', () => {
      it('handles collections that do not overlap', () => {
        expect(merge([9, 8, 7], [0, 1, 2], [3, 4, 5])).toEqual([
          0, 1, 2, 3, 4, 5, 7, 8, 9,
        ])
      })

      it('handles fully interleaved collections', () => {
        expect(merge([7, 4, 1], [0, 3, 6], [2, 5, 8])).toEqual([
          0, 1, 2, 3, 4, 5, 6, 7, 8,
        ])
      })

      it('handles collections of very different lengths', () => {
        expect(merge([100], [0, 1, 2, 3, 4, 5], [50])).toEqual([
          0, 1, 2, 3, 4, 5, 50, 100,
        ])
      })

      it('handles the smallest value being in collection_1', () => {
        expect(merge([9, 0], [1, 2], [3])).toEqual([0, 1, 2, 3, 9])
      })
    })

    describe('integer range', () => {
      it('handles negative integers', () => {
        expect(merge([3, -1, -5], [-4, 0, 2], [-3, 1])).toEqual([
          -5, -4, -3, -1, 0, 1, 2, 3,
        ])
      })

      it('handles the largest and smallest safe integers', () => {
        const max = Number.MAX_SAFE_INTEGER
        const min = Number.MIN_SAFE_INTEGER
        expect(merge([max, 0], [min, 1], [2, max])).toEqual([
          min,
          0,
          1,
          2,
          max,
          max,
        ])
      })
    })

    describe('contract', () => {
      it('does not modify the input collections', () => {
        const c1 = [9, 5, 1]
        const c2 = [0, 4, 8]
        const c3 = [2, 3, 7]
        merge(c1, c2, c3)
        expect(c1).toEqual([9, 5, 1])
        expect(c2).toEqual([0, 4, 8])
        expect(c3).toEqual([2, 3, 7])
      })

      it('returns a new array, not one of the inputs', () => {
        const c2 = [1, 2, 3]
        const result = merge([], c2, [])
        expect(result).toEqual(c2)
        expect(result).not.toBe(c2)
      })

      it('does not use any sort function', () => {
        const arraySort = vi.spyOn(Array.prototype, 'sort')
        const arrayToSorted = vi.spyOn(Array.prototype, 'toSorted')
        const typedArraySort = vi.spyOn(Int32Array.prototype, 'sort')
        try {
          merge([9, 5, 1], [0, 4, 8], [2, 3, 7])
          expect(arraySort).not.toHaveBeenCalled()
          expect(arrayToSorted).not.toHaveBeenCalled()
          expect(typedArraySort).not.toHaveBeenCalled()
        } finally {
          vi.restoreAllMocks()
        }
      })
    })

    describe('randomized', () => {
      it.each([0, 1, 2, 10, 100, 1000])(
        'returns an ascending permutation of all inputs (size %i)',
        (size) => {
          for (let run = 0; run < 20; run++) {
            const c1 = randomAscending(size).reverse()
            const c2 = randomAscending(Math.floor(size / 2))
            const c3 = randomAscending(size * 2)

            const result = merge(c1, c2, c3)

            expect(result).toHaveLength(c1.length + c2.length + c3.length)
            expect(isAscending(result)).toBe(true)
            expect(counts(result)).toEqual(counts([...c1, ...c2, ...c3]))
          }
        },
      )

      it('merges 1,000,000 elements in linear time', () => {
        const c1 = randomAscending(300_000, 1e9).reverse()
        const c2 = randomAscending(300_000, 1e9)
        const c3 = randomAscending(400_000, 1e9)

        const start = performance.now()
        const result = merge(c1, c2, c3)
        const elapsed = performance.now() - start

        expect(result).toHaveLength(1_000_000)
        expect(isAscending(result)).toBe(true)
        expect(elapsed).toBeLessThan(1000)
      })
    })
  })
})
