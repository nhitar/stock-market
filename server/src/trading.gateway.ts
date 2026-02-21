import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DataService } from './data.service';

interface StockPrice {
  ticker: string;
  price: number;
  change: number;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
  },
})
export class TradingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private tradingInterval: NodeJS.Timeout | null = null;
  private isTrading = false;
  private currentDate = new Date().toISOString().split('T')[0];

  constructor(private dataService: DataService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    this.sendCurrentData(client);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  startTrading(speed: number) {
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
    }

    this.isTrading = true;
    
    this.tradingInterval = setInterval(() => {
      this.simulateTrading();
    }, speed * 1000);
    const settings = this.dataService.getExchangeSettings();
    const tradingSpeed = speed || settings.settings.speed || 5;
    this.server.emit('trading_started', {
      message: 'Торги начались',
      speed: tradingSpeed,
      date: this.currentDate
    });
  }

  stopTrading() {
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }

    this.isTrading = false;
    this.server.emit('trading_stopped', {
      message: 'Торги остановлены'
    });
  }

  private simulateTrading() {
    const stocks = this.dataService.getStocks();
    const priceUpdates: StockPrice[] = [];

    stocks.forEach(stock => {
      if (stock.isActive) {
        const changePercent = (Math.random() * 4 - 2) / 100;
        const newPrice = Number((stock.currentPrice * (1 + changePercent)).toFixed(2));
        const change = Number((newPrice - stock.currentPrice).toFixed(2));

        this.dataService.updateStockPrice(stock.ticker, newPrice);

        this.dataService.addPriceToHistory(stock.ticker, {
          date: this.currentDate,
          price: newPrice
        });

        priceUpdates.push({
          ticker: stock.ticker,
          price: newPrice,
          change: change
        });
      }
    });

    this.updateDate();

    const updatedStocks = this.dataService.getStocks();
    this.server.emit('stocks_updated', updatedStocks);

    this.server.emit('price_update', {
      prices: priceUpdates,
      date: this.currentDate,
      timestamp: new Date().toISOString()
    });
  }

  private updateDate() {
    const date = new Date(this.currentDate);
    date.setDate(date.getDate() + 1);
    this.currentDate = date.toISOString().split('T')[0];
  }

  private sendCurrentData(client: Socket) {
    const stocks = this.dataService.getStocks();
    const brokers = this.dataService.getBrokers();

    client.emit('initial_data', {
      stocks: stocks,
      brokers: brokers,
      tradingStatus: this.isTrading,
      currentDate: this.currentDate
    });
  }

  @SubscribeMessage('start_trading')
  handleStartTrading(client: Socket, data: { speed: number }) {
    const settings = this.dataService.getExchangeSettings();
    const tradingSpeed = settings.settings.speed || data.speed || 5;
    this.startTrading(tradingSpeed);
  }

  @SubscribeMessage('stop_trading')
  handleStopTrading(client: Socket) {
    this.stopTrading();
  }

  @SubscribeMessage('add_broker')
  handleAddBrokers(client: Socket, data: { name: string, balance: number }) {
    this.dataService.addBroker(data.name, data.balance);
    const brokers = this.dataService.getBrokers();
    client.emit('brokers_updated', brokers);
  }

  @SubscribeMessage('delete_broker')
  handleDeleteBrokers(client: Socket, data: { id: string }) {
    this.dataService.deleteBroker(data.id);
    const brokers = this.dataService.getBrokers();
    client.emit('brokers_updated', brokers);
  }

  @SubscribeMessage('update_broker_balance')
  handleUpdateBrokerBalance(client: Socket, data: { id: string, newBalance: number }) {
    this.dataService.updateBrokerBalance(data.id, data.newBalance);
    const brokers = this.dataService.getBrokers();
    this.server.emit('brokers_updated', brokers)
  }

  @SubscribeMessage('update_stock_selection')
  handleUpdateStockSelection(client: Socket, data: { selectedStocks: string[] }) {
    this.dataService.updateStockSelection(data.selectedStocks)
    const stocks = this.dataService.getStocks()
    this.server.emit('stocks_updated', stocks)
  }

  @SubscribeMessage('get_exchange_settings')
  handleGetExchangeSettings(client: Socket) {
    const settings = this.dataService.getExchangeSettings();
    client.emit('exchange_settings_updated', settings.settings);
  }

  @SubscribeMessage('update_exchange_settings')
  handleUpdateExchangeSettings(client: Socket, data: { startDate: string; speed: number }) {
    this.dataService.updateExchangeSettings(data);
    this.currentDate = data.startDate;
    
    const settings = this.dataService.getExchangeSettings();
    this.server.emit('exchange_settings_updated', settings.settings);
  }

  @SubscribeMessage('buy_stock')
  handleBuyStock(client: Socket, data: { brokerId: string; ticker: string; quantity: number }) {
    const stocks = this.dataService.getStocks();
    const stock = stocks.find(s => s.ticker === data.ticker);
    if (!stock) return;
    const broker = this.dataService.updateBrokerStocks(
      data.brokerId, data.ticker, data.quantity, stock.currentPrice, 'buy'
    );
    
    if (broker) {
      const brokers = this.dataService.getBrokers();
      this.server.emit('brokers_updated', brokers);
    }
  }

  @SubscribeMessage('sell_stock')  
  handleSellStock(client: Socket, data: { brokerId: string; ticker: string; quantity: number }) {
    const stocks = this.dataService.getStocks();
    const stock = stocks.find(s => s.ticker === data.ticker);
    
    if (!stock) return;
    
    const broker = this.dataService.updateBrokerStocks(
      data.brokerId, data.ticker, data.quantity, stock.currentPrice, 'sell'
    );
    
    if (broker) {
      const brokers = this.dataService.getBrokers();
      this.server.emit('brokers_updated', brokers);
    }
  }
}