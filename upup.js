/**
 * by: luszy.com 
 * 举牌小人生成器
 * 使用方法 new Upup(param) 即可，支持可输入自动转换 
 */
(function (window) {
  function Upup(params) {
    var self = this
    self.extend(self.params, params)
    self.draw()
    self.init()
  }
  Upup.prototype = {
    params: {
      content: null,  // 渲染最终图片的区块
      text: null,   // 必传的文字 dom 
      color: '#42240f',  // 字体的颜色
      left: 200,  // 第一行图片的整体向右的偏移量，如果设置此参数则图片排列的位置是居左200开始，否则是从0开始
      bgColor: 'rgba(219, 114, 40, 1)',  // 背景的颜色
      imgObj: {
        imgLD: 35,  // 小人图向左的偏移量
        imgBD: 20,  // 小人图向下的偏移量
        left: 45, // 小人图整体阶级向左的偏移量
      },
      textObj: {
        width: 40,  // 文字画布的宽度
        height: 40, // 文字画布的高度
        textRD: 20, // 文字向右的偏移量
        textBD: 10 // 文字向下的偏移量
      },
      isTranspant: false,   // 是否透明背景
      isShowLogo: true,
      logoObj: {
        src: 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3835858067,383604916&fm=26&gp=0.jpg',
        width: 40,
        height: 40,
        x: 0,
        y: 0
      },
      siteObj: {
        url: 'luszy.com',
        x: 0,
        y: 50
      }
    },
    init: function (callback) {
      var self = this
      var text = self.params.text.value.split('\n')
      var canvas = document.createElement('canvas')
      var ctx = canvas.getContext('2d');
      canvas.width = 1920;
      canvas.height = 980;

      // 给画布填充颜色
      if (!self.params.isTranspant) {
        ctx.fillStyle = self.params.bgColor;
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var arr = []
      var len = 0
      var imgWidthAndHeight = []
      text.forEach(function (item, i) {
        // 1. 加载图片资源
        self.loadImg(item.split(''), function (res) {
          // 关键代码：如果使用了 arr.push(res) 回导致输出的索引跟填写的文字顺序不一致的情况
          // 所以直接使用赋值的方式，固定图片数组输出的位置，这里要保证输出的顺序，
          // 其他情况不需要就可以使用push， 下面的获取图片同理
          arr[i] = res;
          // 保证所有的图片都已加载完成，并且数据都有
          if (++len == text.length) {
            len = 0
            arr.forEach(function (item, index) {
              var distance = arr.length - index - 1
              item.forEach(function (its, idx) {
                var it = its.image
                var tx = its.text
                if (tx === ' ' && ++len) return
                if (self.params.left) {
                  var x = self.params.left + ((idx * it.naturalWidth) - (idx * self.params.imgObj.imgLD)) - (index * self.params.imgObj.left)
                } else {
                  var x = ((idx * it.naturalWidth) - (idx * self.params.imgObj.imgLD)) + (distance * 45)
                }
                var y = (index * (it.naturalHeight * .3)) + (idx * self.params.imgObj.imgBD)
                // 把图片的宽高保存
                imgWidthAndHeight.push({
                  x: x + it.naturalWidth,
                  y: y + it.naturalHeight
                })
                // 2. 在canvas 上画出所有的图片
                ctx.drawImage(it, x, y, it.naturalWidth, it.naturalHeight)
                // 3. 在canvas 上画出所有的文字
                self.drawText(
                  tx,
                  self.params.textObj.width,
                  self.params.textObj.height,
                  function (img) {
                    ctx.drawImage(
                      img,
                      x + self.params.textObj.textRD,
                      y + self.params.textObj.textBD
                    );
                    // 4. 等所有的文字画完之后再输出图片
                    if (++len === text.join('').length) {
                      var width = Math.max.apply(null, imgWidthAndHeight.map(function(item) {
                        return item.x
                      }))
                      var height = Math.max.apply(null, imgWidthAndHeight.map(function(item) {
                        return item.y
                      }))
                      // 改变大小前用getImageData保存图像
                      var copyCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height)
                      canvas.width = width;
                      canvas.height = height;
                      // 改变了宽高之后再重新设置之前的图像
                      ctx.putImageData(copyCanvas, 0, 0);
                      // 设置头像之后再输出图片
                      self.loadLogo(ctx, function() {
                        var dataImg = new Image();
                        dataImg.src = canvas.toDataURL('image/png');
                        callback(dataImg);
                      })
                    }
                  }
                )
              })
            })
          }
        })
      })
    },
    draw: function () {
      var self = this
      this.addEvent(this.params.text, 'input', function (e) {
        self.params.text.innerHTML = e.target.value
        self.refresh()
        // self.throttleDelay(self.refresh.bind(self), 500)
      })
    },
    refresh: function(params) {
      var self = this
      this.extend(this.params, params)
      this.init(function (img) {
        self.params.content.innerHTML = ''
        self.params.content.appendChild(img)
      })
    },
    loadLogo: function(ctx, callback) {
      // 设置默认logo标志
      var self = this
      if (!self.params.isShowLogo) {
        callback()
        return
      }
      var logoImg = new Image()
      logoImg.setAttribute('crossOrigin', 'Anonymous')
      logoImg.onload = function () {
        ctx.drawImage(
          logoImg,
          self.params.logoObj.x,
          self.params.logoObj.y,
          self.params.logoObj.width,
          self.params.logoObj.height
        )
        // 添加默认的站点
        ctx.fillText(self.params.siteObj.url, self.params.siteObj.x, self.params.siteObj.y);
        callback()
      }
      if (self.params.logoObj.src) {
        logoImg.src = self.params.logoObj.src
      }
    },
    loadImg: function(urls, callback) {
      var len = 0
      var imgs = []
      urls.forEach(function (item, index) {
        var image = new Image()
        var url = `./images/QP4a5rvW_${Math.floor(Math.random() * 40)}.png`
        image.onload = function () {
          imgs[index] = {
            image: image,
            text: item
          }
          if (++len === urls.length) {
            callback(imgs)
          }
        }
        image.src = url
      })
    },
    drawText: function(word, width, height, callback) {
      var canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      var ctx = canvas.getContext('2d')

      ctx.transform(0.766044, 0.3, -0.742788, 0.766044, 20, 0)
      ctx.font = '30px SimHei'
      ctx.textAlign = 'center'
      ctx.fillStyle = this.params.color
      ctx.fillText(word, 14, 28)

      // 这里本来设置是返回的 getImageData 的，但是发现在使用canvas 
      // 堆叠到另一个canvas中背景一直设置不到的透明
      // 因为另一个的canvas中添加了一个图片，而图片是颜色的，会导致文字的canvas一直是有底色的
      // 没办法，索性使用导出图片的方式保证透明，如果是canvas就不能保证是透明
      var img = new Image();
      img.onload = function () {
        callback(img)
      }
      img.src = canvas.toDataURL('image/png');
    },
    // 简单的节流，放置输入过快渲染出错
    throttleDelay: function(func, delay) {
      var timer = null;
      if (!timer) { 
        timer = setTimeout(function() {
          func.call(func)
          timer = null;
        }, delay)
      }
    },
    addEvent: function (elm, type, fn) {
      if (window.attachEvent) {
        elm.attachEvent("on" + type, fn);
      } else if (window.addEventListener) {
        elm.addEventListener(type, fn, false);
      } else {
        elm["on" + type] = fn;
      }
    },
    extend: function (a, b) {
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key];
        }
      }
      return a;
    }
  }
  window.Upup = Upup
})(window)