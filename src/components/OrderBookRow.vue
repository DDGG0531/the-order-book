<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue'
import type { PriceLevel, OrderType } from '@/types'
import { formatPrice, formatSize, formatTotal } from '@/utils/format'

type FlashState = 'increase' | 'decrease' | null

interface Props {
  data: PriceLevel
  type: OrderType
  maxTotal: number
}

const props = defineProps<Props>()

const priceColorClass = computed(() => {
  return props.type === 'bid' ? 'text-ob-buy' : 'text-ob-sell'
})

const progressPercentage = computed(() => {
  if (props.maxTotal === 0) return 0
  return (props.data.total / props.maxTotal) * 100
})

const progressColorClass = computed(() => {
  return props.type === 'bid' ? 'bg-ob-progress-buy' : 'bg-ob-progress-sell'
})

const isRowFlashing = ref(false)
const rowFlashClass = computed(() => {
  return props.type === 'bid' ? 'animate-flash-green' : 'animate-flash-red'
})

const triggerRowFlash = () => {
  isRowFlashing.value = false
  nextTick(() => {
    isRowFlashing.value = true
  })
}

const handleAnimationEnd = () => {
  isRowFlashing.value = false
}

watch(
  () => props.data.isDisplayNew,
  (isNew) => {
    if (isNew) {
      triggerRowFlash()
    }
  },
  { immediate: true },
)

const sizeFlashState = ref<FlashState>(null)

const sizeFlashClass = computed(() => {
  if (!sizeFlashState.value) return ''
  return sizeFlashState.value === 'increase' ? 'animate-flash-green' : 'animate-flash-red'
})

const triggerSizeFlash = (state: FlashState) => {
  sizeFlashState.value = null
  nextTick(() => {
    sizeFlashState.value = state
  })
}

const handleSizeAnimationEnd = () => {
  sizeFlashState.value = null
}

watch(
  () => props.data.size,
  (newSize, oldSize) => {
    if (oldSize === undefined) {
      return
    }
    triggerSizeFlash(newSize > oldSize ? 'increase' : 'decrease')
  },
)
</script>

<template>
  <div
    class="relative flex px-4 py-1 min-h-5 cursor-pointer overflow-hidden text-sm hover:bg-ob-hover! gap-1"
  >
    <div
      v-if="isRowFlashing"
      class="pointer-events-none absolute inset-0"
      :class="rowFlashClass"
      @animationend="handleAnimationEnd"
    ></div>

    <div class="h-full flex items-center text-left tabular-nums flex-1" :class="priceColorClass">
      {{ formatPrice(data.price) }}
    </div>

    <div class="relative h-full flex items-center justify-end tabular-nums flex-1">
      <div
        v-if="sizeFlashState"
        class="pointer-events-none absolute inset-0"
        :class="sizeFlashClass"
        @animationend="handleSizeAnimationEnd"
      ></div>
      <span>
        {{ formatSize(data.size) }}
      </span>
    </div>

    <div class="relative h-full flex items-center justify-end tabular-nums overflow-hidden flex-1">
      <div class="pointer-events-none absolute inset-0 flex justify-end">
        <div
          class="h-full transition-[width] duration-300 ease-out"
          :class="progressColorClass"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
      <span>
        {{ formatTotal(data.total) }}
      </span>
    </div>
  </div>
</template>
