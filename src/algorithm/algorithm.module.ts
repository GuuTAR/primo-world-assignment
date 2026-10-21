import { Module } from '@nestjs/common'

import { AlgorithmController } from './algorithm.controller.js'
import { AlgorithmService } from './algorithm.service.js'

@Module({
  controllers: [AlgorithmController],
  providers: [AlgorithmService],
})
export class AlgorithmModule {}
