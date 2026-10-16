<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  date: { type: String, default: '' },
  provinceName: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  locating: { type: Boolean, default: false }
})

const emit = defineEmits(['pick', 'locate'])
</script>

<template>
  <header class="head-card">
    <div class="waves" aria-hidden="true">
      <span class="wave wave-a"></span>
      <span class="wave wave-b"></span>
    </div>

    <div class="head-body">
      <div class="left">
        <span class="drop" aria-hidden="true">
          <AppIcon name="price" :size="30" />
        </span>
        <div class="meta">
          <span class="date">今日油价：{{ date || '--' }}</span>
          <strong class="province">{{ provinceName || '请选择省市' }}</strong>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="ghost" :disabled="locating" @click="emit('locate')">
          <AppIcon name="locate" :size="15" />
          <span>{{ locating ? '定位中' : '重新定位' }}</span>
        </button>
        <button type="button" class="solid" @click="emit('pick')">
          <AppIcon name="switch" :size="15" />
          <span>切换省市</span>
        </button>
      </div>
    </div>

    <span v-if="loading" class="loading-bar" aria-hidden="true"></span>
  </header>
</template>

<style scoped>
.head-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-card);
  background: linear-gradient(135deg, var(--head-from), var(--head-to));
  box-shadow: 0 2px 12px rgba(85, 151, 254, 0.42);
}

/* 用两层半透明椭圆模拟原站头卡的波浪装饰 */
.waves {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wave {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.09);
}

.wave-a {
  left: -12%;
  bottom: -78%;
  width: 78%;
  height: 150%;
}

.wave-b {
  right: -18%;
  bottom: -92%;
  width: 86%;
  height: 165%;
  background: rgba(255, 255, 255, 0.06);
}

.head-body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.drop {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: #ffffff;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.28) inset;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.86);
}

.province {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.ghost,
.solid {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 13px;
  font-size: 13px;
  border-radius: var(--radius-pill);
  transition: transform 0.16s ease, background 0.16s ease, opacity 0.16s ease;
}

.ghost {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.42) inset;
}

.ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.28);
}

.ghost:disabled {
  opacity: 0.66;
  cursor: not-allowed;
}

.solid {
  color: #0459e6;
  background: #ffffff;
  font-weight: 600;
}

.solid:hover {
  transform: translateY(-1px);
}

.loading-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 40%;
  background: rgba(255, 255, 255, 0.9);
  animation: slide 1.1s ease-in-out infinite;
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

@media (max-width: 520px) {
  .head-body {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .province {
    font-size: 21px;
  }
}
</style>
