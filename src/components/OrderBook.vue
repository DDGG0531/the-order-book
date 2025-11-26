<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import OrderBookRow from './OrderBookRow.vue'
import LatestPrice from './LatestPrice.vue'
import { useOrderBook } from '@/composables/useOrderBook'
import { useLatestPrice } from '@/composables/useLatestPrice'

const SYMBOL = 'BTCPFC'

const orderBook = useOrderBook(SYMBOL, 8)
const latestPrice = useLatestPrice(SYMBOL)

onMounted(() => {
  orderBook.connect()
  latestPrice.connect()
})

onUnmounted(() => {
  orderBook.disconnect()
  latestPrice.disconnect()
})
</script>

<template>
  <div class="mx-auto w-full max-w-xl bg-ob-bg rounded-lg shadow-2xl overflow-hidden">
    <div class="px-4 py-1.5">
      <h2 class="text-lg font-bold text-ob-text">Order Book</h2>
    </div>

    <div class="flex px-4 py-1 text-xs text-ob-header font-medium gap-1">
      <div class="text-left flex-1">Price (USD)</div>
      <div class="text-right flex-1">Size</div>
      <div class="text-right flex-1">Total</div>
    </div>

    <div>
      <OrderBookRow
        v-for="ask in orderBook.asks.value"
        :key="ask.price"
        :data="ask"
        type="ask"
        :maxTotal="orderBook.maxAskTotal.value"
      />
    </div>

    <LatestPrice :price="latestPrice.price.value" :direction="latestPrice.direction.value" />

    <div>
      <OrderBookRow
        v-for="bid in orderBook.bids.value"
        :key="bid.price"
        :data="bid"
        type="bid"
        :maxTotal="orderBook.maxBidTotal.value"
      />
    </div>
  </div>
</template>
