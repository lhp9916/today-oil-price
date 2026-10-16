<script setup>
import { computed } from 'vue'
import { formatDelta, formatPrice, deltaClass } from '../api/provinces'

const props = defineProps({
  label: { type: String, required: true },
  unit: { type: String, default: '' },
  measure: { type: String, default: '元/升' },
  price: { type: [Number, String], default: null },
  status: { type: [Number, String], default: null },
  highlight: { type: Boolean, default: false }
})

const showDelta = computed(() => formatDelta(props.status) !== '')
const deltaText = computed(() => formatDelta(props.status))
const deltaClassName = computed(() => deltaClass(props.status))
const priceText = computed(() => formatPrice(props.price))
const missing = computed(() => priceText.value === '-')
const sign = computed(() => {
  const num = Number(props.status)
  return Number.isNaN(num) || num === 0 ? '' : num > 0 ? 'up' : 'down'
})
</script>

<template>
  <div class="price-card card" :class="{ 'is-highlight': highlight }">
    <div class="left">
      <span class="label">{{ label }}</span>
      <span class="unit">{{ unit }}</span>
    </div>

    <div class="right">
      <template v-if="!missing">
        <span class="delta" :class="[deltaClassName, sign]">
          <svg
            v-if="sign"
            class="arrow"
            :class="sign"
            width="9"
            height="12"
            viewBox="0 0 9 12"
            aria-hidden="true"
          >
            <path
              v-if="sign === 'up'"
              d="M4.5 0.6 8.4 5.4H0.6L4.5 0.6Z"
              fill="currentColor"
            />
            <path v-else d="M4.5 11.4 0.6 6.6h7.8L4.5 11.4Z" fill="currentColor" />
          </svg>
          <span v-if="showDelta">{{ deltaText }}</span>
        </span>
        <b class="price">{{ priceText }}</b>
        <i class="price-unit">({{ measure }})</i>
      </template>

      <p v-else class="missing">数据未更新<em>以油站实际价格为准</em></p>
    </div>
  </div>
</template>

<style scoped>
.price-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 0 16px;
  margin-bottom: 10px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.price-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(156, 162, 200, 0.45);
}

.price-card.is-highlight {
  box-shadow: 0 0 0 1.5px var(--primary) inset, var(--shadow);
}

.left {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.label {
  font-size: 21px;
  color: var(--text);
  letter-spacing: 0.01em;
}

.unit {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-width: 30px;
  font-size: 12px;
  justify-content: flex-end;
}

.arrow {
  display: block;
}

.price {
  display: inline-block;
  min-width: 62px;
  font-size: 21px;
  font-weight: 600;
  color: var(--text);
  text-align: center;
}

.price-unit {
  display: inline-block;
  min-width: 52px;
  font-size: 13px;
  color: var(--muted-strong);
  text-align: right;
}

.missing {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 13px;
  color: var(--muted-strong);
  line-height: 1.35;
}

.missing em {
  font-size: 11px;
  color: #b6b2b2;
}

@media (max-width: 420px) {
  .label,
  .price {
    font-size: 19px;
  }

  .price-unit {
    min-width: auto;
  }
}
</style>
