<script setup>
import { computed } from 'vue'
import PriceCard from '../components/PriceCard.vue'
import AppIcon from '../components/AppIcon.vue'
import { oilTypesOf } from '../api/provinces'

const props = defineProps({
  area: { type: Object, default: null },
  areas: { type: Array, default: () => [] },
  hasProvince: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['select-area', 'retry', 'pick'])

const check = computed(() => (props.area && props.area.check) || {})
const price = computed(() => (props.area && props.area.price) || null)
const types = computed(() => oilTypesOf(check.value))
const hasAnyPrice = computed(() => !!price.value)
const fallbackDate = computed(() => (props.area && props.area.priceDate) || '')
// 优先突出 92 号，没有 92 号时退而突出第一个有价格的标号
const highlightFlag = computed(() => {
  const list = types.value.filter((item) => price.value && price.value[item.price] != null)
  if (!list.length) return ''
  const first = list[0]
  return (list.find((item) => item.flag === 'GAS_92') || first).flag
})
const areaDesc = computed(() => check.value.AREA_DESC || '')
const showAreaDesc = computed(
  () => !!areaDesc.value && check.value.AREADESC_ISDISPLAY !== 'N'
)
const multiArea = computed(() => props.areas.length > 1)
</script>

<template>
  <section class="today">
    <template v-if="loading">
      <div v-for="n in 5" :key="n" class="skeleton card"></div>
    </template>

    <template v-else-if="error">
      <div class="state card">
        <AppIcon name="empty" :size="34" />
        <p class="state-title">油价获取失败</p>
        <p class="state-desc">{{ error }}</p>
        <button type="button" class="retry" @click="emit('retry')">
          <AppIcon name="refresh" :size="15" />
          <span>重新加载</span>
        </button>
      </div>
    </template>

    <template v-else-if="!hasProvince">
      <div class="state card">
        <AppIcon name="locate" :size="34" />
        <p class="state-title">还没有选择省市</p>
        <p class="state-desc">选择一次后会自动记住，下次进入直接显示该省份油价。</p>
        <button type="button" class="retry" @click="emit('pick')">
          <AppIcon name="locate" :size="15" />
          <span>选择省市</span>
        </button>
      </div>
    </template>

    <template v-else>
      <div v-if="showAreaDesc" class="tips card">{{ areaDesc }}</div>

      <div v-if="multiArea" class="area-block">
        <h3 class="section-title">选择价区</h3>
        <ul class="area-list">
          <li v-for="item in areas" :key="item.areaId">
            <button
              type="button"
              class="area-chip"
              :class="{ current: area && String(item.areaId) === String(area.areaId) }"
              @click="emit('select-area', item)"
            >
              {{ item.areaName }}
            </button>
          </li>
        </ul>
      </div>

      <h3 v-if="area && area.areaName && multiArea" class="section-title area-name">
        {{ area.areaName }}
      </h3>

      <div class="price-list" :class="{ 'is-ready': !loading }">
        <PriceCard
          v-for="item in types"
          :key="item.flag"
          :label="item.label"
          :unit="item.unit"
          :measure="item.measure"
          :price="price ? price[item.price] : null"
          :status="price ? price[item.status] : null"
          :highlight="item.flag === highlightFlag"
        />
      </div>

      <p v-if="!hasAnyPrice" class="foot-note">
        注：当前油价暂未更新，请以加油站实际价格为准。
      </p>
      <template v-else>
        <p v-if="fallbackDate" class="fallback-note">
          该省市当期油价尚未发布，以上为 {{ fallbackDate }} 起执行的最近一次公布价格。
        </p>
        <p class="foot-note">
          数据来源：中国石化，仅供参考，实际以加油站挂牌价为准。
        </p>
      </template>
    </template>
  </section>
</template>

<style scoped>
.today {
  animation: fade-in 0.22s ease;
}

.skeleton {
  height: 62px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, #ffffff 25%, #eef4ff 37%, #ffffff 63%);
  background-size: 400% 100%;
  animation: shimmer 1.3s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.area-block {
  margin-bottom: 18px;
}

.area-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.area-chip {
  min-width: 92px;
  height: 34px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-deep);
  border-radius: var(--radius-chip);
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(156, 162, 200, 0.32), 0 0 0 1px #5798fe inset;
  transition: transform 0.16s ease, color 0.16s ease, background 0.16s ease;
}

.area-chip:hover {
  transform: translateY(-1px);
}

.area-chip.current {
  color: #ffffff;
  background: linear-gradient(135deg, var(--head-from), var(--primary-deep));
  box-shadow: 0 3px 12px rgba(85, 151, 254, 0.42);
}

.area-name {
  margin: 4px 0 12px;
}

.tips {
  margin-bottom: 16px;
  padding: 13px 16px;
  font-size: 12px;
  line-height: 1.6;
  color: #656565;
}

.foot-note {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

/* 价格来自最近一次已公布调价时，明确标注生效日期 */
.fallback-note {
  margin-top: 12px;
  padding: 9px 14px;
  font-size: 12px;
  line-height: 1.6;
  color: #7a6432;
  border-radius: 8px;
  background: #fff8e6;
  box-shadow: 0 0 0 1px rgba(214, 178, 92, 0.35) inset;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--muted);
  text-align: center;
}

.state-title {
  font-size: 15px;
  color: var(--text);
}

.state-desc {
  font-size: 13px;
  color: var(--muted-strong);
  line-height: 1.6;
}

.retry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  margin-top: 8px;
  padding: 0 18px;
  font-size: 13px;
  color: #ffffff;
  border-radius: var(--radius-pill);
  background: var(--primary);
  transition: transform 0.16s ease, background 0.16s ease;
}

.retry:hover {
  transform: translateY(-1px);
  background: var(--primary-deep);
}
</style>
