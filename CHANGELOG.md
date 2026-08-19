# Changelog

## 0.3.0 - 2026-08-19

### 简体中文

- 根据明确的 HTTP 状态、错误代码和错误文本分类常见失败，不进行猜测式自动修复。
- 在失败结果中显示本地化的下一步排查建议。
- 在脱敏诊断报告中加入失败类别和同一条建议，便于提交 Issue 或 Discussion。
- 为分类规则、Host/Client 契约和报告内容补充单元测试。

### English

- Classify common failures from explicit HTTP statuses, error codes, and recognizable messages without speculative automatic fixes.
- Show a localized next-step suggestion in failed probe results.
- Include the failure category and the same guidance in copied redacted diagnostics.
- Add unit coverage for classification, Host/Client contracts, and reports.

## 0.2.0 - 2026-08-19

- Show the active model route's declared text and image input capabilities.
- Keep manually entered or undisclosed model capabilities explicitly unknown.
- Add one-click, paste-ready diagnostics using already-redacted probe results.
- Keep capability display passive: no image request, attachment, background check, or added charge.

## 0.1.0 - 2026-08-19

- Add manual provider/model connectivity probes.
- Report first-token and total latency, finish reason, and token usage.
- Add cancellation, a hard timeout, and a one-probe concurrency guard.
- Redact common secrets and home paths from provider errors.
- Add localized Chinese and English settings UI.
