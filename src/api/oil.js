import { findProvince, findProvinceByName } from './provinces'

const services = () => (typeof window !== 'undefined' ? window.services : null)

// preload 未注入（例如直接开浏览器）时给出统一的可读错误
function ensureServices() {
  const api = services()
  if (!api) {
    throw new Error('未检测到 uTools 运行环境，请在 uTools 中打开本插件')
  }
  return api
}

function unwrap(result, label) {
  if (!result || result.ok !== true) {
    throw new Error((result && result.error) || `${label}失败`)
  }
  return result.data
}

// 把后端价区数组挂到省市对象上，方便界面直接用名称展示
const decorate = (payload) => {
  const provinceId = String(payload.provinceId || '')
  return {
    provinceId,
    provinceName:
      payload.provinceName || (findProvince(provinceId) || {}).name || '未知地区',
    toDay: payload.toDay || '',
    priceDate: payload.priceDate || '',
    isFallback: !!payload.isFallback,
    areas: (payload.areas || []).map((area) => ({
      areaId: area.areaId != null ? String(area.areaId) : '',
      areaName: area.areaName || payload.provinceName || '',
      check: area.check || {},
      price: area.price || null,
      priceDate: area.priceDate || '',
      isFallback: !!area.isFallback,
      records: area.records || []
    }))
  }
}

export async function fetchOilPrice(provinceId) {
  const api = ensureServices()
  return decorate(unwrap(await api.getProvinceOilPrice(String(provinceId)), '获取油价'))
}

export async function fetchHistoryOilPrice(provinceId) {
  const api = ensureServices()
  return decorate(
    unwrap(await api.getHistoryOilPrice(String(provinceId)), '获取历史油价')
  )
}

// 定位失败不抛错，交给调用方决定是否弹出省份选择
export async function locateProvince() {
  const api = services()
  if (!api) return { province: null, located: null, error: '未检测到 uTools 运行环境' }
  try {
    const located = unwrap(await api.detectProvince(), '自动定位')
    const province =
      findProvinceByName(located.region) || findProvinceByName(located.city) || null
    return { province, located, error: province ? '' : '未能匹配到省市' }
  } catch (err) {
    return { province: null, located: null, error: err.message || '自动定位失败' }
  }
}

// 调价日历：原站按月提供 PNG，越界月份返回 404，由图片加载失败自动隐藏
export const CALENDAR_ORIGIN = 'https://cx.sinopecsales.com/yjkqiantai/oilImages'

export function calendarMonths(date = new Date(), count = 3) {
  const list = []
  for (let i = 0; i < count; i += 1) {
    const cursor = new Date(date.getFullYear(), date.getMonth() + i, 1)
    const year = cursor.getFullYear()
    const month = cursor.getMonth() + 1
    list.push({
      key: `${year}${String(month).padStart(2, '0')}`,
      year,
      month,
      label: `${year}年${month}月`,
      url: `${CALENDAR_ORIGIN}/${year}${String(month).padStart(2, '0')}.png`
    })
  }
  return list
}

// 经 preload 取回日历图片，失败（如越界月份返回 404）时返回 null 由界面隐藏
export async function fetchCalendarImage(url) {
  const api = services()
  if (!api || typeof api.getCalendarImage !== 'function') return null
  try {
    const result = await api.getCalendarImage(url)
    return result && result.ok && result.data ? result.data.dataUrl : null
  } catch (err) {
    return null
  }
}
