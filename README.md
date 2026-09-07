# 知途 · AI 留学初筛

- DeepSeek 根据选择动态提问，最多10轮后生成初步规划报告；3轮后可主动提前生成。
- 报告后可继续生成30天计划、方向比较或顾问咨询清单，并下载 Markdown 报告。
- 问答仅保留在当前页面；没有顾问接单、预约、付款或持久化存储。

本地运行：将 `DEEPSEEK_API_KEY` 与 `DEEPSEEK_MODEL=deepseek-v4-flash` 配置在被 Git 忽略的 `.dev.vars`，然后运行 `npm run dev`。
线上密钥由 Sites 运行时秘密配置管理，不能写入页面、代码或 hosting.json。

验证：`node check.mjs http://localhost:3000/` 检查结构与输入边界。
`node check.mjs http://localhost:3000/ --live` 使用虚构学生资料测试真实 AI 提问、报告及咨询清单，会产生少量 API 用量。
`npx tsc --noEmit` 检查类型，`npm run build` 构建部署文件。

此版本使用共享访问口令和每日额度供朋友体验。真实顾问核验、接单和购买流程尚未接通。

## 分享与 GitHub Pages

分享链接：https://study-compass-amadeus.xiaoxuesheng729.chatgpt.site/
GitHub Pages 地址（启用部署后）：https://hainahuang729.github.io/zhitu/

访问需要单独分享的口令。口令和 DeepSeek 密钥只放在 Sites 秘密配置中，不要写入仓库、前端环境变量、网页源码或 URL。
后端通过 D1 原子计数限制全站每天最多200次模型请求（北京时间每日重置，格式重试也计入）。可通过服务端 DAILY_AI_LIMIT 调整。
.dev.vars 本地增加 SITE_ACCESS_CODE 和 DAILY_AI_LIMIT；本地数据库先执行 drizzle/ 中的迁移。

GitHub Pages 首次发布：仓库 Settings → Pages → Source 选择 GitHub Actions。
推送 main 后，工作流只构建和发布 dist-pages 静态文件，不接收任何 API 密钥。
npm run build:pages 构建 Pages 前端；AI 请求发往独立的 Sites 后端，只有正确口令可调用。
node scripts/check-secrets.mjs 扫描全部 Git 提交记录，仅报告可疑路径，不打印密钥。

