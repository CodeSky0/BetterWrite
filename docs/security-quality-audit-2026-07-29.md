# BetterWrite 安全与质量审查报告

> 审查日期：2026-07-29
> 审查范围：apps/web, apps/mobile, apps/worker, packages/db, packages/ai, packages/shared

---

## 一、安全漏洞

### 1.1 [P0/Critical] XSS — 作文原文未转义

- **位置**: `apps/web/src/components/essay/interactive-feedback.tsx` L102-L131
- **描述**: `_renderHighlightedText` 中 `highlight.sentence` 和 `highlight.comment` 做了 HTML 转义，但原始作文文本 `text` 本身未转义就传入 `dangerouslySetInnerHTML`。学生提交含 `<img src=x onerror=alert(1)>` 的作文，查看批改结果时执行任意 JS。
- **修复**: 在循环处理 highlights 之前先对 `text` 做完整 HTML 实体转义。

### 1.2 [P0/High] API Token 明文存储

- **位置**: `apps/web/src/lib/api/routes.ts` L701-L712, `middleware.ts` L44
- **描述**: 移动端 Bearer Token 用 `randomUUID()` 生成后明文存入 `api_tokens.token` 列，认证时直接 `eq(apiTokens.token, token)` 比对。DB 泄露即暴露所有活跃 token。
- **修复**: 存储 token 的 SHA-256 哈希，认证时比对哈希值。

### 1.3 [P1/High] IP 欺骗绕过限流

- **位置**: `apps/web/src/lib/api/rate-limiter.ts` L26-L38, `routes.ts` L278-L287
- **描述**: `resolveClientIp` 直接信任 `X-Forwarded-For` / `X-Real-IP`。未部署在严格覆写这些头的反代后时，攻击者可伪造 IP 绕过所有限流和登录锁定。
- **修复**: 配置可信代理列表，仅从可信代理提取客户端 IP。

### 1.4 [P2/Medium] 内存限流/锁定存储不支持多实例

- **位置**: `rate-limiter.ts` L13, `routes.ts` L227
- **描述**: `loginFailStore`、`memoryStore` 为进程内 Map。多实例部署时限流阈值被实例数倍增，登录锁定不跨实例同步。
- **修复**: 将 `loginFailStore` 迁移到 Redis。

### 1.5 [P2/Medium] 部分 Admin 读端点缺少限流

- **位置**: `routes.ts` L4591 (`/admin/api-configs`), L4796 (`/admin/model-routes`), L5009 (`/admin/announcements`)
- **描述**: 三个 GET 端点无 `rateLimit` 中间件。
- **修复**: 统一加 `rateLimit(20, 60_000)` + `rateLimit(500, 86400000)`。

### 1.6 [Low] Next.js Middleware 仅检查 Cookie 存在性

- **位置**: `apps/web/middleware.ts` L17-L23
- **描述**: Edge middleware 只判断 cookie 是否存在，不验证有效性。API 层有二次校验，风险低。

---

## 二、性能问题

### 2.1 [P1/High] /teacher/students 全量加载所有学生作文

- **位置**: `routes.ts` L2067-L2086
- **描述**: 为计算 `essayCount` 和 `averageScore`，加载所有学生全部作文到内存聚合。
- **修复**: 改用 SQL `GROUP BY` + `AVG()` 聚合。

### 2.2 [P1/High] /student/progress 排名计算 N+1

- **位置**: `routes.ts` L3654-L3684
- **描述**: 查所有同学的全部 completed 作文到内存做平均。
- **修复**: 用 SQL `GROUP BY studentId` + `AVG(totalScore)` 替代。

### 2.3 [P2/Medium] /teacher/analytics/class/:classId 无缓存

- **位置**: `routes.ts` L1703-L1710
- **描述**: 每次加载班级所有作文（含 correction + task JOIN），无 memoize 缓存。
- **修复**: 加 60s `memoizeAsync` 缓存。

### 2.4 [P2/Medium] /essays 教师列表 IN 子句膨胀

- **位置**: `routes.ts` L1247-L1255
- **描述**: N 个学生生成 N 个变量的 IN 子句，可能触及 SQLite 变量上限。
- **修复**: 改用子查询。

### 2.5 [P2/Medium] syncStudentErrorBook 全量扫描

- **位置**: `routes.ts` L2756-L2822
- **描述**: 每次同步加载学生所有 completed 作文 + correction。
- **修复**: 改为增量同步。

### 2.6 [Low] /admin/schools 五路并行 JOIN 无缓存

- **位置**: `routes.ts` L4210-L4239
- **修复**: 加 `memoizeAsync` 60s 缓存。

---

## 三、数据一致性问题

### 3.1 [P1/High] 作文提交与入队非原子

- **位置**: `routes.ts` L969-L987
- **描述**: 先 INSERT essay 再 addCorrectionJob。入队失败时 essay 成为永远 pending 的孤儿。
- **修复**: 先入队再 INSERT；或加定时任务扫描超时 pending。

### 3.2 [P2/Medium] CSV 导入无事务包裹

- **位置**: `routes.ts` L2298-L2372
- **描述**: 逐行 INSERT，中途崩溃导致部分导入。
- **修复**: 包裹事务或改为两阶段。

### 3.3 [P2/Medium] 学校删除级联 Session 逐条循环

- **位置**: `routes.ts` L4446-L4450
- **描述**: 500 用户 = 500 次 DB 写。
- **修复**: 批量 `DELETE FROM sessions WHERE user_id IN (...)`。

### 3.4 [P2/Medium] model-routes PUT 非原子

- **位置**: `routes.ts` L4873-L4896
- **描述**: 循环中多步 DELETE/UPDATE/INSERT 无事务。
- **修复**: 包裹 `db.transaction`。

---

## 四、用户体验缺陷

### 4.1 [P2/Medium] Web fetcher 无请求超时

- **位置**: `apps/web/src/lib/api/fetcher.ts` L52-L76
- **描述**: 无 AbortController 超时，慢网络用户无限等待。
- **修复**: 加 30s 超时。

### 4.2 [P2/Medium] 移动端登出未撤销服务端 Token

- **位置**: `apps/mobile/src/lib/auth/store.ts` L124-L128
- **描述**: 仅清本地 SecureStore，token 服务端仍有效 90 天。
- **修复**: logout 时先调 DELETE /auth/tokens/:id。

### 4.3 [P3/Low] classCode 无效时静默忽略

- **位置**: `routes.ts` L491-L505
- **描述**: 注册时 classCode 不存在不报错，用户未加入班级。
- **修复**: 返回 400 提示。

---

## 五、代码质量问题

### 5.1 [P3/Medium] 5443 行单文件路由

- **位置**: `apps/web/src/lib/api/routes.ts`
- **描述**: ~60 个端点集中一个文件。
- **修复**: 按模块拆分。

### 5.2 [P3/Low] 死代码 requireActiveUser

- **位置**: `apps/web/src/lib/api/middleware.ts` L130-L136
- **描述**: 已定义但从未使用。
- **修复**: 删除。

### 5.3 [P3/Low] 误导性注释 "后续会再过一道 DOMPurify"

- **位置**: `routes.ts` L413
- **描述**: 项目未安装 DOMPurify。
- **修复**: 删除误导注释。

---

## 六、架构问题

### 6.1 [P1/High] SQLite 不支持并发写

- **描述**: 生产环境 SQLite 写操作全局互斥锁，高频场景出现 SQLITE_BUSY。
- **修复**: 中期迁移 PostgreSQL；短期启用 WAL + busy_timeout。

### 6.2 [P2/Medium] Web 直接导入 Worker 包

- **位置**: `routes.ts` L73
- **描述**: `import { performOcr } from '@betterwrite/worker'` 导致 worker 依赖被打包进 Web。
- **修复**: 抽取 OCR 到独立包。

### 6.3 [Medium] 无 API 版本控制

- **描述**: 所有路由挂 `/api` 无版本前缀。
- **修复**: 引入 `/api/v1`。
