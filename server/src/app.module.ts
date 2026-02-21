import { Module } from '@nestjs/common';
import { TradingGateway } from './trading.gateway';
import { DataService } from './data.service';

@Module({
  providers: [TradingGateway, DataService],
})
export class AppModule {}