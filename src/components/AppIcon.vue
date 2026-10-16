<script setup>
// 全部用内联 SVG 重绘，不依赖中石化的图片素材
defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 18
  }
})
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- 油价标牌 -->
    <template v-if="name === 'price'">
      <path d="M12 3.2c3 3.3 5.2 6 5.2 9.1a5.2 5.2 0 0 1-10.4 0c0-3.1 2.2-5.8 5.2-9.1Z" />
      <path d="M12 9.4v5.2" />
    </template>

    <!-- 历史曲线 -->
    <template v-else-if="name === 'history'">
      <path d="M4 17.5 9 11l4 3.6L20 6" />
      <path d="M20 10.2V6h-4.2" />
      <path d="M4 20.4h16" />
    </template>

    <!-- 日历 -->
    <template v-else-if="name === 'calendar'">
      <rect x="3.6" y="5.4" width="16.8" height="14.2" rx="2.6" />
      <path d="M3.6 10h16.8" />
      <path d="M8.4 3.6v3.2M15.6 3.6v3.2" />
      <path d="M8.6 14.2h2.2M13.2 14.2h2.2M8.6 17.2h2.2" />
    </template>

    <!-- 定位 -->
    <template v-else-if="name === 'locate'">
      <path d="M12 21s6.4-5.3 6.4-10.2A6.4 6.4 0 0 0 5.6 10.8C5.6 15.7 12 21 12 21Z" />
      <circle cx="12" cy="10.6" r="2.4" />
    </template>

    <!-- 切换 -->
    <template v-else-if="name === 'switch'">
      <path d="M4.4 8.6h13.2l-3-3" />
      <path d="M19.6 15.4H6.4l3 3" />
    </template>

    <!-- 刷新 -->
    <template v-else-if="name === 'refresh'">
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4.2V9h-4.8" />
    </template>

    <!-- 关闭 -->
    <template v-else-if="name === 'close'">
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />
    </template>

    <!-- 无数据 -->
    <template v-else-if="name === 'empty'">
      <rect x="3.6" y="6" width="16.8" height="12.4" rx="2.6" />
      <path d="M8 6V4.6M16 6V4.6" />
      <path d="M8.6 12.4h6.8" />
    </template>
  </svg>
</template>

<style scoped>
.app-icon {
  display: block;
  flex: none;
}
</style>
