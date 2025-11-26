export interface PriceLevel {
  price: number
  size: number
  total: number
  prevSize: number
  isDisplayNew: boolean
}

export interface OrderBookData {
  type: 'snapshot' | 'delta'
  bids: [string, string][]
  asks: [string, string][]
  seqNum: number
  prevSeqNum: number
  timestamp: number
}

export interface TradeData {
  symbol: string
  price: number
  size: number
  side: 'BUY' | 'SELL'
  tradeId: number
  timestamp: number
}

export type OrderBookMessage = {
  topic: string
  data: OrderBookData
}

export type TradeHistoryMessage = {
  topic: string
  data: TradeData[]
}

export type PriceChangeDirection = 'up' | 'down'

export type OrderType = 'bid' | 'ask'
