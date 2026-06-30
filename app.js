const DATA = window.CPAS_SIM_DATA;
const state = JSON.parse(localStorage.getItem("cpasSimState") || JSON.stringify({
  asked: 0,
  cpasUnlocked: false,
  boxes: Object.fromEntries(DATA.reportBoxes.map(b => [b, []]))
}));

function saveState(){ localStorage.setItem("cpasSimState", JSON.stringify(state)); }
function $(id){ return document.getElementById(id); }

const REPORT_TRAITS_12 = `行動性 3分：速度較慢，較容易先思考、觀望與評估，面對較大的目標時，容易會不知道從哪裡開始。

持續性 1分：對長期任務的維持度較弱，偏好立竿見影的行動。

指導性 2分：對自己較缺乏自信，不太敢表達出自己的想法。

挑戰性 4分：有尋找方向的意願，但目標感尚未明確，較常先知道自己不想要什麼，而不一定能清楚說出想追求什麼。

共感性 2分：對陌生互動、主動關懷或高情緒勞動情境較保留。

情緒安定性 3分：情緒表達較直接寫在臉上，做事容易受到情緒影響。

獨立自主性 7分：傾向依自己的想法與節奏行動，不一定想跟多數人走相同路徑。

革新性 4分：有改變現況的想法，但面對實際改變時容易猶豫，會在想改變與擔心改變之間拉扯。

思考性 8分：容易深入思考與分析不同的可能性，也會反覆比較、分析與推演。

柔軟性 3分：面對不同建議或未知選項時，較容易先感到不確定，也可能卡在原本主觀的看法中。

感受性 5分：對他人眼神、語氣與回饋容易在某些情境下因外界訊息過度解讀。

慎重性 9分：做決定前會反覆確認與評估，擔心結果不如預期而事事斟酌。`;

const REPORT_IMPROVEMENT = `請依「指標＋描述影響＋具體行為改善建議」撰寫。

範例：
1. 行動性3分、思考性8分、慎重性9分，O同學目前較容易先思考、觀望與評估，面對升學、實習或就業選擇時，容易因目標過大而不知道如何開始。若個案希望更清楚自己的職涯方向，建議透過實做來驗證，缺乏行動會使探索停留在想法中，難以累積實際判斷依據。

2. 持續性1分，個案對長期任務的維持度較弱，偏好立竿見影的行動。目前較適合短期衝刺型的事務，建議可參加學校的微學分、演講等活動，來累積自己的經驗。在探索興趣的部分，每件事情至少要給自己1-3個月的時間累積足夠的經驗。`;

function switchTab(name){
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === name));
  if(name === "board") renderBoard();
  if(name === "report") buildReport();
}

document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
$("resetBtn").addEventListener("click", () => {
  if(confirm("確定要清除本次練習資料？")){
    localStorage.removeItem("cpasSimState");
    location.reload();
  }
});

function updateCount(){ $("askedCount").textContent = state.asked; }

function renderQuestions(){
  const grid = $("questionGrid");
  const tpl = $("questionCardTpl");
  grid.innerHTML = "";
  DATA.stage1.forEach((item, idx) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".badge").textContent = item.box;
    node.querySelector("h3").textContent = item.title.replace(/^[一二三四五六七八九十]+、/,"");
    const ul = node.querySelector("ul");
    item.questions.slice(0,4).forEach(q => {
      const li = document.createElement("li");
      li.textContent = q.replace(/^\d+\.\s*/,"");
      ul.appendChild(li);
    });
    node.querySelector(".askBtn").addEventListener("click", () => openDrawer(item, item.questions[0]));
    grid.appendChild(node);
  });
}

function fillSelect(defaultBox){
  const sel = $("boxSelect");
  sel.innerHTML = "";
  DATA.reportBoxes.forEach(b => {
    const op = document.createElement("option");
    op.value = b; op.textContent = b;
    if(b === defaultBox) op.selected = true;
    sel.appendChild(op);
  });
}

let currentItem = null;
function openDrawer(item, question){
  currentItem = item;
  state.asked += 1; saveState(); updateCount();
  $("answerDrawer").classList.remove("hidden");
  $("drawerSource").textContent = "個案回答｜" + item.box;
  $("drawerTitle").textContent = item.title.replace(/^[一二三四五六七八九十]+、/,"");
  $("drawerQuestion").textContent = "你問：" + (question || item.questions[0] || "請談談你的狀況");
  $("drawerAnswer").textContent = item.answer || DATA.genericAnswer;
  $("evidenceText").value = item.reveal || item.answer || "";
  $("revealBox").textContent = item.reveal || "這一題沒有額外整理資料，請由學員自行判斷要保留哪些素材。";
  $("revealBox").classList.add("hidden");
  fillSelect(item.box);
}
$("closeDrawer").addEventListener("click", () => $("answerDrawer").classList.add("hidden"));
$("showReveal").addEventListener("click", () => $("revealBox").classList.toggle("hidden"));
$("saveEvidence").addEventListener("click", () => {
  const box = $("boxSelect").value;
  const text = $("evidenceText").value.trim();
  if(!text) return alert("請先輸入或保留一段資料。");
  state.boxes[box].push({
    text,
    source: currentItem ? currentItem.title : "自訂提問",
    time: new Date().toLocaleString("zh-TW")
  });
  saveState();
  alert("已加入「" + box + "」。");
  renderBoard();
});

function matchQuestion(q){
  const s = q.trim();
  if(!s) return null;
  const rules = [
    [/興趣|方向|困擾|卡|想談|迷惘|解決/, "二"],
    [/哪裡|家人|父母|中部|地點|家庭/, "三"],
    [/工作.*意義|人生|賺錢|成就感|工作是什麼/, "四"],
    [/科系|成績|排名|投資學|會計|課程|學業/, "五"],
    [/TA|助教|打工|同學|教|課業/, "六"],
    [/滑板|社團|興趣|裝備|技巧/, "七"],
    [/管理|企業|產銷人發財|部門|人資|財務|行銷/, "八"],
    [/實作|專案|比賽|正式工作|做得少|驗證/, "九"],
    [/研究所|升學|論文|教授|碩士|考研/, "十"],
    [/實習|就業|大公司|小公司|新創|傳統產業/, "十一"],
    [/職缺|JD|job|must|nice|company|技能|公司介紹/, "十二"],
    [/Excel|Power|AI|工具|證照|數位|BI|資料分析/, "十三"],
    [/ORID|事實|感受|理解|表達/, "十六"],
    [/本週|行動|職缺.*幾|學長姐|side project|檢核/, "十七"]
  ];
  for(const [re, id] of rules){
    if(re.test(s)) return DATA.stage1.find(x => x.id === id);
  }
  return null;
}
$("freeAskBtn").addEventListener("click", () => {
  const q = $("freeQuestion").value;
  const item = matchQuestion(q);
  if(item) openDrawer(item, q);
  else openDrawer({title:"籠統提問", box:"職涯問題線索", questions:[q], answer:DATA.genericAnswer, reveal:"學員問法太籠統，尚無法取得足夠報告素材。建議追問：目前最困擾的是升學、實習、就業、興趣、能力，還是家庭限制？"}, q);
});

function renderBoard(){
  const board = $("evidenceBoard");
  board.innerHTML = "";
  DATA.reportBoxes.forEach(box => {
    const div = document.createElement("div");
    div.className = "box";
    div.innerHTML = `<h3>${box}</h3>`;
    const arr = state.boxes[box] || [];
    if(arr.length === 0){
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "尚未蒐集資料";
      div.appendChild(empty);
    }else{
      arr.forEach((it, idx) => {
        const item = document.createElement("div");
        item.className = "eItem";
        item.innerHTML = `<button class="remove" title="刪除">×</button>${escapeHtml(it.text)}<small>${escapeHtml(it.source)}</small>`;
        item.querySelector(".remove").addEventListener("click", () => {
          state.boxes[box].splice(idx,1); saveState(); renderBoard();
        });
        div.appendChild(item);
      });
    }
    board.appendChild(div);
  });
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
$("exportBoard").addEventListener("click", async () => {
  const txt = DATA.reportBoxes.map(b => `【${b}】\n${(state.boxes[b]||[]).map(x=>"- "+x.text).join("\n") || "（尚無）"}`).join("\n\n");
  await navigator.clipboard.writeText(txt);
  alert("已複製資料格內容。");
});

function renderCpas(){
  $("cpasLocked").classList.toggle("hidden", state.cpasUnlocked);
  $("cpasContent").classList.toggle("hidden", !state.cpasUnlocked);
  if(!state.cpasUnlocked) return;
  renderCpasGrid("cpas5Grid", DATA.cpas5);
  renderCpasGrid("cpas12Grid", DATA.cpas12);
}
function renderCpasGrid(id, arr){
  const grid = $(id); grid.innerHTML = "";
  arr.forEach(item => {
    const div = document.createElement("div");
    div.className = "cpasCard";
    div.innerHTML = `<h4>${escapeHtml(item.title)}</h4>
      <p><strong>可追問：</strong></p>
      <ul>${item.questions.slice(0,3).map(q=>`<li>${escapeHtml(q.replace(/^\d+\.\s*/,""))}</li>`).join("")}</ul>
      <p><strong>個案回答：</strong>${escapeHtml(item.answer)}</p>
      <div class="purpose">${escapeHtml(item.purpose || "請依行為證據判讀。")}</div>`;
    grid.appendChild(div);
  });
}
$("unlockCpas").addEventListener("click", () => {
  state.cpasUnlocked = true; saveState(); renderCpas();
});

function linesFrom(boxes){
  return boxes.flatMap(b => (state.boxes[b]||[]).map(x => "・" + x.text)).join("\n");
}
function buildReport(){
  $("reportBackground").value = linesFrom(["背景與限制","學業與科系","經驗素材"]);
  $("reportStatus").value = linesFrom(["現況與卡點","升學/實習/就業","職缺與能力缺口"]);
  $("reportProblem").value = linesFrom(["主訴與價值觀","職涯問題線索"]);

  if(state.cpasUnlocked){
    $("reportTraits12").value = REPORT_TRAITS_12;
    $("reportWork5").value = `定型工作 4分：可接受一定程度的規則、流程與明確任務，但不一定能從高度重複工作中獲得強烈成就感。
目前可考慮行政管理助理、營運助理、資料整理助理、財務資料整理助理等流程清楚的支援型職務。

對人工作 0分：對於服務他人與高頻率陌生互動、高服務壓力或高情緒勞動等工作較抗拒。
不建議優先安排門市銷售、客服、活動接待、業務助理中高度對外互動的職務。
可考慮內部支援、資料處理、行政協助、低陌生互動的助理角色。

營業工作 0分：抗拒面對高業績壓力、陌生開發、推銷、招商或需要大量說服他人的工作。
若接觸行銷，宜先從資料分析、行銷後台、內容整理或企劃助理的支援角色開始。

非定型工作 1分：面對高度變動、問題解決、資源整合或沒有標準答案的任務時，容易感到壓力。
可先從任務明確、小型交付物、有人帶領的專案助理或營運助理開始。

具創造性工作 1分：較不容易跳脫框架思考或大量創新輸出的事務。
若要探索創意或數位相關方向，可先從模仿、整理、改良、輔助型任務開始，例如簡報整理、資料視覺化、side project、小型數位工具作品。`;
    $("reportLeadership").value = `領導潛能 0分：個案目前求學狀況較為迷失方向，面對責任容易選擇逃避。請從自我掌控、責任承擔、主動設定方向與推動任務的狀態撰寫，不建議從能不能當主管的角度分析。`;
  }else{
    $("reportTraits12").value = "尚未揭示 CPAS。請先完成蒐證，再回到 CPAS 對照頁；正式報告需撰寫「12項人格特質說明」，內容只放行為偏好描述，不放改善建議。";
    $("reportWork5").value = "尚未揭示 CPAS。正式報告需另列「五大適性工作判斷」，並說明各分數對工作型態與職務適配的意義。";
    $("reportLeadership").value = "尚未揭示 CPAS。正式報告需另列「領導潛能」，並從自我掌控、責任承擔、主動設定方向與推動任務的狀態分析。";
  }

  $("reportAdvice").value = `請依一對一原則撰寫顧問建議：
1. 每一個職涯問題至少對應一個建議。
2. 每一個建議都要能回到晤談資料與 CPAS 分數。

可參考的寫法：
・O同學目前迷惘主因並非科系沒有用，而是缺乏實習、專案與正式職場經驗，因此建議先透過低風險實習或職缺分析蒐集實際判斷資料。
・O同學行動性3分、持續性1分，若直接設定長期目標容易停留在想法中，因此建議將目標切成具體階段性的小任務，像是每週完成一個具體產出。
・O同學思考性8分、慎重性9分，可將其擔憂與焦慮轉化成分析與查核的能力，透過查找資料的過程，降低自己對未知的焦慮感。也建議培養風險管理的專業職能，提升自己的求職競爭力。
・O同學對人工作0分、營業工作0分，暫時不建議一開始就找高陌生互動或高業績壓力等職務，可先探索行政管理、營運支援、資料整理、經營分析、人資助理、財務資料整理等支援型與分析型角色。`;
  $("reportImprovement").value = "";
}
function collectReportText(){
  return `一、個案背景\n${$("reportBackground").value}\n\n二、現況說明\n${$("reportStatus").value}\n\n三、職涯問題\n${$("reportProblem").value}\n\n四、12項人格特質說明\n${$("reportTraits12").value}\n\n五、五大適性工作\n${$("reportWork5").value}\n\n六、領導潛能\n${$("reportLeadership").value}\n\n七、顧問建議\n${$("reportAdvice").value}\n\n七、顧問建議---對個案成為更好的具體改善建議\n${$("reportImprovement").value}`;
}

$("copyReport").addEventListener("click", async () => {
  const txt = collectReportText();
  await navigator.clipboard.writeText(txt);
  alert("已複製報告骨架。");
});

function reportHtml(){
  const sections = [
    ["一、個案背景", $("reportBackground").value],
    ["二、現況說明", $("reportStatus").value],
    ["三、職涯問題", $("reportProblem").value],
    ["四、12項人格特質說明", $("reportTraits12").value],
    ["五、五大適性工作", $("reportWork5").value],
    ["六、領導潛能", $("reportLeadership").value],
    ["七、顧問建議", $("reportAdvice").value],
    ["七、顧問建議---對個案成為更好的具體改善建議", $("reportImprovement").value]
  ];
  return `<div class="pdfReport"><h1>CPAS職涯輔導報告練習稿</h1><p class="pdfMeta">版本 v1.3.1｜初級培訓隱藏背景互動模擬</p>${sections.map(([title, body]) => `<section><h2>${escapeHtml(title)}</h2><pre>${escapeHtml(body || "（尚未填寫）")}</pre></section>`).join("")}</div>`;
}

$("downloadPdf").addEventListener("click", async () => {
  buildReport();
  if(window.html2pdf){
    const wrap = document.createElement("div");
    wrap.innerHTML = reportHtml();
    wrap.style.position = "fixed";
    wrap.style.left = "-10000px";
    wrap.style.top = "0";
    document.body.appendChild(wrap);
    const opt = {
      margin: [10, 10, 10, 10],
      filename: "CPAS職涯輔導報告練習稿_v1.3.1.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] }
    };
    try{
      await html2pdf().set(opt).from(wrap.querySelector(".pdfReport")).save();
    }finally{
      document.body.removeChild(wrap);
    }
  }else{
    const w = window.open("", "_blank");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>CPAS職涯輔導報告練習稿</title><style>body{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;line-height:1.7;padding:28px}h1{font-size:24px}h2{font-size:18px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:6px}pre{white-space:pre-wrap;font-family:inherit}</style></head><body>${reportHtml()}<script>window.print()<\/script></body></html>`);
    w.document.close();
  }
});

renderQuestions();
renderBoard();
renderCpas();
updateCount();
