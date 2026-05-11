# 量子視野日報 Quantum Horizon Daily

每日自動生成的深度科技分析，聚焦量子運算、人工智慧、金融趨勢與未來預測。由 Groq API（LLaMA 3.3 70B）驅動，透過 GitHub Actions 每日自動更新，部署於 GitHub Pages。

## 架構

```
├── index.html              # 網站主頁（暗色主題閱讀介面）
├── styles.css              # 暗色主題樣式
├── script.js               # 前端邏輯（文章載入、分類篩選、詞彙展開）
├── articles/
│   ├── index.json          # 日期索引（最近 90 天）
│   └── YYYY-MM-DD.json     # 每日文章（4 篇，對應 4 個分類）
├── scripts/
│   └── generate_news.py    # Groq API 文章生成腳本
└── .github/workflows/
    └── daily-news.yml      # 每日自動化 CI/CD
```

## 文章分類

每日生成 4 篇深度分析，分類輪替：

| 分類 | 聚焦領域 |
|------|----------|
| `quantum` | 量子運算、後量子密碼學、量子感測、糾錯碼進展 |
| `ai` | LLM 架構創新、推論效率、AI Agent、多模態系統 |
| `finance` | 另類資產、衍生品結構、量化策略、加密金融基礎設施 |
| `future` | 科技融合趨勢、產業顛覆路徑、地緣科技競爭 |

## 部署

### 前置需求

- GitHub 帳號
- [Groq API 金鑰](https://console.groq.com/)（免費方案即可）

### 步驟

1. Fork 此倉庫
2. 在 **Settings → Secrets and variables → Actions** 新增 Secret：
   - `GROQ_API_KEY`：你的 Groq API 金鑰
3. 啟用 **Settings → Pages**，來源選 `main` branch 根目錄
4. 前往 **Actions → Daily News Generation → Run workflow** 手動觸發第一次生成

之後每天 UTC 02:00（台灣時間 10:00）自動更新。

## 本地開發

```bash
# 需求：Python 3.12+
pip install groq

export GROQ_API_KEY=your_key_here
python scripts/generate_news.py
```

前端為純靜態頁面，直接用瀏覽器開啟 `index.html` 即可預覽（需先有 `articles/` 資料）。

## 文章 JSON 格式

每日檔案為陣列，每筆文章包含：

```json
{
  "id": "YYYYMMDD-category-slug",
  "category": "quantum | ai | finance | future",
  "title": "文章標題",
  "summary": "摘要（80-120 字）",
  "overview": "概述（150-200 字）",
  "technical_core": "技術核心（200-300 字）",
  "analysis": ["分析段落 1", "分析段落 2"],
  "implications": ["影響 1", "影響 2", "影響 3"],
  "outlook": "前瞻展望（100-150 字）",
  "keywords": ["關鍵詞 1", "關鍵詞 2"],
  "glossary": [{ "term": "術語", "def": "定義" }],
  "depth": 5,
  "read_time": 8,
  "date": "YYYY-MM-DD"
}
```
