// board.js — Kanban board
const Board = {
  drag: null,
  COLS: ['Applied', 'Interview', 'Offer', 'Rejected'],
  COLORS: { Applied: '#378ADD', Interview: '#EF9F27', Offer: '#639922', Rejected: '#E24B4A' },

  init() {
    const el = document.getElementById('page-board');
    el.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Application Board</h1>
        <button class="btn" onclick="Board.openModal()">+ Add</button>
      </div>
      <div class="stats-grid" id="b-stats"></div>
      <div class="kanban" id="b-kanban"></div>
      <div class="overlay" id="b-modal">
        <div class="modal">
          <div class="modal-title">Add application</div>
          <div class="field"><label>Role title</label><input type="text" id="b-role" placeholder="e.g. Implementation Manager"></div>
          <div class="field"><label>Company</label><input type="text" id="b-co" placeholder="e.g. Supermove"></div>
          <div class="field"><label>Date applied</label><input type="date" id="b-date"></div>
          <div class="field"><label>Role type</label>
            <select id="b-type"><option>Implementation</option><option>Customer Success</option><option>Sales</option><option>Product</option><option>Engineering</option><option>Other</option></select>
          </div>
          <div class="field"><label>CV version used</label>
            <select id="b-cv"><option>General</option><option>Implementation-focused</option><option>SaaS-focused</option><option>Custom</option></select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="Board.closeModal()">Cancel</button>
            <button class="btn" onclick="Board.add()">Add</button>
          </div>
        </div>
      </div>`;
    this.render();
  },

  render() { this.renderStats(); this.renderKanban(); },

  renderStats() {
    const s = Data.stats();
    document.getElementById('b-stats').innerHTML = `
      <div class="stat"><div class="stat-label">Total applied</div><div class="stat-val">${s.total}</div><div class="stat-sub">${s.thisWeek} this week</div></div>
      <div class="stat"><div class="stat-label">Response rate</div><div class="stat-val">${s.rate}%</div><div class="stat-sub">${s.responded} responded</div></div>
      <div class="stat"><div class="stat-label">Interviews</div><div class="stat-val">${s.interviews}</div><div class="stat-sub">active</div></div>
      <div class="stat"><div class="stat-label">Avg. response</div><div class="stat-val">${s.avgR ? s.avgR + 'd' : '—'}</div><div class="stat-sub">${s.avgR ? 'days to hear back' : 'no data yet'}</div></div>`;
  },

  renderKanban() {
    const kb = document.getElementById('b-kanban'); kb.innerHTML = '';
    this.COLS.forEach(col => {
      const cards = Data.jobs.filter(j => j.status === col);
      const div = document.createElement('div');
      div.className = 'col'; div.dataset.col = col;
      div.innerHTML = `<div class="col-header"><span class="col-title" style="color:${this.COLORS[col]}">${col}</span><span class="col-count">${cards.length}</span></div>`;
      cards.forEach(j => {
        const card = document.createElement('div');
        card.className = 'jcard'; card.draggable = true; card.dataset.id = j.id;
        card.innerHTML = `
          <div class="jcard-role">${j.role}</div>
          <div class="jcard-co">${j.co}</div>
          <div class="jcard-footer">
            <span class="jcard-date">${Data.fmt(j.date)}</span>
            <span class="cv-badge">${j.cv || 'General'}</span>
            <button class="jcard-del" onclick="Board.del(${j.id},event)">×</button>
          </div>`;
        card.addEventListener('dragstart', e => { this.drag = j.id; e.dataTransfer.effectAllowed = 'move'; });
        card.addEventListener('dragend', () => { this.drag = null; });
        div.appendChild(card);
      });
      div.addEventListener('dragover', e => { e.preventDefault(); div.classList.add('drag-over'); });
      div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
      div.addEventListener('drop', e => {
        e.preventDefault(); div.classList.remove('drag-over');
        if (this.drag != null) { Data.updateStatus(this.drag, col); this.render(); }
      });
      kb.appendChild(div);
    });
  },

  openModal() { document.getElementById('b-date').value = new Date().toISOString().slice(0, 10); document.getElementById('b-modal').classList.add('open'); },
  closeModal() { document.getElementById('b-modal').classList.remove('open'); },

  add() {
    const role = document.getElementById('b-role').value.trim();
    const co = document.getElementById('b-co').value.trim();
    if (!role || !co) return;
    Data.add({ role, co, date: document.getElementById('b-date').value || new Date().toISOString().slice(0, 10), type: document.getElementById('b-type').value, cv: document.getElementById('b-cv').value, status: 'Applied' });
    document.getElementById('b-role').value = ''; document.getElementById('b-co').value = '';
    this.closeModal(); this.render();
  },

  del(id, e) { e.stopPropagation(); Data.remove(id); this.render(); }
};
