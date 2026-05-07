const AutoApply = {
  init() {
    const el = document.getElementById('page-autoapply');
    el.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Auto-Apply</h1>
      </div>
      <div class="card">
        <div class="card-title">Review queue (manual approval required)</div>
        <div class="gen-help">Nothing is submitted automatically. Every auto-fill draft must be approved by you first.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <button class="btn-sm" type="button" onclick="AutoApply.syncFromBridge()">Sync extension drafts</button>
        </div>
        <div id="aa-queue"></div>
      </div>
      <div class="card">
        <div class="card-title">Import draft from browser extension</div>
        <label>Paste draft JSON from extension</label>
        <textarea id="aa-import" style="min-height:140px" placeholder='{"role":"Support Engineer","co":"Supabase","type":"Engineering","sourceUrl":"https://...","fields":[{"name":"email","value":"..."}]}'></textarea>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn-sm" type="button" onclick="AutoApply.importDraft()">Add to review queue</button>
        </div>
      </div>
    `;
    this.renderQueue();
    this.syncFromBridge();
  },

  async syncFromBridge() {
    try {
      const res = await fetch('/api/autoapply/queue', { cache: 'no-store' });
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) return;
      items.forEach((obj) => {
        Data.enqueueAutoApply({
          role: obj.role || '',
          co: obj.co || '',
          type: obj.type || 'Other',
          sourceUrl: obj.sourceUrl || '',
          fields: Array.isArray(obj.fields) ? obj.fields : [],
        });
      });
      this.renderQueue();
    } catch (e) {
      // best-effort sync only
    }
  },

  renderQueue() {
    const wrap = document.getElementById('aa-queue');
    const items = (Data.autoQueue || []);
    if (!items.length) {
      wrap.innerHTML = '<div class="empty-text">No auto-fill drafts yet. Capture one from the extension and import it here.</div>';
      return;
    }
    wrap.innerHTML = items
      .map((q) => {
        const fields = Array.isArray(q.fields) ? q.fields : [];
        const preview = fields.slice(0, 6).map((f) => `${f.name}: ${String(f.value || '').slice(0, 60)}`).join(' | ');
        const status = q.status || 'pending';
        return `
          <div class="aa-item">
            <div class="aa-head">
              <div>
                <div class="d-job-title">${q.role || 'Untitled role'} · ${q.co || 'Unknown company'}</div>
                <div class="d-job-meta">${q.sourceUrl || 'No source URL'} · ${new Date(q.createdAt).toLocaleString()}</div>
              </div>
              <div class="aa-status aa-${status}">${status}</div>
            </div>
            <div class="d-desc">${preview || 'No mapped fields captured.'}</div>
            ${
              status === 'pending'
                ? `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                    <button class="btn-sm" type="button" onclick="AutoApply.approve(${q.id})">Approve and add to board</button>
                    <button class="btn-sm" type="button" onclick="AutoApply.reject(${q.id})">Reject</button>
                  </div>`
                : ''
            }
          </div>
        `;
      })
      .join('');
  },

  importDraft() {
    const raw = (document.getElementById('aa-import').value || '').trim();
    if (!raw) return;
    try {
      const obj = JSON.parse(raw);
      Data.enqueueAutoApply({
        role: obj.role || '',
        co: obj.co || '',
        type: obj.type || 'Other',
        sourceUrl: obj.sourceUrl || '',
        fields: Array.isArray(obj.fields) ? obj.fields : [],
      });
      document.getElementById('aa-import').value = '';
      this.renderQueue();
      alert('Draft added to review queue.');
    } catch (e) {
      alert('Invalid JSON draft. Please paste a valid payload from extension.');
    }
  },

  approve(id) {
    const q = (Data.autoQueue || []).find((x) => x.id === id);
    if (!q) return;
    Data.approveAutoApply(id, {
      role: q.role,
      co: q.co,
      type: q.type || 'Other',
      cv: 'Custom',
    });
    this.renderQueue();
    Board.render();
    alert('Approved. Added to board as auto-filled application.');
  },

  reject(id) {
    const reason = prompt('Optional reason for rejection:', '') || '';
    Data.rejectAutoApply(id, reason);
    this.renderQueue();
  },
};
