import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import {
  ApiErrorResponses,
  ApiOkResponseOf,
} from '../common/api-response.decorator.js'
import { HttpExceptionFilter } from '../common/http-exception.filter.js'
import { ResponseMessage } from '../common/response-message.decorator.js'
import { ResponseInterceptor } from '../common/response.interceptor.js'

import { MergeResponse } from './algorithm.model.js'
import { AlgorithmService } from './algorithm.service.js'
import { MergeRequest } from './dto/merge.dto.js'

const BAD_REQUEST = { status: 400, description: 'Bad Request' }

@ApiTags('algorithm')
@Controller()
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseInterceptor)
export class AlgorithmController {
  constructor(private readonly algorithmService: AlgorithmService) {}

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({
    summary: 'Merge three sorted collections into ascending order',
    description:
      'collection_1 must be sorted from max to min; collection_2 and collection_3 from min to max. Merged in O(n) without using a sort function.',
  })
  @ResponseMessage('Collections merged successfully')
  @ApiOkResponseOf(MergeResponse)
  @ApiErrorResponses(BAD_REQUEST)
  merge(@Body() body: MergeRequest): MergeResponse {
    return {
      result: this.algorithmService.merge(
        body.collection_1,
        body.collection_2,
        body.collection_3,
      ),
    }
  }
}
