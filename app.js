const DATA = window.CPAS_SIM_DATA;
const state = JSON.parse(localStorage.getItem("cpasSimState") || JSON.stringify({
  asked: 0,
  cpasUnlocked: false,
  boxes: Object.fromEntries(DATA.reportBoxes.map(b => [b, []]))
}));

function saveState(){ localStorage.setItem("cpasSimState", JSON.stringify(state)); }
function $(id){ return document.getElementById(id); }

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
  $("reportCpas").value = state.cpasUnlocked
    ? "請從 CPAS 對照頁挑選 3 個關鍵指標，寫成：分數＋晤談證據＋工作行為影響。\n\n建議優先檢查：行動性3、持續性1、思考性8、慎重性9、對人工作0、營業工作0、非定型工作1。"
    : "尚未揭示 CPAS。請先完成蒐證，再回到 CPAS 對照頁。";
  $("reportAdvice").value = "請依一對一原則撰寫：\n1. 每一個職涯問題至少對應一個建議。\n2. 每一個建議都要能回到晤談資料與 CPAS 指標。\n3. 初級版可先寫：職缺分析、實習探索、數位工具補強、小型 side project、三週小行動。";
}
$("copyReport").addEventListener("click", async () => {
  const txt = `一、個案背景\n${$("reportBackground").value}\n\n二、現況說明\n${$("reportStatus").value}\n\n三、職涯問題\n${$("reportProblem").value}\n\n四、CPAS 關鍵指標與行為證據\n${$("reportCpas").value}\n\n五、顧問建議方向\n${$("reportAdvice").value}`;
  await navigator.clipboard.writeText(txt);
  alert("已複製報告骨架。");
});

renderQuestions();
renderBoard();
renderCpas();
updateCount();
