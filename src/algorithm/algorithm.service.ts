import { Injectable } from '@nestjs/common'

@Injectable()
export class AlgorithmService {
  /**
   * Merges three sorted integer arrays into one array sorted in ascending order,
   * without using a sort function.
   *
   * - `collection_1` is sorted in descending order (max to min).
   * - `collection_2` and `collection_3` are sorted in ascending order (min to max).
   *
   * Three-pointer merge: `collection_1` is read from the end (its smallest value)
   * towards the start, the others from the start towards the end. Each step takes
   * the smallest of the three current values. O(n) time and space; the inputs are
   * not modified.
   */
  merge(
    collection_1: number[],
    collection_2: number[],
    collection_3: number[],
  ): number[] {
    const total =
      collection_1.length + collection_2.length + collection_3.length
    const result: number[] = []

    let i1 = collection_1.length - 1
    let i2 = 0
    let i3 = 0

    while (result.length < total) {
      // An exhausted collection contributes +Infinity, so it is never picked.
      const v1 = i1 >= 0 ? collection_1[i1] : Infinity
      const v2 = i2 < collection_2.length ? collection_2[i2] : Infinity
      const v3 = i3 < collection_3.length ? collection_3[i3] : Infinity

      if (v1 <= v2 && v1 <= v3) {
        result.push(v1)
        i1--
      } else if (v2 <= v3) {
        result.push(v2)
        i2++
      } else {
        result.push(v3)
        i3++
      }
    }

    return result
  }
}
