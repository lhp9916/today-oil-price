<script setup>
import { computed, onMounted, ref } from 'vue'
import AppIcon from './components/AppIcon.vue'
import LocationHeader from './components/LocationHeader.vue'
import ProvincePicker from './components/ProvincePicker.vue'
import Today from './views/Today.vue'
import History from './views/History.vue'
import Calendar from './views/Calendar.vue'
import { fetchOilPrice, fetchHistoryOilPrice, locateProvince } from './api/oil'
import { findProvince } from './api/provinces'
import { loadLocation, saveLocation, saveArea, saveLocatedAt } from './api/storage'

const TABS = [
  { key: 'today', label: '今日油价', icon: 'price' },
  { key: 'history', label: '历史油价', icon: 'history' },
  { key: 'calendar', label: '调价日历', icon: 'calendar' }
]

const tab = ref('today')
const pickerOpen = ref(false)
const locating = ref(false)
const locationHint = ref('')

const provinceId = ref('')
const provinceName = ref('')
const todayDate = ref('')
const todayAreas = ref([])
const todayAreaId = ref('')
// 从本地记忆里恢复、等待首次加载后套用的价区
const pendingAreaId = ref('')

const historyAreas = ref([])
const historyAreaId = ref('')

const todayLoading = ref(false)
const todayError = ref('')
const historyLoading = ref(false)
const historyError = ref('')

const currentTodayArea = computed(
  () => todayAreas.value.find((item) => String(item.areaId) === String(todayAreaId.value)) || null
)
const currentHistoryArea = computed(
  () =>
    historyAreas.value.find((item) => String(item.areaId) === String(historyAreaId.value)) || null
)

function applyLocationCache() {
  const cached = loadLocation()
  if (!cached) return false
  const province = findProvince(cached.provinceId) || {
    id: cached.provinceId,
    name: cached.provinceName
  }
  provinceId.value = String(province.id)
  provinceName.value = province.name || cached.provinceName
  // 记下上次选的价区，等价格数据回来后套用
  pendingAreaId.value = cached.areaId || ''
  return true
}

async function loadToday({ keepArea = false } = {}) {
  if (!provinceId.value) return
  todayLoading.value = true
  todayError.value = ''
  try {
    const data = await fetchOilPrice(provinceId.value)
    provinceName.value = data.provinceName || provinceName.value
    todayDate.value = data.toDay || todayDate.value
    todayAreas.value = data.areas

    // 优先沿用当前价区（同省刷新），其次套用本地记忆的价区，最后回落到第一个
    const wanted = [
      keepArea ? String(todayAreaId.value) : '',
      String(pendingAreaId.value || '')
    ].filter(Boolean)
    const matched = wanted
      .map((id) => data.areas.find((item) => String(item.areaId) === id))
      .find(Boolean)
    todayAreaId.value = (matched || data.areas[0] || {}).areaId || ''
    pendingAreaId.value = ''
  } catch (err) {
    todayError.value = err.message || '获取油价失败'
    todayAreas.value = []
  } finally {
    todayLoading.value = false
  }
}

// 历史页跟随今日页的价区选择，避免两个页签价区不一致
function syncHistoryArea() {
  if (!historyAreas.value.length) return
  const matched = historyAreas.value.find(
    (item) => String(item.areaId) === String(todayAreaId.value)
  )
  historyAreaId.value = (matched || historyAreas.value[0] || {}).areaId || ''
}

// 历史油价接口较重，只在进入页签时按需加载
async function loadHistory({ force = false } = {}) {
  if (!provinceId.value) return
  if (historyAreas.value.length && !force) {
    syncHistoryArea()
    return
  }
  historyLoading.value = true
  historyError.value = ''
  try {
    const data = await fetchHistoryOilPrice(provinceId.value)
    historyAreas.value = data.areas
    const matched = data.areas.find(
      (item) => String(item.areaId) === String(todayAreaId.value)
    )
    historyAreaId.value = (matched || data.areas[0] || {}).areaId || ''
  } catch (err) {
    historyError.value = err.message || '获取历史油价失败'
    historyAreas.value = []
  } finally {
    historyLoading.value = false
  }
}

function adoptProvince(province, { persist = true, area = null } = {}) {
  provinceId.value = String(province.id)
  provinceName.value = province.name
  todayAreas.value = []
  historyAreas.value = []
  todayAreaId.value = ''
  historyAreaId.value = ''
  historyError.value = ''
  if (persist) saveLocation(province, area)
}

async function selectProvince(province) {
  const changed = String(province.id) !== String(provinceId.value)
  adoptProvince(province)
  pickerOpen.value = false
  locationHint.value = ''
  if (changed || !todayAreas.value.length) await loadToday()
}

async function runLocate({ silent = false } = {}) {
  locating.value = true
  locationHint.value = '正在自动定位，请稍候…'
  const result = await locateProvince()
  locating.value = false

  if (result.province) {
    const changed = String(result.province.id) !== String(provinceId.value)
    adoptProvince(result.province)
    saveLocatedAt({ source: result.located && result.located.source, at: Date.now() })
    locationHint.value = ''
    pickerOpen.value = false
    if (changed || !todayAreas.value.length) await loadToday()
    return true
  }

  locationHint.value = silent
    ? ''
    : `${result.error || '自动定位失败'}，请手动选择省市`
  pickerOpen.value = true
  return false
}

async function selectTodayArea(area) {
  todayAreaId.value = area.areaId
  saveArea(area)
  syncHistoryArea()
}

async function selectHistoryArea(area) {
  historyAreaId.value = area.areaId
}

async function refresh() {
  // 刷新属于同省更新，保留用户当前选择的价区
  if (tab.value === 'today') await loadToday({ keepArea: true })
  else if (tab.value === 'history') {
    await loadHistory({ force: true })
    syncHistoryArea()
  }
}

function switchTab(key) {
  tab.value = key
  if (key === 'history') loadHistory()
}

onMounted(async () => {
  const hadCache = applyLocationCache()
  if (hadCache) {
    // 有本地记录时直接使用，不再触发定位，彻底解决“记不住”的问题
    await loadToday()
  } else {
    const ok = await runLocate({ silent: true })
    if (!ok) pickerOpen.value = true
  }

  if (typeof window !== 'undefined' && window.utools) {
    window.utools.onPluginEnter((action) => {
      if (action && action.code === 'oil-price') {
        // 再次唤起时保留当前价区
        if (provinceId.value) loadToday({ keepArea: true })
        else runLocate()
      }
    })
  }
})
</script>

<template>
  <div class="app">
    <div class="shell">
      <LocationHeader
        :date="todayDate"
        :province-name="provinceName"
        :loading="todayLoading"
        :locating="locating"
        @pick="pickerOpen = true"
        @locate="runLocate()"
      />

      <main class="content">
        <Today
          v-if="tab === 'today'"
          :area="currentTodayArea"
          :areas="todayAreas"
          :has-province="!!provinceId"
          :loading="todayLoading"
          :error="todayError"
          @select-area="selectTodayArea"
          @retry="loadToday({ keepArea: true })"
          @pick="pickerOpen = true"
        />

        <History
          v-else-if="tab === 'history'"
          :area="currentHistoryArea"
          :areas="historyAreas"
          :province-name="provinceName"
          :has-province="!!provinceId"
          :loading="historyLoading"
          :error="historyError"
          @select-area="selectHistoryArea"
          @retry="loadHistory({ force: true })"
          @pick="pickerOpen = true"
        />

        <Calendar v-else />
      </main>
    </div>

    <nav class="tabbar">
      <button
        v-for="item in TABS"
        :key="item.key"
        type="button"
        class="tab"
        :class="{ current: tab === item.key }"
        @click="switchTab(item.key)"
      >
        <AppIcon :name="item.icon" :size="19" />
        <span>{{ item.label }}</span>
      </button>

      <button
        type="button"
        class="tab refresh-tab"
        :disabled="todayLoading || historyLoading"
        @click="refresh"
      >
        <AppIcon name="refresh" :size="19" />
        <span>刷新</span>
      </button>
    </nav>

    <ProvincePicker
      :open="pickerOpen"
      :current-id="provinceId"
      :locating="locating"
      :location-hint="locationHint"
      @close="pickerOpen = false"
      @select="selectProvince"
      @locate="runLocate()"
    />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.shell {
  flex: 1;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 14px 20px 18px;
}

.content {
  margin-top: 14px;
}

.tabbar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  gap: 2px;
  padding: 5px 12px 6px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  box-shadow: 0 -1px 10px rgba(156, 162, 200, 0.35);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 84px;
  padding: 7px 12px 5px;
  font-size: 12px;
  color: #8b93a6;
  border-radius: 10px;
  transition: color 0.18s ease, background 0.18s ease;
}

.tab:hover {
  background: #f2f7ff;
}

.tab.current {
  color: var(--primary);
  font-weight: 600;
}

.refresh-tab {
  margin-left: 6px;
  border-left: 1px solid var(--border);
  border-radius: 0 10px 10px 0;
}

.refresh-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 420px) {
  .shell {
    padding: 14px 12px 20px;
  }

  .tab {
    min-width: 72px;
    padding: 7px 6px 5px;
  }
}
</style>
