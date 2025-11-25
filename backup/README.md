# 备份说明

这个目录包含原版的香瓜音乐播放器（HTML/CSS/JS 版本）。

## 文件清单

- `index.html` - 原版主页面
- `style.css` - 原版样式表
- `script.js` - 原版 JavaScript 逻辑
- `songs.json` - 歌曲配置文件
- `mp3/` - 音频文件

## 使用原版

如果你想运行原版，可以使用任何静态服务器：

```bash
# 使用 Python 简单服务器
cd backup
python3 -m http.server 8080
```

然后访问 http://localhost:8080

## Next.js 版本

新版本在父目录中，使用 `npm run dev` 运行。
