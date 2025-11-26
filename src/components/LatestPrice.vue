<script setup lang="ts">
import { computed } from 'vue'
import type { PriceChangeDirection } from '@/types'
import { formatPrice } from '@/utils/format'
import IconArrowDown from '@/assets/IconArrowDown.svg'

interface Props {
  price: number
  direction: PriceChangeDirection
}

const props = defineProps<Props>()

const priceColorClass = computed(() => {
  return props.direction === 'up' ? 'text-ob-buy' : 'text-ob-sell'
})

const backgroundClass = computed(() => {
  return props.direction === 'up' ? 'bg-ob-progress-buy' : 'bg-ob-progress-sell'
})

const arrowRotation = computed(() => {
  return props.direction === 'up' ? 'rotate-180' : ''
})
</script>

<template>
  <div
    class="flex items-center justify-center gap-2 py-2.5 min-h-10 transition-colors"
    :class="backgroundClass"
  >
    <span class="text-2xl font-semibold tabular-nums transition-colors" :class="priceColorClass">
      {{ formatPrice(price) }}
    </span>
    <IconArrowDown class="w-5 h-5 transition-all" :class="[priceColorClass, arrowRotation]" />
  </div>
</template>
