# Codeforces Helper Desktop Client

<p align="left">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows" alt="Platform" />
  <img src="https://img.shields.io/badge/Framework-Electron%2033-47848F?style=flat-square&logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/Charts-Apache%20ECharts%205-AA344D?style=flat-square&logo=apacheecharts" alt="ECharts" />
  <img src="https://img.shields.io/badge/License-MIT-10b981?style=flat-square" alt="License" />
</p>

**Codeforces Helper** 是一款专为算法竞赛选手打造的 **Windows 桌面软件客户端**。它基于 Codeforces 官方 API，提供刷题数据全维统计、**Tag 强弱项四象限智能诊断**、针对性薄弱项推题、比赛历史复盘以及 **Rating 实力拟合与涨跌分模拟器**。

---

## 核心功能亮点

### 1. 选手训练总览看板 (Overview Dashboard)
- 实时聚合展示当前/最高 Rating、累计独立 AC 题数、一发入魂率（1A Rate）、近期刷题实力拟合分与待补题数量。
- **八维核心算法能力雷达图**：直观评估 `动态规划 (DP)`、`图论与树论`、`数学与数论`、`贪心与构造`、`数据结构`、`二分与双指针`、`字符串`、`位运算/博弈/几何` 的综合均衡度。

### 2. 做题数量与多维统计 (Problem Statistics)
- 自动对全部 `user.status` 提交记录进行去重与清洗（区分 `1A 通过`、`多次提交通过` 与 `尝试未过待补`）。
- **Rating 800 ~ 2600+ 难度分布直方图**（采用 Codeforces 官方段位配色）。
- **提交判题状态（Verdict）饼图**：统计 `AC` / `WA` / `TLE` / `RE` / `MLE` / `CE` 占比。
- **365 天年度刷题热力图**与多条件题目检索表（支持一键跳转 Codeforces 原题）。

### 3. Tag 强弱项智能诊断中心 (Tag Mastery & Diagnostics)
拒绝“只看做题数量”的粗放统计，内置 **四维掌握度评分模型 (0~100)**（综合考量：**AC 题量 + Top-5 攻克难度上限与当前 Rating 比值 + 一次通过率 + 卡题未补比例**），自动将所有算法标签划分为四个象限：
- **优势擅长区 (Strengths)**：题量充足、攻克难度匹配或超越当前段位、通过率高；
- **薄弱待改进区 (Weaknesses)**：尝试多次但频繁 WA/TLE、积压未补题较多、或攻克难度明显滞后；
- **常规巩固区 (Comfort Zone)**：刷题数量多但集中在低分水题，提醒拔高训练难度上限；
- **高频考察盲区 (Blind Spots)**：Codeforces 比赛核心高频标签但目前涉猎极少（$<8$ 题）。
- **行动闭环**：内置 **「针对薄弱 Tag 的智能推荐题单」** 与 **「个人待补题清单 (Upsolving Queue)」**。

### 4. 比赛情况复盘 (Contest Tracker)
- 完整复刻并增强 Codeforces 生涯 Rating 折线图（含官方灰、绿、青、蓝、紫、橙、红段位色带与缩放滑块）。
- 自动估算每场比赛的 **当场表现分 (Performance Rating)**，并展示近期即将开始的比赛倒计时。

### 5. 分数预测与目标模拟器 (Rating Predictor & Elo Simulator)
- **真实刷题实力 Rating 拟合**：基于近 30 道已通过题目的指数衰减加权难度、Top 28% 能力上限与一发通过率，测算您当前的真实训练水平与上分潜力。
- **下场比赛名次 & Rating 涨跌模拟器**：支持滑动调整参赛规模（Div.1 / Div.2 / Div.3 / Educational / Global Round）和预期取得名次，实时计算预计涨跌分（$\Delta$）、保分名次（$\Delta=0$）及下一段位冲刺规划。

### 6. 多账号切换与官方 API Key 签名支持
- 支持直接输入任意 Codeforces Handle 快速同步，内置多账号切换器与离线完整演示模式（`Demo_Coder`）。
- 支持选填官方 `API Key` 与 `API Secret`（客户端内置官方 `SHA-512` 签名算法）。
- **隐私安全**：所有个人账号配置与本地缓存均存储在用户本机 `AppData` 目录中，打包分享程序不会泄露私人信息。

---

## 快速开始

### 方式一：普通用户（免安装绿色版）
如果您下载的是打包好的 Release 压缩包：
1. 解压压缩包到任意目录；
2. 直接双击运行 `CodeforcesHelper.exe` 即可打开客户端（无需安装 Node.js 或任何运行环境）。

### 方式二：开发者从源码运行
确保电脑已安装 [Node.js](https://nodejs.org/)（推荐 v18+）：

```bash
# 1. 克隆仓库
git clone https://github.com/<你的用户名>/<仓库名>.git
cd codeforces-helper-client

# 2. 安装依赖（国内网络可附带 Electron 镜像加速）
npm install

# 3. 启动桌面客户端
npm start
```
> 在 Windows 下也可以直接双击项目根目录的 `启动客户端.bat` 一键运行。

---

## 打包为独立可分发 `.exe`

想要打包成免安装绿色文件夹分享给朋友或上传到 GitHub Releases：

```bash
npm run pack
```
或者直接双击根目录的 `打包免安装版.bat`。打包完成后会在 `release/CodeforcesHelper-win32-x64/` 目录下生成完整的绿色版程序。

---

## 项目目录结构

```text
├── main.js               # Electron 主进程（无边框窗口管理、CF API 请求、SHA-512 签名、本地文件缓存）
├── preload.js            # 安全上下文桥接层 (ContextBridge IPC)
├── src/
│   ├── index.html        # 客户端六大功能模块界面布局
│   ├── styles.css        # 现代深色主题样式与段位配色系统
│   └── app.js            # 核心数据分析引擎、Tag 四象限诊断算法、Elo 模拟器与 ECharts 图表渲染
├── 启动客户端.bat         # Windows 一键启动脚本
├── 打包免安装版.bat       # Windows 一键打包绿色版 .exe 脚本
├── package.json          # 项目依赖与脚本配置
└── LICENSE               # MIT 开源许可证
```

---

## 开源协议

本项目基于 [MIT License](./LICENSE) 开源，欢迎自由使用、修改、提交 Issue 或 Pull Request！
