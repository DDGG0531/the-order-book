import { ref, computed } from 'vue'
import { useWebSocket } from './useWebSocket'
import type { PriceLevel, OrderBookData, OrderBookMessage } from '@/types'

export function useOrderBook(symbol: string, maxLevels = 8) {
  const bids = ref<PriceLevel[]>([])
  const asks = ref<PriceLevel[]>([])
  const seqNum = ref(0)
  const lastUpdate = ref(0)
  const isInitialized = ref(false)
  let displayedBidPrices = new Set<number>()
  let displayedAskPrices = new Set<number>()

  const bidsMap = ref<Map<number, PriceLevel>>(new Map())
  const asksMap = ref<Map<number, PriceLevel>>(new Map())

  let updateTimer: ReturnType<typeof setTimeout> | null = null
  const UPDATE_INTERVAL = 3000

  const handleMessage = (message: OrderBookMessage) => {
    const data = message.data

    if (isInitialized.value && data.type === 'delta') {
      if (data.prevSeqNum !== seqNum.value) {
        websocket.reconnect()
        return
      }
    }

    seqNum.value = data.seqNum
    lastUpdate.value = data.timestamp

    if (data.type === 'snapshot') {
      handleSnapshot(data)
      isInitialized.value = true
    } else {
      handleDelta(data)
    }
  }

  const handleSnapshot = (data: OrderBookData) => {
    bidsMap.value.clear()
    asksMap.value.clear()

    data.bids.forEach(([price, size]) => {
      const priceValue = +price
      const sizeValue = +size
      if (sizeValue > 0) {
        bidsMap.value.set(priceValue, {
          price: priceValue,
          size: sizeValue,
          total: 0,
          prevSize: sizeValue,
          isDisplayNew: false,
        })
      }
    })

    data.asks.forEach(([price, size]) => {
      const priceValue = +price
      const sizeValue = +size
      if (sizeValue > 0) {
        asksMap.value.set(priceValue, {
          price: priceValue,
          size: sizeValue,
          total: 0,
          prevSize: sizeValue,
          isDisplayNew: false,
        })
      }
    })

    updateDisplayListsImmediate()
  }

  const handleDelta = (data: OrderBookData) => {
    data.bids.forEach(([price, size]) => {
      const priceValue = +price
      const sizeValue = +size
      if (sizeValue <= 0) {
        bidsMap.value.delete(priceValue)
      } else {
        const existing = bidsMap.value.get(priceValue)
        bidsMap.value.set(priceValue, {
          price: priceValue,
          size: sizeValue,
          total: 0,
          prevSize: existing?.size ?? 0,
          isDisplayNew: false,
        })
      }
    })

    data.asks.forEach(([price, size]) => {
      const priceValue = +price
      const sizeValue = +size
      if (sizeValue <= 0) {
        asksMap.value.delete(priceValue)
      } else {
        const existing = asksMap.value.get(priceValue)
        asksMap.value.set(priceValue, {
          price: priceValue,
          size: sizeValue,
          total: 0,
          prevSize: existing?.size ?? 0,
          isDisplayNew: false,
        })
      }
    })

    scheduleUpdate()
  }

  const scheduleUpdate = () => {
    if (updateTimer) {
      return
    }

    updateTimer = setTimeout(() => {
      updateDisplayListsImmediate()
      updateTimer = null
    }, UPDATE_INTERVAL)
  }

  const updateDisplayListsImmediate = () => {
    const highestBids = Array.from(bidsMap.value.values())
      .sort((a, b) => b.price - a.price)
      .slice(0, maxLevels)

    const lowestAsks = Array.from(asksMap.value.values())
      .sort((a, b) => a.price - b.price)
      .slice(0, maxLevels)

    let bidTotal = 0
    const newDisplayedBidPrices = new Set<number>()
    highestBids.forEach((level) => {
      bidTotal += level.size
      level.total = bidTotal
      const isNewDisplay = !displayedBidPrices.has(level.price)
      level.isDisplayNew = isNewDisplay
      newDisplayedBidPrices.add(level.price)
    })

    let askTotal = 0
    const newDisplayedAskPrices = new Set<number>()
    lowestAsks.forEach((level) => {
      askTotal += level.size
      level.total = askTotal
      const isNewDisplay = !displayedAskPrices.has(level.price)
      level.isDisplayNew = isNewDisplay
      newDisplayedAskPrices.add(level.price)
    })

    bids.value = highestBids
    asks.value = lowestAsks.reverse()
    displayedBidPrices = newDisplayedBidPrices
    displayedAskPrices = newDisplayedAskPrices
  }

  const maxBidTotal = computed(() => {
    if (bids.value.length === 0) return 0
    return bids.value[bids.value.length - 1]?.total ?? 0
  })

  const maxAskTotal = computed(() => {
    if (asks.value.length === 0) return 0
    return asks.value[0]?.total ?? 0
  })

  const websocket = useWebSocket({
    url: 'wss://ws.btse.com/ws/oss/futures',
    topics: [`update:${symbol}`],
    onMessage: handleMessage,
  })

  const cleanup = () => {
    if (updateTimer) {
      clearTimeout(updateTimer)
      updateTimer = null
    }
  }

  return {
    bids,
    asks,
    seqNum,
    lastUpdate,
    isInitialized,
    maxBidTotal,
    maxAskTotal,
    connect: websocket.connect,
    disconnect: () => {
      cleanup()
      websocket.disconnect()
    },
  }
}
