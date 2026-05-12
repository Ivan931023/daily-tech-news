// ── State ──────────────────────────────────────────────────────
let allArticles = [];
let currentCat = 'all';

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setDateDisplay();
  await loadArticles();
  setupNav();
});

function setDateDisplay() {
  const el = document.getElementById('todayDate');
  const d = new Date();
  el.textContent = d.toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });
}

// ── Load articles from generated JSON ─────────────────────────
async function loadArticles() {
  try {
    const res = await fetch('articles/index.json?' + Date.now());
    if (!res.ok) throw new Error('no index');
    const index = await res.json();

    // Load the latest day's articles
    const latest = index.dates[0];
    const r2 = await fetch(`articles/${latest}.json`);
    if (!r2.ok) throw new Error('no articles');
    allArticles = await r2.json();

    renderHero(allArticles[0]);
    renderGrid(allArticles);
    renderSidebar(allArticles, index);
  } catch {
    // fallback to sample data when no articles generated yet
    allArticles = SAMPLE_ARTICLES;
    renderHero(allArticles[0]);
    renderGrid(allArticles);
    renderSidebar(allArticles, null);
  }
}

// ── Render ─────────────────────────────────────────────────────
function renderHero(a) {
  if (!a) return;
  document.getElementById('heroTitle').textContent = a.title;
  document.getElementById('heroSummary').textContent = a.summary;
  document.getElementById('heroMeta').innerHTML = `
    <span>${catLabel(a.category)}</span>
    <span>技術深度 ${'▮'.repeat(a.depth)}${'▯'.repeat(5-a.depth)}</span>
    <span>${a.read_time} 分鐘閱讀</span>
    <span>${a.date}</span>
  `;
  document.getElementById('heroSection').addEventListener('click', () => openModal(a));
}

function renderGrid(articles) {
  const grid = document.getElementById('articlesGrid');
  const filtered = currentCat === 'all' ? articles : articles.filter(a => a.category === currentCat);
  const toRender = filtered.slice(1); // hero shows [0]

  if (toRender.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-dim);padding:2rem">此分類暫無文章</p>';
    return;
  }

  grid.innerHTML = toRender.map(a => `
    <article class="card" data-id="${a.id}">
      <span class="card-cat cat-${a.category}">${catLabel(a.category)}</span>
      <h3 class="card-title">${a.title}</h3>
      <p class="card-summary">${a.summary}</p>
      <div class="card-footer">
        <span>${a.date}</span>
        <span>${a.read_time}m</span>
        <div class="card-depth">
          ${Array.from({length:5},(_,i)=>`<div class="depth-bar${i<a.depth?' on':''}"></div>`).join('')}
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => {
      const article = allArticles.find(a => a.id === el.dataset.id);
      if (article) openModal(article);
    });
  });
}

function renderSidebar(articles, index) {
  // Hot topics
  const topicCount = {};
  articles.forEach(a => {
    (a.keywords||[]).forEach(k => { topicCount[k] = (topicCount[k]||0)+1; });
  });
  const sorted = Object.entries(topicCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
  document.getElementById('hotTopics').innerHTML = sorted.map(([k,c])=>
    `<li><span>${k}</span><span class="topic-count">${c}</span></li>`
  ).join('');

  // Glossary
  const glossary = articles.flatMap(a => a.glossary || []).slice(0,4);
  document.getElementById('glossary').innerHTML = glossary.map(g=>
    `<div class="glossary-item">
      <div class="glossary-term">${g.term}</div>
      <div class="glossary-def">${g.def}</div>
    </div>`
  ).join('');
}

// ── Modal ──────────────────────────────────────────────────────
function openModal(a) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      <div class="modal-cat"><span class="card-cat cat-${a.category}">${catLabel(a.category)}</span></div>
      <h2 class="modal-title">${a.title}</h2>
      <div class="modal-meta">
        <span>${a.date}</span>
        <span>閱讀時間 ${a.read_time} 分鐘</span>
        <span>技術深度 ${'★'.repeat(a.depth)}${'☆'.repeat(5-a.depth)}</span>
      </div>
      <div class="modal-body">${buildBody(a)}</div>
    </div>
  `;
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  document.addEventListener('keydown', function esc(e) {
    if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',esc);}
  });
  document.body.appendChild(overlay);
}

function buildBody(a) {
  let html = '';
  if (a.overview) {
    html += `<h3>概述</h3><p>${a.overview}</p>`;
  }
  if (a.technical_core) {
    html += `<h3>技術核心</h3><div class="tech-block">${a.technical_core}</div>`;
  }
  if (a.analysis) {
    html += `<h3>深度分析</h3>${a.analysis.map(p=>`<p>${p}</p>`).join('')}`;
  }
  if (a.implications && a.implications.length) {
    html += `<h3>關鍵影響</h3>${a.implications.map(i=>`<div class="implication">${i}</div>`).join('')}`;
  }
  if (a.outlook) {
    html += `<h3>前瞻展望</h3><p>${a.outlook}</p>`;
  }
  if (a.references && a.references.length) {
    html += `<h3>參考資料</h3><ul class="reference-list">`;
    html += a.references.map(r => {
      const title = escapeHtml(r.title || '');
      const source = escapeHtml(r.source || '');
      const url = r.url ? escapeHtml(r.url) : '';
      const linkOrText = url
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        : '';
      return `<li class="reference-item">
        <div class="reference-title">${title}</div>
        <div class="reference-source">${source}${linkOrText ? ' · ' + linkOrText : ''}</div>
      </li>`;
    }).join('');
    html += `</ul>`;
    html += `<p class="reference-disclaimer">※ 參考資料由 AI 生成，建議讀者自行查證連結與引用是否準確。</p>`;
  }
  return html;
}

// ── Nav filter ─────────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.tag').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tag').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      renderGrid(allArticles);
    });
  });
}

// ── Helpers ────────────────────────────────────────────────────
function catLabel(cat) {
  return {
    quantum: '量子運算',
    ai: '人工智慧',
    finance: '金融趨勢',
    future: '未來預測',
    security: '資訊安全'
  }[cat] || cat;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ── Sample articles (shown before first generation) ───────────
const SAMPLE_ARTICLES = [
  {
    id: 'sample-1',
    category: 'quantum',
    title: '後量子密碼學的臨界點：NIST 標準正式落地，企業遷移窗口只剩五年',
    summary: 'NIST 完成 ML-KEM、ML-DSA、SLH-DSA 三項後量子標準發布。傳統 RSA-2048 在擁有 4000 邏輯量子位元的機器前可在數小時內被破解，而 IBM、Google 的量子路線圖顯示這一門檻將於 2029–2031 年達到。',
    overview: 'NIST 在 2024 年正式發布三項後量子密碼（PQC）標準，標誌著全球資安基礎設施進入強制轉型倒計時。這不是理論威脅——「現在竊取，未來解密」（Harvest Now, Decrypt Later）攻擊已在進行中，國家級行為者正在囤積加密流量。',
    technical_core: 'ML-KEM（CRYSTALS-Kyber）基於模格（Module Lattice）困難問題，安全性建立在解決 MLWE（Module Learning with Errors）的計算複雜度上。與 RSA 的大數分解不同，格密碼問題目前連量子電腦也無有效演算法。ML-KEM-768 提供 AES-192 等效安全強度，公鑰尺寸 1184 bytes，顯著大於 ECDH，需要重新評估 TLS handshake 的封包最佳化策略。',
    analysis: [
      '從協議層看，TLS 1.3 已預留 post_quantum 擴充欄位，但實作複雜度在於：混合模式（Classical + PQC）期間金鑰協商封包可能超過 MTU，導致分片，影響首包延遲最多 40%。',
      '企業 PKI 遷移的最大挑戰不在演算法，而在憑證生命週期管理。若一家企業有數萬個 TLS 憑證，需要自動化輪換工具（如 cert-manager 的 PQC 插件）才能在窗口期內完成遷移。'
    ],
    implications: [
      '金融業監管機構（FSB、BIS）已發出指引，SWIFT 網路計畫 2027 年前完成 PQC 遷移，未遷移機構面臨跨境結算中斷風險。',
      '零信任架構廠商（Zscaler、Cloudflare）已率先部署混合 PQC，企業採購 SASE 方案時應將 PQC 支援列為必要條件。',
      '量子運算硬體廠商（IonQ、Quantinuum）的估值邏輯正在改變：「威脅時程」的縮短直接推高 PQC 軟體市場，預計 2030 年達 $72B。'
    ],
    outlook: '未來 18 個月的關鍵觀察指標：瀏覽器廠商是否在 TLS 棄用 RSA 的明確時程、AWS KMS 和 Azure Key Vault 的 PQC 金鑰管理 GA 時間，以及 CNSA 2.0 對美國政府承包商的強制要求落地節奏。',
    keywords: ['後量子密碼', 'NIST', 'ML-KEM', '量子威脅', 'TLS', 'PKI'],
    glossary: [
      { term: 'ML-KEM', def: '基於模格困難問題的密鑰封裝機制，NIST PQC 標準之一' },
      { term: 'MLWE', def: 'Module Learning with Errors，格密碼安全基礎，目前無已知有效量子攻擊演算法' }
    ],
    depth: 5,
    read_time: 8,
    date: '2026-05-11'
  },
  {
    id: 'sample-2',
    category: 'ai',
    title: 'Mixture-of-Experts 的規模化瓶頸：為什麼 1T 參數模型的邊際效益正在遞減',
    summary: 'MoE 架構讓大型語言模型以低計算成本擴展參數量，但新研究揭示路由崩潰（Router Collapse）現象在 >512 個 Expert 時顯著惡化，挑戰「參數越多越好」的直覺。',
    overview: 'Mixtral、DeepSeek-V3 的商業成功讓 MoE 成為 2025 年大模型首選架構。然而隨著 Expert 數量超過工程實踐上限，出現了一個反直覺現象：激活的 Expert 多樣性不升反降，模型退化為事實上的 Dense 模型。',
    technical_core: 'MoE 路由器（Router）使用 Top-K Softmax 門控，理論上每 token 只激活 K 個 Expert，計算量為 Dense 的 K/N 倍。問題在於訓練過程中梯度更新導致路由器偏向少數高頻 Expert——這是一個自我強化的正回饋迴路（Rich-get-richer）。緩解方案包括輔助損失（Auxiliary Loss）加入負載均衡項、Expert Choice（反轉路由讓 Expert 選 token）、以及 DeepSeek 的 Fine-grained Expert Segmentation。',
    analysis: [
      'Expert Choice 路由在理論上解決了負載均衡問題，但引入了跨設備通訊複雜性——每個 Expert 需要知道全局 token 分佈，在多節點訓練中造成 All-to-All 通訊瓶頸，在 1000 節點規模下通訊開銷可佔訓練時間 35%。',
      '更根本的問題是評估指標失真：現有 benchmark（MMLU、HumanEval）無法區分「1T 參數 MoE 真正激活了多少知識容量」。學界開始轉向 Expert Utilization Rate 和 Token-Expert Co-activation Entropy 等新指標。'
    ],
    implications: [
      '對推論硬體廠商：MoE 的稀疏激活特性讓 GPU 記憶體頻寬成為瓶頸而非算力，Groq LPU、Cerebras WSE 等專用架構的優勢窗口擴大。',
      '對雲端 API 定價：若 MoE 有效容量上限比宣稱低，按 token 定價的成本模型需要重新校準，可能影響 OpenAI、Anthropic 的毛利率結構。'
    ],
    outlook: 'State Space Models（Mamba 系列）和 Hybrid SSM-Attention 架構正在作為 MoE 的替代路徑受到重視，其在長序列推論的記憶體效率優勢可能在 2026 年 Q3 出現殺手級應用。',
    keywords: ['MoE', 'Mixture-of-Experts', '路由崩潰', 'LLM', 'DeepSeek', '推論效率'],
    glossary: [
      { term: 'Router Collapse', def: '路由器過度集中於少數 Expert，導致 MoE 退化為 Dense 模型的現象' },
      { term: 'Expert Choice', def: '反轉 MoE 路由邏輯，由 Expert 主動選擇 token，理論上改善負載均衡' }
    ],
    depth: 5,
    read_time: 7,
    date: '2026-05-11'
  },
  {
    id: 'sample-3',
    category: 'finance',
    title: '私人信貸（Private Credit）的流動性錯配陷阱：$2.1T 市場的系統性風險解剖',
    summary: '私人信貸規模十年成長十倍，但底層貸款的 illiquidity 與 LP 期望的季度流動性之間存在結構性矛盾。Fed 壓力測試尚未將此納入，BIS 已發出警告。',
    overview: '私人信貸（Direct Lending、Mezzanine、Distressed Debt）已從另類資產成長為主流配置，Apollo、Ares、Blackstone 的 BDC 和私人信貸基金規模合計超過 $2.1 兆。吸引力在於：浮動利率貸款在升息環境中的利差保護、低違約率的歷史記錄、以及分散銀行系統集中風險的監管套利。但這個市場的結構性弱點正在積累。',
    technical_core: '核心風險在於期限錯配（Maturity Mismatch）的兩個層次：第一層，底層貸款通常 5-7 年期，LP 承諾鎖定期僅 3-4 年；第二層，半流動性工具（如 Interval Fund）允許季度贖回最多 5%，但底層資產零流動性。當市場壓力觸發贖回潮時，基金經理唯一選項是二級市場折價出售，而私人信貸二級市場深度遠不如高收益債。',
    analysis: [
      '違約率的低估問題：私人信貸貸款不像公開市場債券有 MTM（Mark-to-Market）要求，基金可自主「平滑」估值，導致報告違約率系統性低於實際。穆迪估計實際違約率比報告值高 40-60%，但這只有在清算時才會浮現。',
      '銀行「影子化」的政策困境：Fed 限制銀行自營帳戶持有高風險貸款（Volcker Rule），導致風險轉移至非銀機構。但私人信貸基金的 LP 結構（養老金、保險公司、主權基金）意味著壓力仍會傳導至系統重要機構。'
    ],
    implications: [
      '對機構 LP：應要求基金揭露 PIK（Payment-in-Kind）貸款佔比——PIK 允許借款人以新債還舊債，是信用惡化的早期信號，目前行業平均 PIK 佔比已升至 22%，部分基金超過 35%。',
      '對利率走勢敏感性：若 Fed 2027 年前不降息至 3.5% 以下，高槓桿借款人（EBITDA Leverage >7x）的 DSCR 將跌破 1.0，違約潮可能在 2027-2028 年集中爆發。'
    ],
    outlook: '關注指標：Apollo、Ares 的季度財報中「Realized Loss」科目、SBIC 授權額度使用率、以及 SEC 對 Interval Fund 流動性規則的修訂進程。',
    keywords: ['私人信貸', '流動性風險', 'BDC', '期限錯配', 'Direct Lending', 'PIK'],
    glossary: [
      { term: 'PIK', def: 'Payment-in-Kind，借款人以新增債務代替現金還款，信用惡化的指標' },
      { term: 'DSCR', def: 'Debt Service Coverage Ratio，利息保障倍數，<1.0 表示現金流無法覆蓋利息' }
    ],
    depth: 4,
    read_time: 9,
    date: '2026-05-11'
  },
  {
    id: 'sample-4',
    category: 'future',
    title: '合成生物學與 AI 的交叉點：蛋白質設計進入工業化，誰將拿走最大利潤？',
    summary: 'AlphaFold 3 將預測範圍擴展至 DNA、RNA、小分子，Evo 模型實現從序列到功能的生成式設計。但從實驗室突破到工業規模生產，瓶頸正從算法轉移到濕實驗室驗證速度。',
    overview: '2024-2026 年是計算生物學的「ChatGPT 時刻」：蛋白質結構預測精度達到實驗級別，生成式 AI 可從頭設計全新蛋白質序列。這開啟了一條全新的藥物開發、材料科學和農業生物技術路徑。問題是：誰能把這些計算能力轉化為可製造、可商業化的產品？',
    technical_core: 'AI 驅動蛋白質設計的核心管線：(1) 生成式模型（ESM3、ProteinMPNN）產生候選序列；(2) 結構預測（AlphaFold 3）篩選折疊穩定性；(3) 分子動力學模擬驗證功能；(4) 高通量實驗室合成與測試（DNA Synthesis + Cell-free Expression + Plate Reader）。瓶頸在步驟 4：實驗驗證速度是 10^3 個/週，而模型可生成 10^9 個候選序列。「DBTL 循環」（Design-Build-Test-Learn）的 Build-Test 環節仍是工業化障礙。',
    analysis: [
      'Ginkgo Bioworks 的失敗案例揭示了商業化陷阱：合成生物學的「設計」端已被 AI 大幅加速，但「製造」端（發酵罐放大、純化工藝、品管法規）的成本並未隨之下降，導致客戶 unit economics 惡化。',
      '真正的護城河在數據飛輪：每次濕實驗室測試都產生新的訓練數據，讓模型持續改進。Recursion Pharmaceuticals 的「OS」系統、Insilico Medicine 的端到端管線，正在積累其他公司難以複製的專有數據集。'
    ],
    implications: [
      '農業生物技術是最接近大規模商業化的領域：Pivot Bio 的固氮微生物已在數百萬英畝農地部署，AI 加速的菌株設計可將產品開發週期從 5 年縮短至 18 個月。',
      '製藥公司的戰略選擇：買還是建？Pfizer 收購 Seagen、AZ 投資 Recursion，顯示大藥廠選擇「買能力」而非「建能力」，AI 生物技術獨角獸的 M&A 溢價將持續。'
    ],
    outlook: '2026-2028 年觀察窗口：FDA 是否建立 AI 設計蛋白質藥物的專屬審批通道、細胞療法（CAR-T 2.0）與 AI 蛋白質設計的結合臨床結果，以及合成生物學在碳捕捉材料領域的第一個 GW 規模部署案例。',
    keywords: ['合成生物學', 'AlphaFold', '蛋白質設計', 'DBTL', '生物技術', 'AI藥物'],
    glossary: [
      { term: 'DBTL 循環', def: 'Design-Build-Test-Learn，合成生物學的迭代開發框架，Build-Test 是商業化瓶頸' },
      { term: 'ESM3', def: 'Meta 發布的蛋白質語言模型，能同時建模序列、結構和功能，支援生成式設計' }
    ],
    depth: 4,
    read_time: 8,
    date: '2026-05-11'
  }
];
