# 量子視野日報 Quantum Horizon Daily

每日自動生成的深度科技分析，聚焦量子運算、人工智慧、金融趨勢與未來預測。

## 架構

```
├── index.html          # 網站主頁
├── styles.css          # 暗色主題樣式
├── script.js           # 前端邏輯
├── articles/
│   ├── index.json      # 日期索引
│   └── YYYY-MM-DD.json # 每日文章
├── scripts/
│   └── generate_news.py # Claude API 生成腳本
└── .github/workflows/
    └── daily-news.yml  # 每日自動化
```

## 部署

1. Fork 此倉庫
2. 在 **Settings → Secrets → Actions** 新增：
   - `ANTHROPIC_API_KEY`：你的 Anthropic API 金鑰
3. 啟用 **Settings → Pages**，來源選 `main` branch 根目錄
4. 前往 **Actions → Daily News Generation → Run workflow** 手動觸發第一次生成

之後每天 UTC 02:00（台灣時間 10:00）自動更新。
