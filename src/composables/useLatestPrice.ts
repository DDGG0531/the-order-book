import { ref } from 'vue'
import { useWebSocket } from './useWebSocket'
import type { PriceChangeDirection, TradeHistoryMessage } from '@/types'

export function useLatestPrice(symbol: string) {
  const price = ref<number>(0)
  const prevPrice = ref<number>(0)
  const direction = ref<PriceChangeDirection>('up')

  let updateTimer: ReturnType<typeof setTimeout> | null = null
  let pendingPrice: number | null = null
  const UPDATE_INTERVAL = 3000

  const handleMessage = (message: TradeHistoryMessage) => {
    if (message.topic !== 'tradeHistoryApi') {
      return
    }

    if (!message.data || message.data.length === 0) {
      return
    }

    const latestTrade = message.data[0]
    if (!latestTrade) {
      return
    }

    pendingPrice = latestTrade.price

    scheduleUpdate()
  }

  const scheduleUpdate = () => {
    if (updateTimer) {
      return
    }

    updateTimer = setTimeout(() => {
      if (pendingPrice !== null) {
        updatePriceImmediate(pendingPrice)
        pendingPrice = null
      }
      updateTimer = null
    }, UPDATE_INTERVAL)
  }

  const updatePriceImmediate = (newPrice: number) => {
    if (price.value !== 0) {
      prevPrice.value = price.value
    }

    price.value = newPrice

    if (prevPrice.value !== 0) {
      if (newPrice > prevPrice.value) {
        direction.value = 'up'
      } else if (newPrice < prevPrice.value) {
        direction.value = 'down'
      }
    }
  }

  const websocket = useWebSocket({
    url: 'wss://ws.btse.com/ws/futures',
    topics: [`tradeHistoryApi:${symbol}`],
    onMessage: handleMessage,
  })

  const cleanup = () => {
    if (updateTimer) {
      clearTimeout(updateTimer)
      updateTimer = null
    }
    pendingPrice = null
  }

  return {
    price,
    prevPrice,
    direction,
    connect: websocket.connect,
    disconnect: () => {
      cleanup()
      websocket.disconnect()
    },
  }
}
