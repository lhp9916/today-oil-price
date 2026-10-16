// 省市列表与 provinceId 沿用中石化接口的编号，保证 switchProvince 可直接使用
export const PROVINCES = [
  { id: '11', name: '北京', alias: ['Beijing', 'Peking'] },
  { id: '12', name: '天津', alias: ['Tianjin'] },
  { id: '13', name: '河北', alias: ['Hebei'] },
  { id: '14', name: '山西', alias: ['Shanxi'] },
  { id: '15', name: '内蒙古', alias: ['Inner Mongolia', 'Nei Mongol', 'Neimenggu'] },
  { id: '21', name: '辽宁', alias: ['Liaoning'] },
  { id: '22', name: '吉林', alias: ['Jilin'] },
  { id: '23', name: '黑龙江', alias: ['Heilongjiang'] },
  { id: '31', name: '上海', alias: ['Shanghai'] },
  { id: '32', name: '江苏', alias: ['Jiangsu'] },
  { id: '33', name: '浙江', alias: ['Zhejiang'] },
  { id: '34', name: '安徽', alias: ['Anhui'] },
  { id: '35', name: '福建', alias: ['Fujian'] },
  { id: '36', name: '江西', alias: ['Jiangxi'] },
  { id: '37', name: '山东', alias: ['Shandong'] },
  { id: '41', name: '河南', alias: ['Henan'] },
  { id: '42', name: '湖北', alias: ['Hubei'] },
  { id: '43', name: '湖南', alias: ['Hunan'] },
  { id: '44', name: '广东', alias: ['Guangdong'] },
  { id: '45', name: '广西', alias: ['Guangxi'] },
  { id: '46', name: '海南', alias: ['Hainan'] },
  { id: '50', name: '重庆', alias: ['Chongqing'] },
  { id: '51', name: '四川', alias: ['Sichuan'] },
  { id: '52', name: '贵州', alias: ['Guizhou'] },
  { id: '53', name: '云南', alias: ['Yunnan'] },
  { id: '54', name: '西藏', alias: ['Tibet', 'Xizang'] },
  { id: '61', name: '陕西', alias: ['Shaanxi'] },
  { id: '62', name: '甘肃', alias: ['Gansu'] },
  { id: '63', name: '青海', alias: ['Qinghai'] },
  { id: '64', name: '宁夏', alias: ['Ningxia'] },
  { id: '65', name: '新疆', alias: ['Xinjiang'] }
]

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

// 油品标号：flag 为省份开关字段，price/status 为价格与涨跌字段，
// measure 决定单价单位（天然气按千克计价）
const GAS = '元/升'
const NATURAL_GAS = '元/千克'

export const OIL_TYPES = [
  { flag: 'GAS_89', label: '89号', unit: '汽油', price: 'GAS_89', status: 'GAS_89_STATUS', measure: GAS },
  { flag: 'GAS_92', label: '92号', unit: '汽油', price: 'GAS_92', status: 'GAS_92_STATUS', measure: GAS },
  { flag: 'GAS_95', label: '95号', unit: '汽油', price: 'GAS_95', status: 'GAS_95_STATUS', measure: GAS },
  { flag: 'GAS_98', label: '98号', unit: '汽油', price: 'GAS_98', status: 'GAS_98_STATUS', measure: GAS },
  { flag: 'E92', label: 'E92号', unit: '汽油', price: 'E92', status: 'E92_STATUS', measure: GAS },
  { flag: 'E95', label: 'E95号', unit: '汽油', price: 'E95', status: 'E95_STATUS', measure: GAS },
  { flag: 'E98', label: 'E98号', unit: '汽油', price: 'E98', status: 'E98_STATUS', measure: GAS },
  {
    flag: 'AIPAO95',
    label: '爱跑95',
    unit: '汽油',
    price: 'AIPAO_GAS_95',
    status: 'AIPAO_GAS_95_STATUS',
    measure: GAS
  },
  {
    flag: 'AIPAO98',
    label: '爱跑98',
    unit: '汽油',
    price: 'AIPAO_GAS_98',
    status: 'AIPAO_GAS_98_STATUS',
    measure: GAS
  },
  {
    flag: 'AIPAOE92',
    label: '爱跑E92',
    unit: '汽油',
    price: 'AIPAO_GAS_E92',
    status: 'AIPAO_GAS_E92_STATUS',
    measure: GAS
  },
  {
    flag: 'AIPAOE95',
    label: '爱跑E95',
    unit: '汽油',
    price: 'AIPAO_GAS_E95',
    status: 'AIPAO_GAS_E95_STATUS',
    measure: GAS
  },
  {
    flag: 'AIPAOE98',
    label: '爱跑E98',
    unit: '汽油',
    price: 'AIPAO_GAS_E98',
    status: 'AIPAO_GAS_E98_STATUS',
    measure: GAS
  },
  {
    flag: 'CHAI_0',
    label: '0号',
    unit: '柴油',
    price: 'CHECHAI_0',
    status: 'CHECHAI_0_STATUS',
    measure: GAS
  },
  {
    flag: 'CHAI_10',
    label: '-10号',
    unit: '柴油',
    price: 'CHECHAI_10',
    status: 'CHECHAI_10_STATUS',
    measure: GAS
  },
  { flag: 'CHAI_20', label: '-20号', unit: '柴油', price: 'CHAI_20', status: 'CHAI_20_STATUS', measure: GAS },
  { flag: 'CHAI_35', label: '-35号', unit: '柴油', price: 'CHAI_35', status: 'CHAI_35_STATUS', measure: GAS },
  {
    flag: 'CHAI_ZYK',
    label: '柴油卡',
    unit: '免惠最低价',
    price: 'CHAI_ZYK',
    status: 'CHAI_ZYK_STATUS',
    measure: GAS
  },
  { flag: 'LNG', label: 'LNG', unit: '天然气', price: 'LNG', status: 'LNG_STATUS', measure: NATURAL_GAS },
  { flag: 'L_CNG', label: 'L-CNG', unit: '天然气', price: 'L_CNG', status: 'L_CNG_STATUS', measure: NATURAL_GAS },
  { flag: 'CNG', label: 'CNG', unit: '天然气', price: 'CNG', status: 'CNG_STATUS', measure: NATURAL_GAS }
]

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
