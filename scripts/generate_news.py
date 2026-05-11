#!/usr/bin/env python3
import json
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from groq import Groq

TODAY = date.today().isoformat()
ARTICLES_DIR = Path(__file__).parent.parent / "articles"
ARTICLES_DIR.mkdir(exist_ok=True)

TOPIC_ROTATION = [
    {
        "category": "quantum",
        "focus": "量子運算、後量子密碼學、量子感測、量子通訊、糾錯碼進展",
        "avoid": "過於基礎的量子力學科普，聚焦工程實作與產業影響"
    },
    {
        "category": "ai",
        "focus": "大型語言模型架構創新、推論效率、AI Agent、多模態系統、對齊研究",
        "avoid": "聚焦技術機制與架構設計，避免泛泛的 AI 應用描述"
    },
    {
        "category": "finance",
        "focus": "另類資產、衍生品結構、量化策略、央行政策傳導、加密金融基礎設施",
        "avoid": "避免基礎投資教學，聚焦機構級別的結構性分析"
    },
    {
        "category": "future",
        "focus": "科技融合趨勢、產業顛覆路徑、地緣科技競爭、新興技術商業化瓶頸",
        "avoid": "避免烏托邦式預測，聚焦具體技術里程碑與商業邏輯"
    },
]

SYSTEM_PROMPT = """你是一位橫跨量子物理、電腦科學、金融工程與科技政策的深度分析師。
你的讀者是工程師、研究員、機構投資人和科技創業者——他們已具備領域基礎知識。

寫作原則：
1. 直接進入技術核心，不做基礎科普
2. 用具體數字、協議細節、架構設計支撐論點
3. 識別主流媒體忽略的結構性矛盾與反直覺發現
4. 分析二階、三階影響，而非一階明顯結論
5. 技術術語保留英文縮寫（在中文句子中更清晰）
6. 文風：精準、克制、有洞察，不煽情
7. 只輸出純 JSON，不加任何 markdown 包裹或說明文字"""


def generate_article(client: Groq, topic: dict) -> dict:
    today_str = datetime.now(timezone.utc).strftime("%Y年%m月%d日")

    prompt = f"""今天是 {today_str}。請為「量子視野日報」撰寫一篇深度技術分析文章。

分類：{topic['category']}
聚焦領域：{topic['focus']}
注意事項：{topic['avoid']}

請選擇一個在過去 2-4 週內有實質進展、或有長期結構性重要性但被低估的具體議題。

只輸出純 JSON，格式如下：
{{
  "id": "唯一ID含日期",
  "category": "{topic['category']}",
  "title": "標題（20-35字）",
  "summary": "摘要（80-120字）",
  "overview": "概述（150-200字）",
  "technical_core": "技術核心（200-300字）",
  "analysis": ["分析段落1", "分析段落2"],
  "implications": ["影響1", "影響2", "影響3"],
  "outlook": "前瞻展望（100-150字）",
  "keywords": ["關鍵詞1", "關鍵詞2", "關鍵詞3", "關鍵詞4", "關鍵詞5"],
  "glossary": [
    {{"term": "術語", "def": "定義（40字以內）"}},
    {{"term": "術語2", "def": "定義"}}
  ],
  "depth": 5,
  "read_time": 8,
  "date": "{TODAY}"
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=2048,
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


def update_index(new_date: str):
    index_path = ARTICLES_DIR / "index.json"
    if index_path.exists():
        with open(index_path) as f:
            index = json.load(f)
    else:
        index = {"dates": [], "updated_at": ""}

    if new_date not in index["dates"]:
        index["dates"].insert(0, new_date)
        index["dates"] = index["dates"][:90]

    index["updated_at"] = datetime.now(timezone.utc).isoformat()
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def main():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("ERROR: GROQ_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    client = Groq(api_key=api_key)

    output_path = ARTICLES_DIR / f"{TODAY}.json"
    if output_path.exists():
        print(f"Articles for {TODAY} already exist, skipping.")
        return

    articles = []
    for i, topic in enumerate(TOPIC_ROTATION):
        print(f"Generating article {i+1}/{len(TOPIC_ROTATION)}: {topic['category']}")
        try:
            article = generate_article(client, topic)
            articles.append(article)
            print(f"  ✓ {article['title'][:40]}...")
        except Exception as e:
            print(f"  ✗ Failed: {e}", file=sys.stderr)

    if not articles:
        print("No articles generated, aborting.", file=sys.stderr)
        sys.exit(1)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    update_index(TODAY)
    print(f"Done. {len(articles)} articles saved to {output_path}")


if __name__ == "__main__":
    main()
