# UPUP
举牌小人生成器

<img width="80%" src="https://github.com/ZHOUYUANN/UPUP/blob/main/upup.gif" />

## UPUP 特色

1. 本插件拿来即用，无需学习配置，当然你也可以自己配置喜欢的参数
2. 图片的大小会根据里面文字去做适应
3. 可以设置背景的透明或者其他花里胡哨的颜色
4. 可以设置字体的颜色

## UPUP 使用

首先引入游戏框架 `upup.js`

```javascript
<script src="upup.js"></script>
<script>
  var upup = new Upup({
    text: document.getElementById('texta'),
    content: document.getElementById('content'),
  })
</script>
```

参数列表：

| 参数  | 值    | 说明       |
| :---: | :---: | :--------- |
| content     | `dom 对象`  | 渲染最终图片的区块 |
| text     | `dom 对象`  | 输入文本的 `textarea` |

非必选参数：

| 参数            | 默认值                     | 说明                                |
| :-------------: | :--------------------- | :---------------------------------- |
| color | #42240f             | 字体的颜色                            |
| left          | 200        | 第一行图片的整体向右的偏移量，如果设置此参数则图片排列的位置是居左200开始，否则是从0开始             |
| isTranspant          | true | 是否透明背景               |
| isShowLogo          | false | 是否显示`logo`标志         |
| bgColor  | rgba(219, 114, 40, 1)               | 背景的颜色 |
| imgObj          | Object | 单张图片的配置项                    |
| imgObj.imgLD          | 35 | 小人图向左的偏移量                    |
| imgObj.imgBD          | 20 | 小人图向下的偏移量                    |
| imgObj.left          | 45 | 小人图整体阶级向左的偏移量               |
| textObj          | Object | 输入文字的配置项               |
| textObj.width          | 40 | 文字画布的宽度               |
| textObj.height          | 40 | 文字画布的高度               |
| textObj.textRD          | 20 | 文字向右的偏移量               |
| textObj.textBD          | 10 | 文字向下的偏移量               |
| logoObj          | Object |  `logo` 的配置项               |
| logoObj.src          |  |  `logo` 图标链接               |
| logoObj.width          | 40 |  `logo` 图标宽度             |
| logoObj.height          | 40 |  `logo` 图标高度             |
| logoObj.x          | 0 |  `logo` 图标 x 坐标             |
| logoObj.y          | 0 |  `logo` 图标 y 坐标             |
| siteObj          | Object |  `logo` 图标站点             |
| siteObj.url          | luszy.com |  `logo` 图标站点 url             |
| siteObj.x          | 0 |  `logo` 图标站点 x 坐标             |
| siteObj.y          | 50 |  `logo` 图标站点 y 坐标               |


内置一个更新函数 `refresh()` 可以传入参数合并之前的参数更新画布内容。

例如

```js
upup.refresh({
  isShowLogo: false
})
```
