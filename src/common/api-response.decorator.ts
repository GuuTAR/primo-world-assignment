import { applyDecorators, HttpStatus, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

import { Response, ResponseWithoutBody } from '@/common/response.model.js'

/** Documents a response as `Response` with `body` set to `model` (or `[model]` for an array). */
const ApiResponseOf = (
  status: HttpStatus,
  description: string,
  model: Type | [Type],
) => {
  const item = Array.isArray(model) ? model[0] : model
  const body = Array.isArray(model)
    ? { type: 'array', items: { $ref: getSchemaPath(item) } }
    : { $ref: getSchemaPath(item) }
  return applyDecorators(
    ApiExtraModels(Response, item),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(Response) },
          { type: 'object', properties: { body } },
        ],
      },
    }),
  )
}

export const ApiOkResponseOf = (model: Type | [Type]) =>
  ApiResponseOf(HttpStatus.OK, 'OK', model)

export const ApiCreatedResponseOf = (model: Type | [Type]) =>
  ApiResponseOf(HttpStatus.CREATED, 'Created', model)

/** Documents a 200 response with no body. */
export const ApiOkResponseWithoutBody = () =>
  ApiResponse({ status: 200, description: 'OK', type: ResponseWithoutBody })

/** Documents error responses as `ResponseWithoutBody`. */
export const ApiErrorResponses = (
  ...statuses: { status: number; description: string }[]
) =>
  applyDecorators(
    ...statuses.map((s) => ApiResponse({ ...s, type: ResponseWithoutBody })),
  )
