<script setup>
import { ref, computed, onMounted } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { calendarMonths, fetchCalendarImage } from '../api/oil'

const months = ref(calendarMonths().map((item) => ({ ...item, dataUrl: '', failed: false })))
const loading = ref(true)

const visibleMonths = computed(() => months.value.filter((item) => !item.failed))
const allFailed = computed(() => visibleMonths.value.length === 0 && !loading.value)
const title = computed(() => `${new Date().getFullYear()}年油价调整日历`)

// 图片经 preload 取回，越界月份返回 404 时标记失败并隐藏
onMounted(async () => {
  await Promise.all(
    months.value.map(async (item) => {
      const dataUrl = await fetchCalendarImage(item.url)
      item.dataUrl = dataUrl || ''
      item.failed = !dataUrl
    })
  )
  loading.value = false
})
</script>

<template>
  <section class="calendar">
    <div class="head card">
      <h2 class="title">{{ title }}</h2>
      <p class="tips">
        <AppIcon name="calendar" :size="15" />
        <span>调价日（调价时间为当日 24 时）</span>
      </p>
    </div>

    <div v-if="loading" class="months">
      <div v-for="item in months" :key="item.key" class="month card skeleton-month"></div>
    </div>

    <div v-else-if="!allFailed" class="months">
      <figure v-for="item in visibleMonths" :key="item.key" class="month card">
        <img :src="item.dataUrl" :alt="`${item.label}油价调整日历`" />
        <figcaption>{{ item.label }}</figcaption>
      </figure>
    </div>

    <div v-else class="state card">
      <AppIcon name="empty" :size="34" />
      <p class="state-title">暂无调价日历</p>
      <p class="state-desc">当前年份的调价日历图片暂未发布，请稍后再试。</p>
    </div>

    <p class="foot-note">数据来源：中国石化，日历图片按自然月发布。</p>
  </section>
</template>

<style scoped>
.calendar {
  animation: fade-in 0.22s ease;
}

.head {
  padding: 16px 18px;
  margin-bottom: 14px;
}

.title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.02em;
}

.tips {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}

.months {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}

.month {
  overflow: hidden;
  animation: rise-in 0.26s ease both;
}

.skeleton-month {
  height: 300px;
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

.month img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.month figcaption {
  padding: 10px 12px;
  font-size: 13px;
  color: #5a6a86;
  text-align: center;
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

.foot-note {
  margin-top: 14px;
  font-size: 12px;
  color: var(--muted);
}
</style>
