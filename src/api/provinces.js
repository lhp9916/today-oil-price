import shared from '@oil-data'

// 省市列表与油品定义放在 public/shared/oil-data.json，
// 由渲染层（本文件）与 preload 的工具层共用，避免两处定义产生偏差。
export const PROVINCES = shared.provinces

export const findProvince = (id) =>
  PROVINCES.find((item) => String(item.id) === String(id)) || null

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]/g, '')

export const findProvinceByName = (name) => {
  const target = String(name || '').trim()
  if (!target) return null

  // 先按中文全名/简称匹配（ip-api、ipip 返回中文）
  const direct = PROVINCES.find(
    (item) => item.name === target || target.startsWith(item.name)
  )
  if (direct) return direct

  // 再按中文包含匹配，兜住"广西壮族自治区"这类全称
  const included = PROVINCES.find((item) => target.includes(item.name))
  if (included) return included

  // 最后按英文别名匹配（ipinfo 返回 Hubei / Inner Mongolia 等）
  const key = normalize(target)
  return (
    PROVINCES.find((item) =>
      (item.alias || []).some((alias) => normalize(alias) === key)
    ) || null
  )
}

// 油品标号：unit 为类别，price/status 为价格与涨跌字段，measure 决定单价单位。
// 字段名沿用原有约定，共享数据里的 priceField/statusField/category 在此映射，
// 使消费方（Today/History/PriceCard）无需改动。
export const OIL_TYPES = shared.oilTypes.map((item) => ({
  flag: item.flag,
  label: item.label,
  unit: item.category,
  price: item.priceField,
  status: item.statusField,
  measure: item.measure
}))

const enabled = (check, flag) => !!check && check[flag] === 'Y'

// 该价区需要展示的油品（含没有价格数据的标号）
export const oilTypesOf = (check) => OIL_TYPES.filter((item) => enabled(check, item.flag))

// 单位文案：汽油/柴油用 元/升，天然气用 元/千克，混合时两者都列出
export const measureLabels = (types) => {
  const set = new Set(types.map((item) => item.measure))
  return Array.from(set)
}

// 统一价格展示：0.00 视为未更新显示 "-"
export const formatPrice = (value) => {
  if (value == null || value === '' || Number(value) === 0) return '-'
  const num = Number(value)
  return Number.isNaN(num) ? '-' : num.toFixed(2)
}

// 调价幅度：>0 涨价（红）、<0 降价（蓝）、0 持平（不显示）
export const formatDelta = (value) => {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num) || num === 0) return ''
  return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2)
}

export const deltaClass = (value) => {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num) || num === 0) return ''
  return num > 0 ? 'delta-up' : 'delta-down'
}
