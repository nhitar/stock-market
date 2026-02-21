import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface StockHolding {
  quantity: number;
  totalInvested: number;
}

interface BrokerStocks {
  [ticker: string]: StockHolding;
}

interface Broker {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  createdAt: string;
  stocks: BrokerStocks;
}

interface Stock {
  ticker: string;
  companyName: string;
  currentPrice: number;
  isActive: boolean;
  prices?: HistoricalData[];
}

interface HistoricalData {
  date: string;
  open: number;
}

@Injectable()
export class DataService {
  private readonly dataPath = path.join(__dirname, '../data');

  getBrokers(): Broker[] {
    try {
      const filePath = path.join(this.dataPath, 'brokers.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Using default brokers data');
    }
    
    return [];
  }

  addBroker(name: string, balance: number): Broker {
    const brokers = this.getBrokers();
    const newBroker: Broker = {
      id: Date.now().toString(),
      name,
      initialBalance: balance,
      currentBalance: balance,
      createdAt: new Date().toISOString(),
      stocks: {}
    };
    
    brokers.push(newBroker);
    this.saveBrokers(brokers);
    return newBroker;
  }

  deleteBroker(id: string): boolean {
    const brokers = this.getBrokers();
    const initialLength = brokers.length;
    const filteredBrokers = brokers.filter(b => b.id !== id);
    
    if (filteredBrokers.length !== initialLength) {
      this.saveBrokers(filteredBrokers);
      return true;
    }
    return false;
  }

  updateBrokerBalance(id: string, newBalance: number): Broker | null {
    const brokers = this.getBrokers();
    const broker = brokers.find(b => b.id === id);
    
    if (broker) {
      broker.initialBalance = newBalance;
      broker.currentBalance = newBalance;
      this.saveBrokers(brokers);
      return broker;
    }
    return null;
  }

  private saveBrokers(brokers: Broker[]): void {
    try {
      const filePath = path.join(this.dataPath, 'brokers.json');
      fs.writeFileSync(filePath, JSON.stringify(brokers, null, 2));
    } catch (error) {
      console.error('Error saving brokers:', error);
    }
  }

  getStocks(): Stock[] {
    try {
      const filePath = path.join(this.dataPath, 'stocks.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        
        if (jsonData.tickers && Array.isArray(jsonData.tickers)) {
          return jsonData.tickers;
        }
      }
    } catch (error) {
      console.log('Using default stocks data');
    }
    
    return [];
  }

  getHistoricalData(ticker: string): any[] {
    try {
      const stocks = this.getStocks();
      const stock = stocks.find(s => s.ticker === ticker);
      if (stock && stock.prices) {
        return stock.prices;
      }
    } catch (error) {
      console.error(`No historical data for ${ticker}`);
    }
    
    return [];
  }

  updateStockSelection(selectedStocks: string[]): void {
    const stocks = this.getStocks();
    const updatedStocks = stocks.map(stock => ({
      ...stock,
      isActive: selectedStocks.includes(stock.ticker)
    }));

    try {
      const filePath = path.join(this.dataPath, 'stocks.json');
      const dataToSave = {
        tickers: updatedStocks
      };
      
      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error('Error saving stocks:', error);
    }
  }

  updateStockPrice(ticker: string, newPrice: number): void {
    const stocks = this.getStocks();
  
    const updatedStocks = stocks.map(stock => 
      stock.ticker === ticker 
        ? { ...stock, currentPrice: newPrice }
        : stock
    );
    
    const filePath = path.join(this.dataPath, 'stocks.json');
    const dataToSave = { tickers: updatedStocks };
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
  }

  addPriceToHistory(ticker: string, priceData: { date: string; price: number }): void {
    const stocks = this.getStocks();
    const stock = stocks.find(s => s.ticker === ticker);
    
    if (stock) {
      if (!stock.prices) {
        stock.prices = [];
      }
      
      const existingPriceIndex = stock.prices.findIndex(p => p.date === priceData.date);
      
      if (existingPriceIndex !== -1) {
        stock.prices[existingPriceIndex].open = priceData.price;
      } else {
        stock.prices.push({
          date: priceData.date,
          open: priceData.price
        });
      }

      stock.prices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const filePath = path.join(this.dataPath, 'stocks.json');
      const dataToSave = {
        tickers: stocks
      };
      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    }
  }
  
  updateBrokerStocks(brokerId: string, ticker: string, quantity: number, price: number, action: 'buy' | 'sell'): Broker | null {
    const brokers = this.getBrokers();
    const broker = brokers.find(b => b.id === brokerId);
    
    if (!broker) return null;
    
    if (!broker.stocks) broker.stocks = {};
    if (!broker.stocks[ticker]) {
      broker.stocks[ticker] = { quantity: 0, totalInvested: 0 };
    }
    
    const holding = broker.stocks[ticker];
    if (action === 'buy') {
      const cost = quantity * price;
      if (broker.currentBalance >= cost) {
        holding.quantity += quantity;
        holding.totalInvested = Number((holding.totalInvested + cost).toFixed(2));;
        broker.currentBalance = Number((broker.currentBalance - cost).toFixed(2));;

        this.saveBrokers(brokers);

        return broker;
      }
    }
    else if (action === 'sell') {
      if (holding.quantity >= quantity) {
        const revenue = quantity * price;
        holding.quantity -= quantity;
        broker.currentBalance = Number((broker.currentBalance + revenue).toFixed(2));
        if (holding.quantity === 0) delete broker.stocks[ticker];

        this.saveBrokers(brokers);

        return broker;
      }
    }
    else {
      console.log("error: wrong ticker action")
    }
    
    return null;
  }

  getExchangeSettings(): any {
    try {
      const filePath = path.join(this.dataPath, 'exchange.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Using default exchange settings');
    }
  }
  
  updateExchangeSettings(settings: any): void {
    try {
      const filePath = path.join(this.dataPath, 'exchange.json');
      const dataToSave = {
        settings: {
          ...this.getExchangeSettings().settings,
          ...settings
        }
      };
      
      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
      console.log('Exchange settings saved to JSON');
    } catch (error) {
      console.error('Error saving exchange settings:', error);
    }
  }
}