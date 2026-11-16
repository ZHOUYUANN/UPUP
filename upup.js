/**
 * by: luszy.com 
 * 举牌小人生成器
 * 使用方法 new Upup(param) 即可，支持可输入自动转换 
 */
(function (global) {
  'use strict'

  const DEFAULT_CONFIG = {
    container: '#app',
    imagesPath: './images/',
    imageCount: 41,
    backgroundColor: '#ffffff',
    transparent: false,
    textColor: '#000000',
    fontSize: 36,
    padding: 20,
    gap: 10
  }

  class UPUP {
    constructor(options = {}) {
      this.config = {
        ...DEFAULT_CONFIG,
        ...options
      }

      this.container = this.resolveContainer(this.config.container)

      this.imageCache = new Map()
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')

      this.container.appendChild(this.canvas)
    }

    resolveContainer(container) {
      if (typeof container === 'string') {
        container = document.querySelector(container)
      }

      if (!container) {
        throw new Error('UPUP: 找不到渲染容器')
      }

      return container
    }

    // 加载图片，并缓存加载结果
    loadImage(src) {
      if (this.imageCache.has(src)) {
        return this.imageCache.get(src)
      }

      const promise = new Promise((resolve, reject) => {
        const image = new Image()

        image.onload = () => resolve(image)
        image.onerror = () => {
          this.imageCache.delete(src)
          reject(new Error(`图片加载失败: ${src}`))
        }

        image.src = src
      })

      this.imageCache.set(src, promise)
      return promise
    }

    // 加载全部小人素材
    async loadImages() {
      const tasks = []

      for (let i = 0; i < this.config.imageCount; i++) {
        const src = `${this.config.imagesPath}QP4a5rvW_${i}.png`
        tasks.push(this.loadImage(src))
      }

      const results = await Promise.allSettled(tasks)

      this.images = results.filter((item) => item.status === 'fulfilled').map((item) => item.value)

      if (this.images.length === 0) {
        throw new Error('UPUP: 没有成功加载任何小人素材')
      }

      return this.images
    }

    // 绘制文字
    drawText(text, x, y) {
      const { ctx, config } = this

      ctx.fillStyle = config.textColor
      ctx.font = `${config.fontSize}px sans-serif`
      ctx.textBaseline = 'middle'

      ctx.fillText(text, x, y)
    }

    // 生成图片
    async render(text) {
      if (!this.images || this.images.length === 0) {
        await this.loadImages()
      }

      const { ctx, canvas, config } = this
      const characters = Array.from(String(text))

      const selectedImages = characters.map(() => {
        const index = Math.floor(Math.random() * this.images.length)

        return this.images[index]
      })

      const maxHeight = Math.max(...selectedImages.map((image) => image.height))

      const totalWidth =
        selectedImages.reduce((sum, image) => sum + image.width, 0) +
        Math.max(0, characters.length - 1) * config.gap

      canvas.width = totalWidth + config.padding * 2
      canvas.height = maxHeight + config.padding * 2

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!config.transparent) {
        ctx.fillStyle = config.backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      let x = config.padding

      for (let i = 0; i < characters.length; i++) {
        const image = selectedImages[i]

        const y = config.padding + (maxHeight - image.height)

        ctx.drawImage(image, x, y)

        this.drawText(characters[i], x + image.width, config.padding + maxHeight / 2)

        x += image.width + config.gap
      }

      return canvas
    }

    // 下载 PNG
    download(filename = 'upup.png') {
      this.canvas.toBlob((blob) => {
        if (!blob) {
          console.error('UPUP: PNG 导出失败')
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = filename
        link.click()

        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }, 'image/png')
    }

    // 修改配置
    setConfig(options = {}) {
      Object.assign(this.config, options)
      return this
    }

    // 销毁实例
    destroy() {
      this.canvas.remove()
      this.imageCache.clear()
      this.images = null
    }
  }

  // 暴露全局构造函数
  global.UPUP = UPUP
})(window)
