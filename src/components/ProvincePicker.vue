<script setup>
import AppIcon from './AppIcon.vue'
import { PROVINCES } from '../api/provinces'

defineProps({
  open: { type: Boolean, default: false },
  currentId: { type: [String, Number], default: '' },
  locating: { type: Boolean, default: false },
  locationHint: { type: String, default: '' }
})

const emit = defineEmits(['close', 'select', 'locate'])
</script>

<template>
  <Transition name="sheet">
    <div v-if="open" class="sheet-mask" @click.self="emit('close')">
      <section class="sheet" role="dialog" aria-label="选择省市">
        <header class="sheet-head">
          <h3>选择省市查看油价</h3>
          <button class="close" type="button" aria-label="关闭" @click="emit('close')">
            <AppIcon name="close" :size="18" />
          </button>
        </header>

        <p class="hint">
          <span v-if="locating">正在自动定位，请稍候…</span>
          <span v-else-if="locationHint">{{ locationHint }}</span>
          <span v-else>选择后将长期记住，下次进入直接打开该省份</span>
        </p>

        <button class="locate-btn" type="button" :disabled="locating" @click="emit('locate')">
          <AppIcon name="locate" :size="16" />
          <span>{{ locating ? '定位中…' : '自动定位我的位置' }}</span>
        </button>

        <ul class="grid">
          <li v-for="item in PROVINCES" :key="item.id">
            <button
              type="button"
              class="province"
              :class="{ current: String(item.id) === String(currentId) }"
              @click="emit('select', item)"
            >
              {{ item.name }}
            </button>
          </li>
        </ul>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(24, 44, 84, 0.42);
  backdrop-filter: blur(1.5px);
  animation: fade-in 0.18s ease;
}

.sheet {
  width: 100%;
  max-width: var(--content-max);
  max-height: 82vh;
  overflow-y: auto;
  padding: 18px 20px 24px;
  border-radius: 18px 18px 0 0;
  background: linear-gradient(to bottom, #bed7fd, #ddeafc 42%, #f4f8ff);
  box-shadow: 0 -2px 18px rgba(120, 150, 200, 0.5);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-head h3 {
  font-size: 16px;
  color: #353535;
}

.close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #4a6ea8;
  background: rgba(255, 255, 255, 0.72);
  transition: background 0.18s ease;
}

.close:hover {
  background: #ffffff;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #5a7398;
  line-height: 1.5;
}

.locate-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  margin-top: 12px;
  padding: 0 14px;
  font-size: 13px;
  color: #ffffff;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, var(--head-from), var(--primary-deep));
  box-shadow: 0 2px 8px rgba(85, 151, 254, 0.42);
  transition: opacity 0.18s ease;
}

.locate-btn:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.province {
  width: 100%;
  height: 34px;
  font-size: 14px;
  color: #353535;
  border-radius: var(--radius-chip);
  background: #ffffff;
  box-shadow: 0 1px 6px rgba(156, 159, 200, 0.5);
  transition: transform 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.province:hover {
  transform: translateY(-1px);
  color: var(--primary-deep);
}

.province.current {
  color: #ffffff;
  background: var(--primary);
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
</style>
