// 位置记忆：uTools 环境下用 dbStorage（跟随账号云同步），
// 脱离 uTools（浏览器调试或纯网页）时退回 localStorage。
const KEY_PROVINCE = 'oil-price/province'
const KEY_AREA = 'oil-price/area'
const KEY_LOCATED_AT = 'oil-price/last-located'

const hasUtools = () => typeof window !== 'undefined' && !!window.utools

function read(key) {
  try {
    if (hasUtools()) return window.utools.dbStorage.getItem(key)
    const raw = window.localStorage.getItem(key)
    return raw == null ? null : JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function write(key, value) {
  try {
    if (hasUtools()) {
      window.utools.dbStorage.setItem(key, value)
      return true
    }
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    return false
  }
}

function remove(key) {
  try {
    if (hasUtools()) {
      window.utools.dbStorage.removeItem(key)
      return
    }
    window.localStorage.removeItem(key)
  } catch (e) {
    /* 忽略清理失败 */
  }
}

// 记录用户主动选择的省市（含自动定位落地的结果）
export const saveLocation = (province, area) => {
  if (!province) return false
  write(KEY_PROVINCE, { id: String(province.id), name: province.name })
  if (area) {
    write(KEY_AREA, { id: area.areaId, name: area.areaName })
  } else {
    remove(KEY_AREA)
  }
  return true
}

export const loadLocation = () => {
  const province = read(KEY_PROVINCE)
  if (!province || !province.id) return null
  const area = read(KEY_AREA)
  return {
    provinceId: String(province.id),
    provinceName: province.name || '',
    areaId: area && area.id != null ? String(area.id) : '',
    areaName: (area && area.name) || ''
  }
}

// 保存价区选择，但不改变已记住的省份
export const saveArea = (area) => {
  if (!area) {
    remove(KEY_AREA)
    return
  }
  write(KEY_AREA, { id: area.areaId, name: area.areaName })
}

// 仅用于记录最近一次自动定位的来源与时间，便于排查定位问题
export const saveLocatedAt = (payload) => write(KEY_LOCATED_AT, payload || null)
