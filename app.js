const QUESTIONS = [
  { id: 1, level: 1, type: 'mcq', title: '1 yến bằng bao nhiêu ki-lô-gam?', options: ['1 kg', '10 kg', '100 kg', '1 000 kg'], answer: 1, explain: '1 yến = 10 kg.' },
  { id: 2, level: 1, type: 'truefalse', title: 'Đúng hay sai: 1 tạ = 100 kg.', options: ['Đúng', 'Sai'], answer: 0, explain: 'Khẳng định đúng vì 1 tạ = 100 kg.' },
  { id: 3, level: 1, type: 'fill', title: 'Điền số thích hợp vào ô trống.', prefix: '3 yến =', suffix: 'kg', answer: '30', explain: '3 yến = 3 × 10 = 30 kg.' },
  { id: 4, level: 2, type: 'mcq', title: 'Một con bò nặng 4 tạ. Con bò nặng bao nhiêu ki-lô-gam?', options: ['40 kg', '400 kg', '4 000 kg', '104 kg'], answer: 1, explain: '4 tạ = 4 × 100 = 400 kg.' },
  { id: 5, level: 2, type: 'match', title: 'Nối mỗi khối lượng với giá trị bằng nó.', left: ['2 yến', '5 tạ', '3 tấn'], right: ['3 000 kg', '20 kg', '500 kg'], pairs: { '2 yến': '20 kg', '5 tạ': '500 kg', '3 tấn': '3 000 kg' }, explain: 'Mỗi yến bằng 10 kg, mỗi tạ bằng 100 kg và mỗi tấn bằng 1 000 kg.' },
  { id: 6, level: 2, type: 'drag', title: 'Kéo hoặc chạm để xếp các khối lượng vào đúng nhóm.', items: ['10 kg', '1 000 kg', '100 kg', '5 yến', '2 tấn', '7 tạ'], zones: ['Yến', 'Tạ', 'Tấn'], answer: { '10 kg': 'Yến', '5 yến': 'Yến', '100 kg': 'Tạ', '7 tạ': 'Tạ', '1 000 kg': 'Tấn', '2 tấn': 'Tấn' }, explain: 'Nhận biết đơn vị hoặc đổi về mốc: 10 kg = 1 yến, 100 kg = 1 tạ, 1 000 kg = 1 tấn.' },
  { id: 7, level: 2, type: 'truefalse', title: 'Đúng hay sai: 6 tạ 5 kg = 605 kg.', options: ['Đúng', 'Sai'], answer: 0, explain: '6 tạ = 600 kg; thêm 5 kg được 605 kg.' },
  { id: 8, level: 3, type: 'fill', title: 'Một xe chở 2 tấn gạo, đã dỡ xuống 6 tạ. Trên xe còn lại bao nhiêu ki-lô-gam?', prefix: 'Khối lượng còn lại:', suffix: 'kg', answer: '1400', explain: '2 tấn = 2 000 kg; 6 tạ = 600 kg; còn 2 000 − 600 = 1 400 kg.' },
  { id: 9, level: 3, type: 'mcq', title: 'Dấu thích hợp điền vào 3 tạ 5 yến ... 340 kg là:', options: ['>', '<', '=', 'Không so sánh được'], answer: 0, explain: '3 tạ 5 yến = 300 kg + 50 kg = 350 kg, mà 350 kg > 340 kg.' },
  { id: 10, level: 3, type: 'drag', title: 'Sắp xếp các khối lượng vào nhóm “Nhẹ hơn”, “Bằng” hoặc “Nặng hơn” 1 tấn.', items: ['9 tạ', '1 000 kg', '12 tạ', '8 tạ 50 kg', '10 tạ', '1 tấn 5 yến'], zones: ['Nhẹ hơn', 'Bằng', 'Nặng hơn'], answer: { '9 tạ': 'Nhẹ hơn', '8 tạ 50 kg': 'Nhẹ hơn', '1 000 kg': 'Bằng', '10 tạ': 'Bằng', '12 tạ': 'Nặng hơn', '1 tấn 5 yến': 'Nặng hơn' }, explain: 'Đổi về kg rồi so sánh với 1 tấn = 1 000 kg.' }
];

const STORAGE_KEY = 'yen-ta-tan-results-v1';
const SUPABASE_URL = window.__SUPABASE_URL__ || '';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || '';
const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_'));
let adminAccessToken = sessionStorage.getItem('yen-ta-tan-admin-token') || '';
const app = document.querySelector('#app');
const soundButton = document.querySelector('#soundButton');
const adminButton = document.querySelector('#adminButton');
const loginDialog = document.querySelector('#adminLoginDialog');
const confirmDialog = document.querySelector('#confirmDialog');

let soundOn = localStorage.getItem('yen-ta-tan-sound') !== 'off';
let state = { student: null, index: 0, score: 0, answers: [], checked: false, startedAt: null, response: null };
let audioContext;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function playSound(kind) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === 'correct' ? [523, 659, 784] : kind === 'finish' ? [523, 659, 784, 1047] : kind === 'click' ? [380] : [220, 180];
    notes.forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = kind === 'wrong' ? 'sawtooth' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, audioContext.currentTime + i * .11);
      gain.gain.exponentialRampToValueAtTime(.13, audioContext.currentTime + i * .11 + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + i * .11 + .13);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + i * .11);
      oscillator.stop(audioContext.currentTime + i * .11 + .15);
    });
  } catch (_) { /* Âm thanh là tính năng tăng cường. */ }
}

function updateSoundButton() {
  soundButton.textContent = soundOn ? '🔊' : '🔇';
  soundButton.setAttribute('aria-label', soundOn ? 'Tắt âm thanh' : 'Bật âm thanh');
}

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function levelInfo(level) {
  return { 1: ['Khởi động', 'Nhận biết'], 2: ['Tăng tốc', 'Thông hiểu'], 3: ['Về đích', 'Vận dụng'] }[level];
}

function renderWelcome() {
  state = { student: null, index: 0, score: 0, answers: [], checked: false, startedAt: null, response: null };
  app.innerHTML = `
    <section class="screen welcome-grid">
      <div>
        <span class="eyebrow">★ Trò chơi Toán lớp 4</span>
        <h1>Chinh phục<br><span class="highlight">yến, tạ, tấn!</span></h1>
        <p class="lead">Vượt qua 3 chặng thử thách với 10 câu hỏi. Mỗi câu đúng được 1 điểm. Em đã sẵn sàng trở thành nhà vô địch cân nặng chưa?</p>
        <div class="feature-row">
          <span class="feature-chip">🏁 3 mức độ</span><span class="feature-chip">✎ 10 câu hỏi</span><span class="feature-chip">🏆 10 điểm tối đa</span>
        </div>
        <form class="student-form" id="studentForm">
          <label>Họ và tên<input id="studentName" maxlength="50" placeholder="Ví dụ: Nguyễn Minh An" required></label>
          <label>Lớp<input id="studentClass" maxlength="12" placeholder="4A" required></label>
          <button class="primary-button" type="submit">Bắt đầu →</button>
        </form>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="scale-scene"><div class="sun"></div><div class="cloud"></div><div class="big-scale"><div class="scale-post"></div><div class="scale-beam"></div><div class="scale-pivot"></div><div class="pan left"><div class="weight">1 tạ</div></div><div class="pan right"><div class="sacks"><span class="sack">kg</span><span class="sack">kg</span></div></div></div></div>
        <span class="art-badge one">1 yến = 10 kg</span><span class="art-badge two">1 tấn = 1 000 kg</span>
      </div>
    </section>`;
  document.querySelector('#studentForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#studentName').value.trim();
    const className = document.querySelector('#studentClass').value.trim();
    if (!name || !className) return;
    state.student = { name, className };
    state.startedAt = Date.now();
    playSound('click');
    renderQuestion();
  });
}

function renderQuestion() {
  const q = QUESTIONS[state.index];
  state.checked = false;
  state.response = q.type === 'match' ? {} : q.type === 'drag' ? {} : null;
  const [stage, skill] = levelInfo(q.level);
  app.innerHTML = `
    <section class="screen game-screen">
      <div class="game-header">
        <div class="student-mini"><span class="avatar">${escapeHtml(state.student.name.charAt(0).toUpperCase())}</span><span><strong>${escapeHtml(state.student.name)}</strong><small>Lớp ${escapeHtml(state.student.className)}</small></span></div>
        <div class="score-pill">⭐ ${state.score} điểm</div>
      </div>
      <div class="progress-wrap"><div class="progress-meta"><span class="level-name">Chặng ${q.level}: ${stage}</span><span>${state.index + 1}/10</span></div><div class="progress-track"><div class="progress-fill" style="width:${(state.index + 1) * 10}%"></div></div></div>
      <article class="question-card">
        <div class="question-top"><span class="question-number">Câu ${state.index + 1}</span><span class="level-badge level-${q.level}">${skill}</span></div>
        <h2>${q.title}</h2>
        <div id="answerArea">${renderAnswer(q)}</div>
        <div id="feedbackArea"></div>
        <div class="question-actions"><button class="primary-button" id="checkButton" type="button">Kiểm tra</button></div>
      </article>
    </section>`;
  bindQuestionEvents(q);
  document.querySelector('#checkButton').addEventListener('click', () => checkAnswer(q));
  app.focus();
}

function renderAnswer(q) {
  if (q.type === 'mcq' || q.type === 'truefalse') {
    return `<div class="answers ${q.type === 'truefalse' ? 'true-false' : ''}">${q.options.map((option, i) => `<button class="answer-option" data-index="${i}" type="button"><span class="option-key">${q.type === 'truefalse' ? (i ? '✕' : '✓') : String.fromCharCode(65+i)}</span><span>${option}</span></button>`).join('')}</div>`;
  }
  if (q.type === 'fill') return `<div class="fill-wrap"><div class="equation"><span>${q.prefix}</span><input id="fillAnswer" type="text" inputmode="numeric" autocomplete="off" aria-label="Điền đáp án"><span>${q.suffix}</span></div></div>`;
  if (q.type === 'match') return `<div class="match-board"><div class="match-column"><h3>Khối lượng</h3>${q.left.map(v => `<button class="match-item" data-side="left" data-value="${v}" type="button">${v}</button>`).join('')}</div><div class="match-column"><h3>Giá trị tương ứng</h3>${q.right.map(v => `<button class="match-item" data-side="right" data-value="${v}" type="button">${v}</button>`).join('')}</div></div>`;
  if (q.type === 'drag') return `<div class="drag-board"><div class="drag-items" id="dragSource">${q.items.map(v => `<button class="drag-item" draggable="true" data-value="${v}" type="button">${v}</button>`).join('')}</div><div class="drop-zones">${q.zones.map(v => `<div class="drop-zone" data-zone="${v}" tabindex="0"><strong>${v}</strong><div class="dropped-list"></div></div>`).join('')}</div></div>`;
  return '';
}

function bindQuestionEvents(q) {
  if (q.type === 'mcq' || q.type === 'truefalse') {
    document.querySelectorAll('.answer-option').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('.answer-option').forEach(b => b.classList.remove('selected'));
      button.classList.add('selected'); state.response = Number(button.dataset.index); playSound('click');
    }));
  }
  if (q.type === 'fill') {
    const input = document.querySelector('#fillAnswer');
    input.addEventListener('input', () => state.response = input.value.replace(/\s/g, '').replace(/[.,]/g, ''));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(q); });
    input.focus();
  }
  if (q.type === 'match') bindMatching(q);
  if (q.type === 'drag') bindDragging(q);
}

function bindMatching(q) {
  let activeLeft = null;
  document.querySelectorAll('.match-item').forEach(button => button.addEventListener('click', () => {
    if (state.checked) return;
    if (button.dataset.side === 'left') {
      if (button.classList.contains('paired')) {
        const previousRight = state.response[button.dataset.value];
        delete state.response[button.dataset.value];
        button.classList.remove('paired');
        [...document.querySelectorAll('[data-side="right"]')].find(b => b.dataset.value === previousRight)?.classList.remove('paired');
      }
      document.querySelectorAll('[data-side="left"]').forEach(b => b.classList.remove('active'));
      activeLeft = button.dataset.value; button.classList.add('active'); playSound('click'); return;
    }
    if (button.classList.contains('paired')) { toast('Ô này đã được nối. Chạm vào ô bên trái tương ứng để đổi.'); return; }
    if (!activeLeft) { toast('Hãy chọn một ô bên trái trước.'); return; }
    Object.keys(state.response).forEach(key => { if (state.response[key] === button.dataset.value) delete state.response[key]; });
    state.response[activeLeft] = button.dataset.value;
    const leftButton = [...document.querySelectorAll('[data-side="left"]')].find(b => b.dataset.value === activeLeft);
    leftButton.classList.remove('active'); leftButton.classList.add('paired'); button.classList.add('paired');
    activeLeft = null; playSound('click');
  }));
}

function bindDragging(q) {
  let draggedValue = null;
  let selectedButton = null;
  const moveToZone = (value, zone) => {
    state.response[value] = zone;
    const item = [...document.querySelectorAll('.drag-item')].find(el => el.dataset.value === value);
    document.querySelector(`[data-zone="${zone}"] .dropped-list`).appendChild(item);
    item.classList.remove('selected'); selectedButton = null; playSound('click');
  };
  document.querySelectorAll('.drag-item').forEach(item => {
    item.addEventListener('dragstart', e => { draggedValue = item.dataset.value; e.dataTransfer.setData('text/plain', draggedValue); });
    item.addEventListener('click', () => {
      if (state.checked) return;
      document.querySelectorAll('.drag-item').forEach(el => el.classList.remove('selected'));
      selectedButton = item; item.classList.add('selected'); toast('Đã chọn. Chạm vào một nhóm để xếp.');
    });
  });
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); moveToZone(e.dataTransfer.getData('text/plain') || draggedValue, zone.dataset.zone); });
    zone.addEventListener('click', e => { if (selectedButton && !e.target.closest('.drag-item')) moveToZone(selectedButton.dataset.value, zone.dataset.zone); });
    zone.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && selectedButton) { e.preventDefault(); moveToZone(selectedButton.dataset.value, zone.dataset.zone); } });
  });
}

function checkAnswer(q) {
  if (state.checked) { nextQuestion(); return; }
  let complete = true;
  if (q.type === 'match') complete = Object.keys(state.response).length === q.left.length;
  else if (q.type === 'drag') complete = Object.keys(state.response).length === q.items.length;
  else complete = state.response !== null && state.response !== '';
  if (!complete) {
    toast(q.type === 'drag' ? 'Hãy xếp tất cả các thẻ.' : q.type === 'match' ? 'Hãy nối đủ các cặp.' : 'Em hãy chọn hoặc điền một đáp án.');
    document.querySelector('#answerArea').classList.add('shake'); setTimeout(() => document.querySelector('#answerArea')?.classList.remove('shake'), 350); return;
  }
  const correct = isCorrect(q);
  state.checked = true;
  if (correct) state.score++;
  state.answers.push({ id: q.id, correct, response: JSON.parse(JSON.stringify(state.response)) });
  document.querySelector('#feedbackArea').innerHTML = `<div class="feedback ${correct ? 'correct' : 'incorrect'}"><strong>${correct ? 'Chính xác! +1 điểm' : 'Chưa chính xác.'}</strong> ${q.explain}</div>`;
  document.querySelector('.score-pill').textContent = `⭐ ${state.score} điểm`;
  document.querySelector('#checkButton').textContent = state.index === QUESTIONS.length - 1 ? 'Xem kết quả →' : 'Câu tiếp theo →';
  document.querySelectorAll('#answerArea button, #answerArea input').forEach(el => el.disabled = true);
  playSound(correct ? 'correct' : 'wrong');
  document.querySelector('.question-card').classList.add('pop');
}

function isCorrect(q) {
  if (q.type === 'match') return q.left.every(key => state.response[key] === q.pairs[key]);
  if (q.type === 'drag') return q.items.every(key => state.response[key] === q.answer[key]);
  return String(state.response).toLowerCase() === String(q.answer).toLowerCase();
}

function nextQuestion() {
  if (state.index < QUESTIONS.length - 1) { state.index++; renderQuestion(); }
  else finishGame();
}

async function finishGame() {
  const durationSeconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));
  const result = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: state.student.name, className: state.student.className, score: state.score, total: 10, durationSeconds, completedAt: new Date().toISOString(), levelScores: [1,2,3].map(level => QUESTIONS.filter(q => q.level === level).filter(q => state.answers.find(a => a.id === q.id)?.correct).length) };
  await saveResult(result);
  playSound('finish'); renderResult(result);
}

function renderResult(result) {
  const rank = result.score === 10 ? ['Xuất sắc!', '🏆', 'Em đã làm đúng toàn bộ thử thách.'] : result.score >= 8 ? ['Rất tốt!', '🥇', 'Em đã nắm bài rất vững.'] : result.score >= 6 ? ['Hoàn thành tốt!', '⭐', 'Ôn lại một chút để tiến bộ hơn nhé.'] : ['Cố gắng thêm nhé!', '🌱', 'Hãy xem lại cách đổi các đơn vị rồi thử lại.'];
  app.innerHTML = `<section class="screen result-screen"><div class="result-burst">${rank[1]}</div><span class="eyebrow">Đã hoàn thành đường đua</span><h1>${rank[0]}</h1><div class="result-score"><strong>${result.score}</strong>/10 điểm</div><p class="result-message">${rank[2]} Kết quả của em đã được lưu.</p><div class="result-stats"><div class="stat-box"><strong>${result.levelScores[0]}/3</strong><span>Nhận biết</span></div><div class="stat-box"><strong>${result.levelScores[1]}/4</strong><span>Thông hiểu</span></div><div class="stat-box"><strong>${result.levelScores[2]}/3</strong><span>Vận dụng</span></div></div><div class="result-actions"><button class="primary-button" id="retryButton">Chơi lại ↻</button><button class="secondary-button" id="resultHomeButton">Về trang chủ</button></div></section>`;
  document.querySelector('#retryButton').addEventListener('click', () => { const student = state.student; state = { student, index:0, score:0, answers:[], checked:false, startedAt:Date.now(), response:null }; playSound('click'); renderQuestion(); });
  document.querySelector('#resultHomeButton').addEventListener('click', renderWelcome);
}

function getLocalResults() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (_) { return []; }
}

async function saveResult(result) {
  if (!supabaseEnabled) {
    const results = getLocalResults(); results.push(result); localStorage.setItem(STORAGE_KEY, JSON.stringify(results)); return;
  }
  try {
    await supabaseRequest('/rest/v1/game_results', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ name: result.name, class_name: result.className, score: result.score, total: result.total, duration_seconds: result.durationSeconds, level_scores: result.levelScores, completed_at: result.completedAt }) });
  } catch (error) { console.error(error); toast('Kết quả chưa đồng bộ, đã giữ bản tạm trên máy.'); const results = getLocalResults(); results.push(result); localStorage.setItem(STORAGE_KEY, JSON.stringify(results)); }
}

async function getResults() {
  if (!supabaseEnabled) return getLocalResults();
  try {
    const data = await supabaseRequest('/rest/v1/game_results?select=*&order=completed_at.desc', {}, true);
    return data.map(row => ({ id: row.id, name: row.name, className: row.class_name, score: row.score, total: row.total, durationSeconds: row.duration_seconds, levelScores: row.level_scores || [0,0,0], completedAt: row.completed_at }));
  } catch (error) { console.error(error); toast('Không tải được dữ liệu Supabase.'); return []; }
}

async function deleteResult(id) {
  if (!supabaseEnabled) { localStorage.setItem(STORAGE_KEY, JSON.stringify(getLocalResults().filter(r => r.id !== id))); return; }
  try { await supabaseRequest(`/rest/v1/game_results?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }, true); }
  catch (error) { toast('Không thể xóa kết quả.'); throw error; }
}

async function supabaseRequest(path, options = {}, authenticated = false) {
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${authenticated ? adminAccessToken : SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function signInAdmin(email, password) {
  const session = await supabaseRequest('/auth/v1/token?grant_type=password', { method:'POST', body:JSON.stringify({ email, password }) });
  adminAccessToken = session.access_token;
  sessionStorage.setItem('yen-ta-tan-admin-token', adminAccessToken);
}

async function signOutAdmin() {
  if (adminAccessToken) { try { await supabaseRequest('/auth/v1/logout', { method:'POST' }, true); } catch (_) { /* Clear local session regardless. */ } }
  adminAccessToken = ''; sessionStorage.removeItem('yen-ta-tan-admin-token');
}

function formatDuration(seconds) { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}:${String(s).padStart(2,'0')}`; }
function formatDate(iso) { return new Intl.DateTimeFormat('vi-VN', { dateStyle:'short', timeStyle:'short' }).format(new Date(iso)); }

async function renderAdmin() {
  const results = (await getResults()).sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));
  const uniqueStudents = new Set(results.map(r => `${r.name}|${r.className}`)).size;
  const average = results.length ? (results.reduce((sum,r) => sum + r.score, 0) / results.length).toFixed(1) : '0.0';
  const excellent = results.length ? Math.round(results.filter(r => r.score >= 8).length / results.length * 100) : 0;
  app.innerHTML = `<section class="screen admin-screen"><div class="admin-heading"><div><h1>Bảng kết quả học tập</h1><p>Theo dõi kết quả Bài 17: Yến, tạ, tấn</p></div><div class="admin-tools"><button class="secondary-button" id="exportButton">⇩ Xuất CSV</button><button class="secondary-button" id="logoutButton">Đăng xuất</button></div></div><div class="dashboard-stats"><div class="dashboard-stat"><strong>${results.length}</strong><span>Lượt hoàn thành</span></div><div class="dashboard-stat"><strong>${uniqueStudents}</strong><span>Học sinh</span></div><div class="dashboard-stat"><strong>${average}</strong><span>Điểm trung bình</span></div><div class="dashboard-stat"><strong>${excellent}%</strong><span>Đạt từ 8 điểm</span></div></div><div class="filters"><input id="searchResult" placeholder="Tìm theo tên học sinh..."><select id="classFilter"><option value="">Tất cả lớp</option>${[...new Set(results.map(r => r.className))].sort().map(c => `<option value="${escapeHtml(c)}">Lớp ${escapeHtml(c)}</option>`).join('')}</select><select id="scoreFilter"><option value="">Tất cả kết quả</option><option value="excellent">8 - 10 điểm</option><option value="good">5 - 7 điểm</option><option value="retry">0 - 4 điểm</option></select></div><div class="table-wrap" id="resultTable"></div><p class="admin-note">${supabaseEnabled ? 'Dữ liệu đang được đồng bộ tập trung qua Supabase.' : 'Chế độ local: dữ liệu chỉ được lưu trên trình duyệt này.'}</p></section>`;
  const update = () => renderResultTable(results);
  document.querySelector('#searchResult').addEventListener('input', update); document.querySelector('#classFilter').addEventListener('change', update); document.querySelector('#scoreFilter').addEventListener('change', update);
  document.querySelector('#logoutButton').addEventListener('click', async () => { if (supabaseEnabled) await signOutAdmin(); sessionStorage.removeItem('yen-ta-tan-admin'); renderWelcome(); });
  document.querySelector('#exportButton').addEventListener('click', () => exportCsv(results));
  update();
}

function renderResultTable(results) {
  const search = document.querySelector('#searchResult').value.trim().toLocaleLowerCase('vi'); const className = document.querySelector('#classFilter').value; const scoreGroup = document.querySelector('#scoreFilter').value;
  const filtered = results.filter(r => r.name.toLocaleLowerCase('vi').includes(search) && (!className || r.className === className) && (!scoreGroup || (scoreGroup === 'excellent' && r.score >= 8) || (scoreGroup === 'good' && r.score >= 5 && r.score <= 7) || (scoreGroup === 'retry' && r.score <= 4)));
  const wrap = document.querySelector('#resultTable');
  if (!filtered.length) { wrap.innerHTML = `<div class="empty-state"><span style="font-size:38px">📋</span><strong>Chưa có kết quả phù hợp</strong><span>Kết quả học sinh sẽ xuất hiện tại đây.</span></div>`; return; }
  wrap.innerHTML = `<table><thead><tr><th>Học sinh</th><th>Lớp</th><th>Điểm</th><th>NB / TH / VD</th><th>Thời gian làm</th><th>Hoàn thành lúc</th><th></th></tr></thead><tbody>${filtered.map(r => `<tr><td><strong>${escapeHtml(r.name)}</strong></td><td>${escapeHtml(r.className)}</td><td class="score-cell">${r.score}/10</td><td>${(r.levelScores || ['-','-','-']).join(' / ')}</td><td>${formatDuration(r.durationSeconds)}</td><td>${formatDate(r.completedAt)}</td><td><button class="mini-delete" data-delete="${r.id}" title="Xóa kết quả" aria-label="Xóa kết quả của ${escapeHtml(r.name)}">×</button></td></tr>`).join('')}</tbody></table>`;
  wrap.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => requestDelete(button.dataset.delete)));
}

function requestDelete(id) {
  document.querySelector('#confirmTitle').textContent = 'Xóa kết quả?'; document.querySelector('#confirmMessage').textContent = 'Kết quả này sẽ bị xóa khỏi thiết bị và không thể khôi phục.';
  confirmDialog.showModal();
  confirmDialog.addEventListener('close', async function handler() { confirmDialog.removeEventListener('close', handler); if (confirmDialog.returnValue === 'confirm') { await deleteResult(id); await renderAdmin(); toast('Đã xóa kết quả.'); } });
}

function exportCsv(results) {
  if (!results.length) { toast('Chưa có dữ liệu để xuất.'); return; }
  const rows = [['Họ và tên','Lớp','Điểm','Nhận biết','Thông hiểu','Vận dụng','Thời gian (giây)','Hoàn thành'], ...results.map(r => [r.name,r.className,r.score,...(r.levelScores || []),r.durationSeconds,formatDate(r.completedAt)])];
  const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href=url; link.download=`ket-qua-yen-ta-tan-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url); toast('Đã xuất tệp CSV.');
}

soundButton.addEventListener('click', () => { soundOn = !soundOn; localStorage.setItem('yen-ta-tan-sound', soundOn ? 'on' : 'off'); updateSoundButton(); if (soundOn) playSound('click'); });
document.querySelector('#homeButton').addEventListener('click', () => { if (sessionStorage.getItem('yen-ta-tan-admin')) renderAdmin(); else renderWelcome(); });
adminButton.addEventListener('click', () => { if (sessionStorage.getItem('yen-ta-tan-admin')) renderAdmin(); else { document.querySelector('#loginError').textContent=''; loginDialog.showModal(); setTimeout(() => document.querySelector('#adminUsername').focus(), 50); } });
document.querySelector('#adminLoginForm').addEventListener('submit', async event => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const username = document.querySelector('#adminUsername').value.trim(); const password = document.querySelector('#adminPassword').value;
  let valid = false;
  if (supabaseEnabled) {
    try { await signInAdmin(username, password); valid = true; } catch (_) { valid = false; }
  } else {
    valid = username === 'admin@local.test' && password === 'YenTaTan@17';
  }
  if (valid) { sessionStorage.setItem('yen-ta-tan-admin','true'); loginDialog.close(); event.target.reset(); playSound('correct'); renderAdmin(); }
  else { document.querySelector('#loginError').textContent='Tên đăng nhập hoặc mật khẩu chưa đúng.'; document.querySelector('#adminPassword').value=''; playSound('wrong'); }
});

updateSoundButton();
renderWelcome();
