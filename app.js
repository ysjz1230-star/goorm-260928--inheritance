// ============ 설정: 여기만 바꾸면 서비스 이름이 전체에 적용됩니다 ============
const BRAND_NAME = "이어집"; // ← 이름이 정해지면 수정 (index.html의 <title>도 함께 변경)
document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = BRAND_NAME));

// ============ 1. 라이트/다크 테마 ============
const root = document.documentElement;
const savedTheme = safeGet("theme");
if (savedTheme) root.dataset.theme = savedTheme;

document.getElementById("themeToggle").addEventListener("click", () => {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  safeSet("theme", next);
});

// ============ 2. 준비서류 체크리스트 (예시 데이터) ============
const STAGES = [
  { id: "consult", name: "세무사 상담", docs: [
    ["부동산 등기부등본", "소유 현황 확인용"],
    ["가족관계증명서", "상속인·수증자 관계 확인"],
    ["주민등록등본", "관계자 인적사항"],
    ["최근 공시가격 자료", "세금 추정에 활용"],
  ]},
  { id: "cost", name: "취득비용·보유세", docs: [
    ["취득 원인 서류", "증여/상속 계약 또는 결정 자료"],
    ["취득세 신고 자료", "신고·납부 내역"],
    ["재산세·종합부동산세 고지서", "보유세 기록용"],
  ]},
  { id: "trust", name: "신탁 검토", docs: [
    ["신탁 목적 정리 메모", "무엇을 위해 신탁할지"],
    ["부동산 권리 관계 자료", "근저당 등 확인"],
    ["수익자·수탁자 후보 정보", "가족 합의 내용 포함"],
  ]},
  { id: "notary", name: "공정증서", docs: [
    ["신분증", "당사자 본인 확인"],
    ["인감증명서", "발급일 기준 확인 필요"],
    ["계약서 초안", "세무사 검토 후 준비"],
    ["위임장(대리인 방문 시)", "필요한 경우만"],
  ]},
];

const state = loadState();
let currentStage = STAGES[0].id;

const tabsEl = document.getElementById("demoTabs");
const listEl = document.getElementById("demoList");

function loadState() {
  try { return JSON.parse(safeGet("checks") || "{}"); } catch { return {}; }
}

function renderTabs() {
  tabsEl.innerHTML = "";
  STAGES.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab";
    btn.role = "tab";
    btn.textContent = s.name;
    btn.setAttribute("aria-selected", String(s.id === currentStage));
    btn.addEventListener("click", () => { currentStage = s.id; renderTabs(); renderList(); });
    tabsEl.appendChild(btn);
  });
}

function renderList() {
  const stage = STAGES.find((s) => s.id === currentStage);
  const checked = state[stage.id] || [];
  document.getElementById("demoTitle").textContent = stage.name + " 단계 준비서류";
  listEl.innerHTML = "";

  stage.docs.forEach(([title, hint], i) => {
    const li = document.createElement("li");
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked.includes(i);
    input.addEventListener("change", () => {
      const set = new Set(state[stage.id] || []);
      input.checked ? set.add(i) : set.delete(i);
      state[stage.id] = [...set];
      safeSet("checks", JSON.stringify(state));
      updateProgress(stage);
      renderTabs();
    });
    const span = document.createElement("span");
    span.innerHTML = ""; // textContent로만 넣어 안전하게 처리
    const strong = document.createElement("span");
    strong.textContent = title;
    const small = document.createElement("small");
    small.textContent = hint;
    span.append(strong, small);
    label.append(input, span);
    li.appendChild(label);
    listEl.appendChild(li);
  });
  updateProgress(stage);
}

function updateProgress(stage) {
  const done = (state[stage.id] || []).length;
  const total = stage.docs.length;
  const pct = Math.round((done / total) * 100);
  document.getElementById("demoCount").textContent = `${done} / ${total} 완료 · ${pct}%`;
  document.getElementById("demoBar").style.width = pct + "%";
  document.getElementById("demoProgress").setAttribute("aria-valuenow", pct);
}

document.getElementById("demoReset").addEventListener("click", () => {
  state[currentStage] = [];
  safeSet("checks", JSON.stringify(state));
  renderList();
});

renderTabs();
renderList();

// ============ 3. 대기자 등록 폼 (지금은 브라우저 내 임시 동작) ============
// 나중에 서버(API)를 연결할 때 이 부분을 fetch("/api/waitlist", ...)로 바꾸면 됩니다.
const form = document.getElementById("waitlistForm");
const emailEl = document.getElementById("email");
const msgEl = document.getElementById("formMsg");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = emailEl.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  emailEl.setAttribute("aria-invalid", String(!valid));
  msgEl.className = "form__msg " + (valid ? "is-ok" : "is-err");
  msgEl.textContent = valid
    ? "등록 요청이 접수되었어요(시안 단계: 실제 저장은 되지 않습니다)."
    : "올바른 이메일 형식으로 입력해 주세요.";
  if (valid) form.reset();
});

// ============ 저장소 도우미 (저장소가 막힌 환경에서도 오류 없이 동작) ============
function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, value) { try { localStorage.setItem(key, value); } catch { /* 무시 */ } }
