const http = require('node:http')
const https = require('node:https')

// 中石化油价接口没有 CORS 响应头，浏览器里 fetch 会被拦截，
// 因此统一在 preload 的 Node 环境发起请求，再把结果交给渲染层。
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const OIL_ORIGIN = 'https://cx.sinopecsales.com'
const REFERER = `${OIL_ORIGIN}/yjkqiantai/core/initCpb`
const TIMEOUT = 12000

function collect(res, resolve, reject) {
  const chunks = []
  res.on('data', (chunk) => chunks.push(chunk))
  res.on('end', () =>
    resolve({
      status: res.statusCode,
      headers: res.headers,
      body: Buffer.concat(chunks).toString('utf8')
    })
  )
  res.on('error', reject)
}

// 日历图片是二进制，单独收集 Buffer
function collectBinary(res, resolve, reject) {
  const chunks = []
  res.on('data', (chunk) => chunks.push(chunk))
  res.on('end', () =>
    resolve({ status: res.statusCode, headers: res.headers, buffer: Buffer.concat(chunks) })
  )
  res.on('error', reject)
}

function directBinary(url, options) {
  const target = new URL(url)
  const isHttps = target.protocol === 'https:'
  const mod = isHttps ? https : http
  return new Promise((resolve, reject) => {
    const req = mod.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method: 'GET',
        headers: baseHeaders(options && options.headers)
      },
      (res) => collectBinary(res, resolve, reject)
    )
    req.setTimeout(TIMEOUT, () => req.destroy(new Error('ETIMEDOUT')))
    req.on('error', reject)
    req.end()
  })
}

const requestBinary = (url, options) => directBinary(url, options)

function baseHeaders(extra) {
  return Object.assign(
    { 'User-Agent': UA, Accept: '*/*', 'Accept-Encoding': 'identity' },
    extra || {}
  )
}

function directRequest(url, options) {
  const target = new URL(url)
  const isHttps = target.protocol === 'https:'
  const mod = isHttps ? https : http
  return new Promise((resolve, reject) => {
    const req = mod.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method: options.method || 'GET',
        headers: baseHeaders(options.headers)
      },
      (res) => collect(res, resolve, reject)
    )
    req.setTimeout(TIMEOUT, () => req.destroy(new Error('ETIMEDOUT')))
    req.on('error', reject)
    if (options.body) req.write(options.body)
    req.end()
  })
}

const request = (url, options = {}) => directRequest(url, options)

function parseJSON(res, label) {
  if (!res || res.status !== 200) {
    throw new Error(`${label}接口返回状态 ${res ? res.status : '未知'}`)
  }
  try {
    return JSON.parse(res.body)
  } catch (e) {
    throw new Error(`${label}接口返回数据无法解析`)
  }
}

function sessionCookie(setCookie) {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []
  const hit = list
    .map((item) => String(item).split(';')[0].trim())
    .find((item) => item.toUpperCase().startsWith('SESSION='))
  return hit || ''
}

async function loadProvince(provinceId) {
  const res = await request(`${OIL_ORIGIN}/yjkqiantai/data/switchProvince`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json, text/plain, */*',
      Referer: REFERER,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({ provinceId: String(provinceId) })
  })
  const json = parseJSON(res, '省市油价')
  if (!json || !json.data) throw new Error('省市油价接口未返回数据')
  // 非法或未开通的省份编号会返回空的 provinceCheck，这里直接判为无效
  const check = json.data.provinceCheck
  if (!check || check.PROVINCE_ID == null || !check.PROVINCE_NAME) {
    throw new Error('未找到该省市数据，请重新选择')
  }
  return { json, cookie: sessionCookie(res.headers['set-cookie']) }
}

// switchProvince 不返回 toDay，用轻量的 initMainData 补上数据日期
async function loadServerDate() {
  try {
    const res = await request(`${OIL_ORIGIN}/yjkqiantai/data/initMainData`, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: REFERER,
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    const json = parseJSON(res, '油价日期')
    return json.toDay || ''
  } catch (err) {
    return ''
  }
}

// 多价区省份返回 area[]，单价区省份只给 provinceData，这里统一成价区数组
function areaList(scope, fallbackName) {
  const rawAreas = Array.isArray(scope.area) ? scope.area : []
  if (rawAreas.length) {
    return rawAreas.map((item) => ({
      areaId: item.areaCheck && item.areaCheck.AREA_ID,
      areaName: (item.areaCheck && item.areaCheck.AREA_NAME) || fallbackName,
      check: (item.areaCheck && item.areaCheck) || {},
      payload: item.areaData
    }))
  }
  const check = scope.provinceCheck || {}
  return [
    {
      areaId: check.AREA_ID,
      areaName: fallbackName || check.PROVINCE_NAME || '',
      check,
      payload: scope.provinceData
    }
  ]
}

// 上游对部分省市会返回 null 或空对象（如 {}），需要与"真有价格"区分开
const PRICE_FIELDS = [
  'GAS_89',
  'GAS_92',
  'GAS_95',
  'GAS_98',
  'E92',
  'E95',
  'E98',
  'AIPAO_GAS_95',
  'AIPAO_GAS_98',
  'AIPAO_GAS_E92',
  'AIPAO_GAS_E95',
  'AIPAO_GAS_E98',
  'CHECHAI_0',
  'CHECHAI_10',
  'CHAI_20',
  'CHAI_35',
  'CHAI_ZYK',
  'LNG',
  'L_CNG',
  'CNG'
]

function hasUsablePrice(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false
  return PRICE_FIELDS.some((key) => typeof payload[key] === 'number')
}

// 当期数据缺失时，用最近一次已公布的调价记录兜底。
// 这比原站直接显示空白更实用，且会标注价格生效日期。
function applyLatestPrice(today, history) {
  const byArea = new Map(
    (history.areas || []).map((area) => [String(area.areaId), area])
  )
  let dataDate = ''

  const areas = today.areas.map((area) => {
    if (hasUsablePrice(area.price)) return area
    const matched = byArea.get(String(area.areaId))
    const latest = matched && (matched.records || [])[0]
    if (!latest) return area

    const date = latest.STR_START_DATE || latest.queryDate || ''
    if (date && !dataDate) dataDate = date

    // 历史记录里的 *_STATUS 是"那一次"调价的涨跌幅度，
    // 直接当作今日涨跌展示会误导，这里统一清零。
    const price = Object.assign({}, latest)
    Object.keys(price).forEach((key) => {
      if (key.endsWith('_STATUS')) price[key] = 0
    })

    return Object.assign({}, area, {
      areaName: area.areaName || matched.areaName || '',
      check: Object.keys(area.check || {}).length ? area.check : matched.check,
      price,
      priceDate: date,
      isFallback: true
    })
  })

  return Object.assign({}, today, { areas, priceDate: dataDate, isFallback: !!dataDate })
}

function normalizeToday(json, toDay) {
  const data = json.data || {}
  const check = data.provinceCheck || {}
  const provinceName = check.PROVINCE_NAME || ''
  return {
    toDay: toDay || json.toDay || '',
    provinceId: check.PROVINCE_ID,
    provinceName,
    areas: areaList(data, provinceName).map((area) => ({
      areaId: area.areaId,
      areaName: area.areaName,
      check: area.check,
      price: hasUsablePrice(area.payload) ? area.payload : null
    }))
  }
}

function normalizeHistory(json) {
  const data = json.data || {}
  const check = data.provinceCheck || {}
  const provinceName = check.PROVINCE_NAME || ''
  return {
    toDay: json.toDay || '',
    provinceId: check.PROVINCE_ID,
    provinceName,
    areas: areaList(data, provinceName).map((area) => ({
      areaId: area.areaId,
      areaName: area.areaName,
      check: area.check,
      records: Array.isArray(area.payload)
        ? area.payload
        : area.payload
          ? [area.payload]
          : []
    }))
  }
}

function friendlyError(err) {
  const message = (err && err.message) || '未知错误'
  if (/ETIMEDOUT|timeout|超时/i.test(message)) return '网络请求超时，请检查网络后重试'
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message)) return '无法解析服务器地址，请检查网络连接'
  if (/ECONNREFUSED|ECONNRESET|socket hang up/i.test(message)) return '网络连接被中断，请稍后重试'
  if (/CERT|SSL|TLS/i.test(message)) return '安全连接建立失败，请检查网络环境'
  return message
}

const wrap = (handler) => async (...args) => {
  try {
    return { ok: true, data: await handler(...args) }
  } catch (err) {
    return { ok: false, error: friendlyError(err) }
  }
}

window.services = {
  // 今日油价：一次 switchProvince 即可拿到整省价格与价区
  getProvinceOilPrice: wrap(async (provinceId) => {
    const [{ json, cookie }, toDay] = await Promise.all([
      loadProvince(provinceId),
      loadServerDate()
    ])
    const today = normalizeToday(json, toDay)

    // 上游对湖北、河北、湖南、新疆等地尚未发布当期价格，
    // 此时用最近一次已公布的调价记录兜底，避免界面一片“数据未更新”。
    const missing = today.areas.length === 0 || today.areas.every((a) => !a.price)
    if (!missing) return today

    try {
      const res = await request(`${OIL_ORIGIN}/yjkqiantai/data/initOilPrice`, {
        headers: {
          Accept: 'application/json, text/plain, */*',
          Referer: REFERER,
          Cookie: cookie,
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      return applyLatestPrice(today, normalizeHistory(parseJSON(res, '历史油价')))
    } catch (err) {
      return today
    }
  }),

  // 历史油价：switchProvince 返回的 SESSION 需要串给 initOilPrice
  getHistoryOilPrice: wrap(async (provinceId) => {
    const { cookie } = await loadProvince(provinceId)
    const res = await request(`${OIL_ORIGIN}/yjkqiantai/data/initOilPrice`, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: REFERER,
        Cookie: cookie,
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    return normalizeHistory(parseJSON(res, '历史油价'))
  }),

  // 调价日历图片：经 Node 侧取回并转成 data URL，
  // 避免渲染层直连受 CORS / 资源策略影响。
  getCalendarImage: wrap(async (url) => {
    if (typeof url !== 'string' || !/^https:\/\/cx\.sinopecsales\.com\//.test(url)) {
      throw new Error('图片地址不合法')
    }
    const res = await requestBinary(url, { headers: { Referer: REFERER } })
    if (!res || res.status !== 200) {
      throw new Error(`图片不存在（${res ? res.status : '未知'}）`)
    }
    return { dataUrl: `data:image/png;base64,${res.buffer.toString('base64')}` }
  }),

  // IP 定位：返回原始地名，省市归一化由渲染层负责
  detectProvince: wrap(async () => {
    const providers = [
      {
        name: 'ip-api',
        run: async () => {
          const res = await request(
            'http://ip-api.com/json/?lang=zh-CN&fields=status,country,regionName,city,isp,query'
          )
          const json = parseJSON(res, 'IP 定位')
          if (json.status !== 'success') throw new Error('IP 定位服务返回失败')
          return { region: json.regionName, city: json.city, isp: json.isp, ip: json.query }
        }
      },
      {
        name: 'ipip',
        run: async () => {
          const res = await request('http://myip.ipip.net/')
          if (res.status !== 200) throw new Error('IP 定位服务返回失败')
          // 当前 IP：1.2.3.4 来自于：中国 湖北 荆州 电信
          const matched = res.body.match(/来自于：\s*(\S+)\s+(\S+)\s*(\S+)?/)
          if (!matched) throw new Error('IP 定位结果无法解析')
          return { region: matched[2], city: matched[3] || '', isp: '', ip: '' }
        }
      },
      {
        name: 'ipinfo',
        run: async () => {
          const res = await request('https://ipinfo.io/json')
          const json = parseJSON(res, 'IP 定位')
          return { region: json.region, city: json.city, isp: json.org, ip: json.ip }
        }
      }
    ]

    let lastError = null
    for (const provider of providers) {
      try {
        const located = await provider.run()
        if (located && located.region) {
          return Object.assign({ source: provider.name }, located)
        }
        lastError = new Error(`${provider.name} 未返回有效位置`)
      } catch (err) {
        lastError = err
      }
    }
    throw lastError || new Error('自动定位失败')
  })
}

// ---------------------------------------------------------------------------
// MCP / AI 工具注册
// 声明见 plugin.json 的 tools 字段；此处注册实现，供 uTools 的 MCP 服务
// 与 utools.ai() 的 Function Calling 调用。
// ---------------------------------------------------------------------------

// 省市与油品定义从共享数据读取，避免与渲染层的 src/api/provinces.js 重复。
// 该文件同时被渲染层通过 Vite alias 引入，构建时会一并拷贝到 dist。
const shared = require('./shared/oil-data.json')
const PROVINCES = shared.provinces
// 工具返回给模型的标号名称与单位（名称用 toolLabel，避免拼接歧义）
const TOOL_OIL_TYPES = shared.oilTypes.map((item) => ({
  flag: item.flag,
  label: item.toolLabel,
  price: item.priceField,
  status: item.statusField,
  unit: item.measure
}))

const normalizeName = (value) =>
  String(value || '').trim().toLowerCase().replace(/[\s_-]/g, '')

// 接受省名、全称或编号，统一解析为 provinceId（与渲染层 findProvinceByName 同源逻辑）
function resolveProvinceId(input) {
  const raw = String(input == null ? '' : input).trim()
  if (!raw) return ''
  if (/^\d{2,5}$/.test(raw)) return raw

  const exact = PROVINCES.find((item) => item.name === raw)
  if (exact) return exact.id

  const prefix = PROVINCES.find((item) => raw.startsWith(item.name))
  if (prefix) return prefix.id

  const included = PROVINCES.find((item) => raw.includes(item.name))
  if (included) return included.id

  const key = normalizeName(raw)
  const byAlias = PROVINCES.find((item) =>
    (item.alias || []).some((alias) => normalizeName(alias) === key)
  )
  return byAlias ? byAlias.id : ''
}

// 0.00 视为未更新，返回 null 而不是 0，避免模型误读
const toolPrice = (value) => {
  if (value == null || value === '' || Number(value) === 0) return null
  const num = Number(value)
  return Number.isNaN(num) ? null : Number(num.toFixed(2))
}

const toolDelta = (value) => {
  if (value == null || value === '') return null
  const num = Number(value)
  if (Number.isNaN(num) || num === 0) return null
  return Number(num.toFixed(2))
}

// 把某个价区的原始数据整理成对模型友好的结构
function formatArea(area) {
  const check = area.check || {}
  const price = area.price || {}
  const oils = TOOL_OIL_TYPES.filter((item) => check[item.flag] === 'Y')
    .map((item) => ({
      name: item.label,
      price: toolPrice(price[item.price]),
      unit: item.unit,
      change: toolDelta(price[item.status])
    }))
    .filter((item) => item.price != null)

  return {
    area_name: area.areaName || '',
    oils,
    price_date: area.priceDate || ''
  }
}

// 工具共用的取数逻辑：优先参数 → 上次选择 → 自动定位
async function resolveTargetProvince(input) {
  const requested = resolveProvinceId(input)
  if (requested) return requested

  // 读取用户在插件里记住的省市（与渲染层共用同一存储键）
  try {
    const saved = utools.dbStorage.getItem('oil-price/province')
    const savedId = saved && saved.id ? String(saved.id) : ''
    if (savedId) return savedId
  } catch (err) {
    /* 存储不可用时继续走自动定位 */
  }

  const located = await window.services.detectProvince()
  if (located && located.ok && located.data) {
    const matched =
      resolveProvinceId(located.data.region) || resolveProvinceId(located.data.city)
    if (matched) return matched
  }
  throw new Error('无法确定要查询的省市，请显式传入 province 参数')
}

async function toolGetOilPrice(params) {
  const provinceId = await resolveTargetProvince(params && params.province)
  const result = await window.services.getProvinceOilPrice(provinceId)
  if (!result.ok) throw new Error(result.error)

  const data = result.data
  return {
    province: data.provinceName,
    data_date: data.toDay,
    // 上游尚未发布当期价格时，会回退到最近一次已公布的调价
    is_latest_published: !data.isFallback,
    note: data.isFallback
      ? `该省市当期油价尚未发布，以下为 ${data.priceDate} 起执行的最近一次公布价格`
      : '',
    areas: (data.areas || []).map(formatArea)
  }
}

async function toolGetOilPriceHistory(params) {
  const provinceId = await resolveTargetProvince(params && params.province)
  const result = await window.services.getHistoryOilPrice(provinceId)
  if (!result.ok) throw new Error(result.error)

  const limit = Math.min(Math.max(Number((params && params.limit) || 12) || 12, 1), 24)
  const data = result.data

  return {
    province: data.provinceName,
    areas: (data.areas || []).map((area) => {
      const check = area.check || {}
      const oils = TOOL_OIL_TYPES.filter((item) => check[item.flag] === 'Y')
      return {
        area_name: area.areaName || '',
        records: (area.records || []).slice(0, limit).map((row) => {
          const prices = {}
          oils.forEach((item) => {
            const value = toolPrice(row[item.price])
            if (value != null) prices[item.label] = value
          })
          return { date: row.STR_START_DATE || row.queryDate || '', prices }
        })
      }
    })
  }
}

async function toolListProvinces() {
  return {
    provinces: PROVINCES.map((item) => ({ id: item.id, name: item.name })),
    note: '查询油价时可直接传省市名称，例如「湖北」。'
  }
}

if (typeof utools !== 'undefined' && typeof utools.registerTool === 'function') {
  utools.registerTool('oil_price_get', toolGetOilPrice)
  utools.registerTool('oil_price_history', toolGetOilPriceHistory)
  utools.registerTool('oil_price_provinces', toolListProvinces)
}
