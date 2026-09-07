# 知途 · AI 留学初筛

- DeepSeek 根据选择动态提问，最多10轮后生成初步规划报告；3轮后可主动提前生成。
- 报告后可继续生成30天计划、方向比较或顾问咨询清单，并下载 Markdown 报告。
- 问答仅保留在当前页面；没有顾问接单、预约、付款或持久化存储。

本地运行：将 `DEEPSEEK_API_KEY` 与 `DEEPSEEK_MODEL=deepseek-v4-flash` 配置在被 Git 忽略的 `.dev.vars`，然后运行 `npm run dev`。
线上密钥由 Sites 运行时秘密配置管理，不能写入页面、代码或 hosting.json。

验证：`node check.mjs http://localhost:3000/` 检查结构与输入边界。
`node check.mjs http://localhost:3000/ --live` 使用虚构学生资料测试真实 AI 提问、报告及咨询清单，会产生少量 API 用量。
`npx tsc --noEmit` 检查类型，`npm run build` 构建部署文件。

当前站点仅所有者可访问。扩大开放范围前需要增加用户身份绑定、用量限制，以及真实顾问核验与接单流程。
