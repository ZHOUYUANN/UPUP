/**
 * by: luszy.com 
 * 举牌小人生成器
 * 使用方法 new Upup(param) 即可，支持可输入自动转换 
 */
;(function (window) {
  'use strict'

  const DEFAULTS = Object.freeze({
    content: null, // 渲染最终图片的区块
    text: null, // 必传的文字 dom
    color: '42240f', // 字体颜色
    left: 200, // 第一行整体向右偏移；传 0/null 则走阶梯排列
    bgColor: 'rgba(219, 114, 40, 1)',
    imagesPath: './images/',
    imgObj: { imgLD: 35, imgBD: 20, left: 45 },
    textObj: { width: 40, height: 40, textRD: 20, textBD: 10 },
    isTranspant: false,
    isShowLogo: true,
    logoObj: {
      src: 'https://luszy.com/home/usr/themes/life/common/image/avatar.jpg',
      width: 40,
      height: 40,
      x: 0,
      y: 0
    },
    siteObj: { url: 'luszy.com', x: 0, y: 50 }
  })

  /** 绘制常量 */
  const CANVAS_W = 1920
  const CANVAS_H = 980
  const IMG_URL_COUNT = 40
  const ROW_STEP = 45 // 未传 left 时每行的阶梯偏移
  const LINE_RATIO = 0.3 // 行高比例
  const FONT = '30px SimHei'
  const TEXT_MATRIX = [0.766044, 0.3, -0.742788, 0.766044, 20, 0] // 原倾斜矩阵
  const THROTTLE_MS = 200

  class Upup {
    constructor(params) {
      this.params = this.mergeParams(params || {})
      this.bindInput()
      this.refresh()
    }

    /** 重新渲染 */
    refresh(extraParams) {
      Object.assign(this.params, extraParams || {})
      this.render()
        .then((img) => {
          const { content } = this.params
          if (!content) return
          content.innerHTML = ''
          content.appendChild(img)
        })
        .catch((err) => console.error('[Upup] render failed:', err))
    }

    /** 生成最终图片，可通过 callback 拿到 Image 对象 */
    async init(callback) {
      const img = await this.render()

      if (typeof callback === 'function') callback(img)
      return img
    }

    /** 浅合并用户参数到默认值副本，嵌套对象单独合并 */
    mergeParams(params) {
      const merged = { ...DEFAULTS }
      const paramArr = ['imgObj', 'textObj', 'logoObj', 'siteObj']
      paramArr.forEach((k) => {
        merged[k] = { ...DEFAULTS[k], ...(params[k] || {}) }
      })
      return Object.assign(merged, params)
    }

    /** 监听输入框，自动触发重绘 */
    bindInput() {
      const { text } = this.params
      if (!text || typeof text.addEventListener !== 'function') return
      text.addEventListener('input', (e) => {
        text.innerHTML = e.target.value
        this.throttle(() => this.refresh())
      })
    }

    /**
     * 主渲染流水线：
     * 1) 拆行拆字 → 2) 并行加载小人图 → 3) 并行渲染文字贴片 →
     * 4) 计算坐标绘制 → 5) 裁剪画布 → 6) 叠加 logo → 7) 导出 Image
     */
    async render() {
      const p = this.params
      const lines = (p.text && p.text.value ? p.text.value : '').split('\n')
      if (!lines.length || lines.every((l) => l === '')) {
        throw new Error('[Upup] text 内容为空，无法渲染')
      }

      // 1. 并行加载每一行字符对应的小人图
      const rows = await Promise.all(
        lines.map((line) => Promise.all(line.split('').map((ch) => this.loadOneImage(ch))))
      )

      // 2. 并行渲染每个字符的"倾斜文字贴片"，结果挂回 cell，便于后续同步绘制
      await Promise.all(
        rows.flat().map(async (cell) => {
          if (cell.text === ' ') return
          cell.textImg = this.renderChar(cell.text)
        })
      )

      // 3. 准备画布并铺底色
      const canvas = document.createElement('canvas')
      canvas.width = CANVAS_W
      canvas.height = CANVAS_H
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = p.isTranspant ? 'rgba(0,0,0,0)' : p.bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 4. 计算坐标并绘制小人 + 文字
      const bounds = []
      for (let r = 0; r < rows.length; r++) {
        const distance = rows.length - r - 1
        for (let c = 0; c < rows[r].length; c++) {
          const cell = rows[r][c]
          if (cell.text === ' ') continue // 空格不绘制
          const img = cell.image
          const { x, y } = this.layout(r, c, distance, img)
          bounds.push({ x: x + img.naturalWidth, y: y + img.naturalHeight })

          ctx.drawImage(img, x, y, img.naturalWidth, img.naturalHeight)
          ctx.drawImage(cell.textImg, x + p.textObj.textRD, y + p.textObj.textBD)
        }
      }

      if (!bounds.length) throw new Error('[Upup] 没有可绘制的内容')

      // 5. 裁剪到实际内容大小：先快照像素 → 改尺寸 → 回贴
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = Math.max(...bounds.map((b) => b.x))
      canvas.height = Math.max(...bounds.map((b) => b.y))
      ctx.putImageData(snapshot, 0, 0)

      // 6. 叠加 logo / 站点信息
      await this.drawLogo(ctx)

      // 7. 导出
      return this.toImage(canvas)
    }

    /** 计算单个字符坐标 */
    layout(row, col, distance, image) {
      const { left, imgObj } = this.params
      let x
      if (left) {
        x = left + (col * image.naturalWidth - col * imgObj.imgLD) - row * imgObj.left
      } else {
        x = col * image.naturalWidth - col * imgObj.imgLD + distance * ROW_STEP
      }
      const y = row * image.naturalHeight * LINE_RATIO + col * imgObj.imgBD
      return { x, y }
    }

    /** 加载单个字符的小人图 */
    loadOneImage(ch) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        const url = this.imgUrl(Math.floor(Math.random() * IMG_URL_COUNT))
        img.onload = () => resolve({ image: img, text: ch })
        img.onerror = () => reject(new Error(`[Upup] 小人图加载失败：${url}`))
        img.src = url
      })
    }

    /** 把单字符渲染为带倾斜效果的透明 PNG 贴片 */
    renderChar(word) {
      const c = document.createElement('canvas')
      c.width = this.params.textObj.width
      c.height = this.params.textObj.height
      const ctx = c.getContext('2d')

      ctx.transform(...TEXT_MATRIX)
      ctx.font = FONT
      ctx.textAlign = 'center'
      ctx.fillStyle = this.params.color
      ctx.fillText(word, 14, 28)

      return c
    }

    /** 绘制 logo 与站点信息 */
    drawLogo(ctx) {
      return new Promise((resolve) => {
        const { isShowLogo, logoObj, siteObj } = this.params
        if (!isShowLogo || !logoObj.src) return resolve()

        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
          ctx.drawImage(img, logoObj.x, logoObj.y, logoObj.width, logoObj.height)
          ctx.fillText(siteObj.url, siteObj.x, siteObj.y)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = logoObj.src
      })
    }

    /** 把 canvas 导出为 Image 对象 */
    toImage(canvas) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = canvas.toDataURL('image/png')
      })
    }

    /** 拼接某张小人图的完整 URL */
    imgUrl(index) {
      const path = (this.params.imagesPath || './images/').trim()
      const base = path.endsWith('/') ? path : path + '/'
      return `${base}QP4a5rvW_${index}.png`
    }

    /** 简单节流 */
    throttle(fn, delay = THROTTLE_MS) {
      if (this._timer) return
      this._timer = setTimeout(() => {
        this._timer = null
        fn()
      }, delay)
    }
  }

  window.Upup = Upup
})(window)
