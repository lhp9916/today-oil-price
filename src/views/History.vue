<script setup>
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { oilTypesOf, formatPrice, measureLabels } from '../api/provinces'

const props = defineProps({
  area: { type: Object, default: null },
  areas: { type: Array, default: () => [] },
  provinceName: { type: String, default: '' },
  hasProvince: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['select-area', 'retry', 'pick'])

const check = computed(() => (props.area && props.area.check) || {})
const records = computed(() => (props.area && props.area.records) || [])
const types = computed(() => oilTypesOf(check.value))
const multiArea = computed(() => props.areas.length > 1)
// 天然气按千克计价，与汽柴油同屏时两种单位都要标出
const units = computed(() => measureLabels(types.value))

// 历史记录用 *_COLOR 标注该次调价涨跌（red 涨价 / blue 降价）
const cellClass = (row, item) => {
  const color = row[`${item.price}_COLOR`]
  if (color === 'red') return 'cell-up'
  if (color === 'blue') return 'cell-down'
  return ''
}
</script>

<template>
  <section class="history">
    <template v-if="loading">
      <div class="skeleton card tall"></div>
      <div class="skeleton card tall"></div>
    </template>

    <template v-else-if="error">
      <div class="state card">
        <AppIcon name="empty" :size="34" />
        <p class="state-title">历史油价获取失败</p>
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
        <p class="state-desc">先选择省市，才能查看对应的近一年历史油价。</p>
        <button type="button" class="retry" @click="emit('pick')">
          <AppIcon name="locate" :size="15" />
          <span>选择省市</span>
        </button>
      </div>
    </template>

    <template v-else>
      <div v-if="multiArea" class="area-block">
        <p class="area-tip">点击查看{{ provinceName }}各价区历史油价</p>
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

      <div class="table-head">
        <span class="head-area">{{ (area && area.areaName) || provinceName }}</span>
        <span class="head-title">历史油价（近一年）</span>
        <span class="head-unit">
          单位：<i v-for="(unit, index) in units" :key="unit">
            <template v-if="index">、</template>{{ unit }}
          </i>
        </span>
      </div>

      <div v-if="records.length" class="table card">
        <table>
          <thead>
            <tr>
              <th class="date-col">调价日期</th>
              <th v-for="item in types" :key="item.flag">{{ item.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in records" :key="row.STR_START_DATE + row.PERIOD_ID">
              <td class="date-col">{{ row.STR_START_DATE }}</td>
              <td
                v-for="item in types"
                :key="item.flag"
                :class="cellClass(row, item)"
              >
                {{ formatPrice(row[item.price]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="state card">
        <AppIcon name="empty" :size="34" />
        <p class="state-title">暂无历史调价记录</p>
        <p class="state-desc">该价区暂未提供近一年调价数据。</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.history {
  animation: fade-in 0.22s ease;
}

.skeleton {
  height: 90px;
  margin-bottom: 14px;
}

.skeleton.tall {
  height: 240px;
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
  margin-bottom: 16px;
}

.area-tip {
  font-size: 13px;
  color: #595959;
  margin-bottom: 10px;
}

.area-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.table-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  background: linear-gradient(135deg, #5697ff, #4d8bfa);
  color: #ffffff;
}

.head-area {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.head-title {
  flex: 1;
  font-size: 14px;
  text-align: center;
}

.head-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
}

.table {
  overflow: auto;
  border-radius: 0 0 var(--radius-card) var(--radius-card);
  max-height: 62vh;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}

th,
td {
  padding: 11px 12px;
  text-align: center;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-weight: 600;
  color: #5a6a86;
  background: #eef4ff;
}

tbody td {
  color: #a8a4a4;
  border-bottom: 1px solid #f5f9ff;
}

/* 需要压过 tbody td 的颜色声明，标出该次调价的涨跌方向 */
tbody td.cell-up {
  color: var(--up);
}

tbody td.cell-down {
  color: var(--down);
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover td {
  background: #f7fbff;
}

.date-col {
  position: sticky;
  left: 0;
  color: #494848;
  background: #ffffff;
}

thead .date-col {
  background: #eef4ff;
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
