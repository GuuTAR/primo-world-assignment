import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { DecryptDataRequest } from './decrypt-data.dto.js'
import { EncryptDataRequest } from './encrypt-data.dto.js'

const errorsFor = async <T extends object>(
  cls: new () => T,
  body: object,
): Promise<string[]> =>
  (await validate(plainToInstance(cls, body))).map((e) => e.property)

describe('EncryptDataRequest', () => {
  it.each([
    ['empty', ''],
    ['typical', 'Hello, world!'],
    ['max length', 'x'.repeat(2000)],
  ])('accepts a %s payload', async (_, payload) => {
    expect(await errorsFor(EncryptDataRequest, { payload })).toEqual([])
  })

  it.each([
    ['missing', {}],
    ['null', { payload: null }],
    ['a number', { payload: 123 }],
    ['over 2000 characters', { payload: 'x'.repeat(2001) }],
  ])('rejects a payload that is %s', async (_, body) => {
    expect(await errorsFor(EncryptDataRequest, body)).toEqual(['payload'])
  })
})

describe('DecryptDataRequest', () => {
  it('accepts non-empty data1 and data2', async () => {
    expect(
      await errorsFor(DecryptDataRequest, { data1: 'a', data2: 'b' }),
    ).toEqual([])
  })

  it.each([
    ['both missing', {}, ['data1', 'data2']],
    ['data2 missing', { data1: 'a' }, ['data2']],
    ['data1 empty', { data1: '', data2: 'b' }, ['data1']],
    ['not strings', { data1: 1, data2: 2 }, ['data1', 'data2']],
  ])('rejects %s', async (_, body, invalid) => {
    expect(await errorsFor(DecryptDataRequest, body)).toEqual(invalid)
  })
})
