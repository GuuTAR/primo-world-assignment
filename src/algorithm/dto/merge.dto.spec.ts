import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { MergeRequest } from './merge.dto.js'

const valid = {
  collection_1: [10, 7, 4, 1],
  collection_2: [0, 2, 5, 8],
  collection_3: [0, 3, 6, 9, 12],
}

const errorsFor = async (body: object) =>
  (await validate(plainToInstance(MergeRequest, body))).map((e) => ({
    property: e.property,
    constraints: Object.keys(e.constraints ?? {}),
  }))

describe('MergeRequest', () => {
  it.each([
    ['the example', valid],
    [
      'empty collections',
      { collection_1: [], collection_2: [], collection_3: [] },
    ],
    [
      'single elements',
      { collection_1: [1], collection_2: [0], collection_3: [2] },
    ],
    [
      'duplicates',
      { collection_1: [5, 5, 1], collection_2: [0, 0], collection_3: [3, 3] },
    ],
    [
      'negative integers',
      { collection_1: [0, -3], collection_2: [-2, 1], collection_3: [-5] },
    ],
  ])('accepts %s', async (_, body) => {
    expect(await errorsFor(body)).toEqual([])
  })

  it('rejects missing collections', async () => {
    expect((await errorsFor({})).map((e) => e.property)).toEqual([
      'collection_1',
      'collection_2',
      'collection_3',
    ])
  })

  it.each(['collection_1', 'collection_2', 'collection_3'])(
    'rejects %s when it is not an array',
    async (name) => {
      const errors = await errorsFor({ ...valid, [name]: '1,2,3' })
      expect(errors).toEqual([
        { property: name, constraints: expect.arrayContaining(['isArray']) },
      ])
    },
  )

  it.each([
    ['a decimal', 1.5],
    ['a string', '1'],
    ['null', null],
  ])('rejects an element that is %s', async (_, element) => {
    const errors = await errorsFor({ ...valid, collection_2: [0, element] })
    expect(errors).toEqual([
      {
        property: 'collection_2',
        constraints: expect.arrayContaining(['isInt']),
      },
    ])
  })

  it('rejects collection_1 sorted ascending', async () => {
    expect(await errorsFor({ ...valid, collection_1: [1, 4, 7] })).toEqual([
      { property: 'collection_1', constraints: ['isSortedDescending'] },
    ])
  })

  it.each(['collection_2', 'collection_3'])(
    'rejects %s sorted descending',
    async (name) => {
      expect(await errorsFor({ ...valid, [name]: [7, 4, 1] })).toEqual([
        { property: name, constraints: ['isSortedAscending'] },
      ])
    },
  )

  it('rejects a collection that is only partly sorted', async () => {
    expect(
      await errorsFor({ ...valid, collection_3: [0, 1, 5, 3, 9] }),
    ).toEqual([
      { property: 'collection_3', constraints: ['isSortedAscending'] },
    ])
  })

  it('explains which order is expected', async () => {
    const [error] = await validate(
      plainToInstance(MergeRequest, { ...valid, collection_1: [1, 2] }),
    )
    expect(error.constraints).toEqual({
      isSortedDescending: 'collection_1 must be sorted in descending order',
    })
  })
})
