# 香瓜音乐播放器 - Next.js 版本

这是香瓜音乐播放器的 Next.js 版本，适合部署到 Vercel。

## 功能特点

- 🎵 随机播放音乐
- 🌊 动态波形可视化
- 📟 复古 LED 显示屏
- 🎚️ 可拖拽音量旋钮
- 🎨 渐变动画背景

## 本地开发

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

## 部署到 Vercel

### 方式一：通过 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI（如果还没安装）
npm i -g vercel

# 部署
vercel
```

### 方式二：通过 Vercel 网站

1. 将项目推送到 GitHub
2. 访问 [vercel.com](https://vercel.com) 并登录
3. 点击 "Add New Project"
4. 导入你的 GitHub 仓库
5. Vercel 会自动检测 Next.js 项目
6. 点击 "Deploy" 开始部署

## 项目结构

```
xianggua/
├── public/
│   ├── mp3/           # 音频文件
│   └── data/
│       └── songs.json # 歌曲配置
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/
│       ├── MusicPlayer.tsx
│       ├── WaveformVisualizer.tsx
│       ├── LEDDisplay.tsx
│       └── ControlPanel.tsx
├── backup/            # 原版 HTML 文件备份
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── mp3/
└── package.json
```

## 技术栈

- Next.js 14+
- React 18+
- TypeScript
- CSS Modules
- Web Audio API

## 原版备份

原始的 HTML/CSS/JS 文件已备份在 `backup/` 目录中。
