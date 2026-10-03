// ===== STATE =====
let currentStep = 1;
let selectedDate = null;
let calYear = 2026;
let calMonth = 9; // 0-indexed, October = 9
let noCount = 0;
let confirmedAddress = "";

// ===== NAVIGATION =====
function goTo(step) {
  const prev = document.getElementById(`step-${currentStep}`);
  const next = document.getElementById(`step-${step}`);
  if (!next) return;

  prev.classList.remove("active");
  prev.classList.add("exit");
  setTimeout(() => prev.classList.remove("exit"), 500);

  next.classList.add("active");
  currentStep = step;
  updateDots();

  // Step-specific actions
  if (step === 3) renderCalendar();
  if (step === 8) endingSequence();
}

// ===== DOTS =====
function updateDots() {
  document.querySelectorAll(".dot").forEach(d => {
    d.classList.toggle("active", parseInt(d.dataset.step) === currentStep);
  });
}

// ===== STEP 1: Button "No" runs away =====
function runAway(btn) {
  const maxX = window.innerWidth - btn.offsetWidth - 20;
  const maxY = window.innerHeight - btn.offsetHeight - 20;
  const rx = Math.floor(Math.random() * maxX);
  const ry = Math.floor(Math.random() * maxY);
  btn.style.position = "fixed";
  btn.style.left = rx + "px";
  btn.style.top = ry + "px";
  btn.style.zIndex = "900";
  btn.style.transition = "left 0.3s, top 0.3s";
  noCount++;
  if (noCount >= 3) {
    const cat = document.getElementById("cat-gif");
    if (cat) { cat.style.transform = "scale(1.1)"; cat.style.transition = "transform 0.3s"; }
  }
}

function catchedNo() {
  // If somehow clicked, just go to yes anyway :)
  goTo(2);
}

// ===== STEP 3: CALENDAR =====
const MONTHS_VI = ["Thang 1","Thang 2","Thang 3","Thang 4","Thang 5","Thang 6","Thang 7","Thang 8","Thang 9","Thang 10","Thang 11","Thang 12"];

function renderCalendar() {
  const header = document.getElementById("cal-month-year");
  const grid = document.getElementById("cal-days");
  header.textContent = MONTHS_VI[calMonth] + ", " + calYear;
  grid.innerHTML = "";

  const today = new Date();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // Empty cells
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "cal-day";
    cell.textContent = d;

    const thisDate = new Date(calYear, calMonth, d);
    const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = thisDate.toDateString() === today.toDateString();

    if (isPast) { cell.classList.add("past"); }
    else {
      if (isToday) cell.classList.add("today");
      if (selectedDate && selectedDate.getTime() === thisDate.getTime()) cell.classList.add("selected");
      cell.addEventListener("click", () => selectDate(new Date(calYear, calMonth, d)));
    }

    grid.appendChild(cell);
  }
}

function selectDate(date) {
  selectedDate = date;
  const days = ["CN","Thu 2","Thu 3","Thu 4","Thu 5","Thu 6","Thu 7"];
  const display = document.getElementById("selected-date-display");
  display.textContent = `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
  document.getElementById("btn-step3-next").disabled = false;
  renderCalendar();
}

function changeMonth(dir) {
  calMonth += dir;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

// ===== STEP 4: ADDRESS VALIDATION =====
// Normalized to lowercase, strip diacritics for matching
function normalizeStr(s) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/d/g, "d").replace(/\s+/g, " ").trim();
}

// Vague patterns to REJECT
const VAGUE_PATTERNS = [
  // Phrases about guessing / let him figure it out
  /\bdoan\b/,          // "doan" (guess)
  /\btu\s*doan\b/,     // "tu doan" (self guess)
  /\btim\s*di\b/,      // "tim di" (go find it)
  /\btim\s*hieu\b/,    // "tim hieu"
  /\btim\s*la\b/,      // "tim la ra"
  /\btien\s*len\b/,    // "tien len"
  /\btu\s*tim\b/,      // "tu tim" (find it yourself)
  /\bthem\s*di\b/,
  /\btu\s*biet\b/,     // "tu biet" (figure it out yourself)
  // Vague location references
  /\bnha\s*em\b/,      // "nha em" (my house - no number)
  /\bnhaf\s*em\b/,
  /\bnha\s*minh\b/,    // "nha minh"
  /\bcho\s*cu\b/,      // "cho cu" (old market - vague)
  /\bgan\s*day\b/,     // "gan day" (nearby)
  /\bgần\s*đây\b/,
  /\bdau\s*do\b/,      // "dau do" (somewhere)
  /\bkhong\s*biet\b/,  // "khong biet" (don't know)
  /\bkhong\s*nho\b/,   // "khong nho" (don't remember)
  /\bquen\s*roi\b/,    // "quen roi"
  /\bbí\s*mật\b/,      // "bi mat" (secret)
  /\bbi\s*mat\b/,
  /\bbat\s*ngo\b/,     // "bat ngo" (surprise)
  /\bchiu\b/,          // "chiu" (give up)
  /\bkhong\s*noi\b/,   // "khong noi" (won't tell)
  // Joke/trolling inputs
  /^(ha)+$/,            // "hahaha"
  /^(hi)+$/,            // "hihihi"
  /^(he)+$/,            // "hehehe"
  /^[?!.\s]+$/,         // only punctuation
  /^[a-z]{1,3}$/,       // abc, xyz, lol...
  /^\d+$/,              // only numbers
  /^[\p{Emoji}\s]+$/u,  // only emojis
  /\.{3,}/,             // "..." (ellipsis)
  /^x+$/i,              // xxx
  /\btest\b/,
  /\bdemo\b/,
  /\bkk+\b/,            // kkk, kk
  /\bvkl\b/,
  /\blmao\b/,
  // Single word or too generic
  /^\S+$/,              // single word only -> need at least 2 words
];

// Must contain signs of a real address (number OR ward/district keywords)
const REAL_ADDRESS_SIGNALS = [
  /\d+/,                            // has a number (house no, apt)
  /\b(duong|pho|ngo|hem|lo|p\.|ph\.|q\.|quan|huyen|xa|thi\s*tran|tp\.|thanh\s*pho|tinh|khu|ap|thon|tto|bldg|floor|tang|can\s*ho|phong|block|lo|kiot)\b/i,
];

const ERRORS = {
  tooShort:    "Dia chi qua ngan! Vui long nhap day du so nha, duong, phuong/xa, quan/huyen.",
  vague:       "Kieu do khong duoc nha bee~ 🙈 Phai nhap dia chi cu the anh moi den duoc!",
  noSignal:    "Dia chi can co so nha hoac ten duong / phuong / quan cu the nhe!",
  ok:          ""
};

function validateAddress() {
  const input = document.getElementById("address-input");
  const errorEl = document.getElementById("address-error");
  const nextBtn = document.getElementById("btn-step4-next");
  const counter = document.getElementById("addr-count");
  const raw = input.value;

  counter.textContent = raw.length;
  const val = normalizeStr(raw);

  // Reset
  input.classList.remove("valid", "invalid");
  errorEl.textContent = "";
  errorEl.classList.remove("show");

  // Too short
  if (val.length < 10) {
    nextBtn.disabled = true;
    if (val.length > 0) {
      errorEl.textContent = ERRORS.tooShort;
      errorEl.classList.add("show");
      input.classList.add("invalid");
    }
    return;
  }

  // Check vague patterns
  const isVague = VAGUE_PATTERNS.some(p => p.test(val));
  if (isVague) {
    errorEl.textContent = ERRORS.vague;
    errorEl.classList.add("show");
    input.classList.add("invalid");
    nextBtn.disabled = true;
    return;
  }

  // Must have at least one real address signal
  const hasSignal = REAL_ADDRESS_SIGNALS.some(p => p.test(val));
  if (!hasSignal) {
    errorEl.textContent = ERRORS.noSignal;
    errorEl.classList.add("show");
    input.classList.add("invalid");
    nextBtn.disabled = true;
    return;
  }

  // All good!
  input.classList.add("valid");
  errorEl.textContent = "";
  nextBtn.disabled = false;
}

function submitAddress() {
  const input = document.getElementById("address-input");
  const val = input.value.trim();
  if (!val || document.getElementById("btn-step4-next").disabled) return;
  confirmedAddress = val;
  goTo(5);
}

// ===== STEP 8: ENDING =====
function endingSequence() {
  buildSummary();
  spawnHearts();
  triggerConfetti();
}

function buildSummary() {
  // Date
  const dateEl = document.getElementById("summary-date");
  if (selectedDate) {
    const days = ["CN","Thu 2","Thu 3","Thu 4","Thu 5","Thu 6","Thu 7"];
    dateEl.innerHTML = `<strong>Ngay hen:</strong> ${days[selectedDate.getDay()]}, ${selectedDate.getDate()}/${selectedDate.getMonth()+1}/${selectedDate.getFullYear()}`;
  }

  // Address
  const addrEl = document.getElementById("summary-address");
  if (confirmedAddress) {
    addrEl.innerHTML = `<strong>Don em tai:</strong> ${confirmedAddress}`;
  }

  // Food
  const foods = [...document.querySelectorAll("#food-grid .circle-check:checked")]
    .map(c => c.closest(".circle-item").dataset.val);
  document.getElementById("summary-food").innerHTML =
    foods.length ? `<strong>Mon an:</strong> ${foods.join(", ")}` : "";

  // Dessert
  const desserts = [...document.querySelectorAll("#dessert-grid .circle-check:checked")]
    .map(c => c.closest(".circle-item").dataset.val);
  document.getElementById("summary-dessert").innerHTML =
    desserts.length ? `<strong>Trang mieng:</strong> ${desserts.join(", ")}` : "";

  // Activity
  const activities = [...document.querySelectorAll("#activity-grid .circle-check:checked")]
    .map(c => c.closest(".circle-item").dataset.val);
  document.getElementById("summary-activity").innerHTML =
    activities.length ? `<strong>Di dau:</strong> ${activities.join(", ")}` : "";
}

function spawnHearts() {
  const container = document.getElementById("hearts-container");
  container.innerHTML = "";
  const emojis = ["♥","💕","💖","💗","💝","🌸","✨","💞"];
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const h = document.createElement("span");
      h.className = "heart";
      h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      h.style.left = Math.random() * 100 + "vw";
      h.style.fontSize = (16 + Math.random() * 24) + "px";
      const dur = 3 + Math.random() * 4;
      h.style.animationDuration = dur + "s";
      container.appendChild(h);
      setTimeout(() => h.remove(), dur * 1000);
    }, i * 250);
  }

  // Keep spawning
  setInterval(() => {
    if (currentStep !== 8) return;
    const h = document.createElement("span");
    h.className = "heart";
    h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = (14 + Math.random() * 20) + "px";
    const dur = 3 + Math.random() * 5;
    h.style.animationDuration = dur + "s";
    container.appendChild(h);
    setTimeout(() => h.remove(), dur * 1000);
  }, 600);
}

// ===== CONFETTI =====
function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#e8617a","#f5a0b5","#9b59b6","#4ecdc4","#f7c4ce","#ffd700","#ff9f43"];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 6,
      shape: Math.random() > 0.5 ? "rect" : "circle"
    });
  }

  let frame = 0;
  function animate() {
    if (frame > 200 || currentStep !== 8) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      if (p.y > canvas.height) p.y = -20;
    });
    frame++;
    requestAnimationFrame(animate);
  }
  animate();
}

// Init
renderCalendar();


