// discovery.js — Phase 4 v1: job search + match scoring + save
const Discovery = {
  results: [],
  queryTitle: '',
  includeIneligible: false,
  MAX_RESULTS: 60,
  QUERY_EXPANSIONS: {
    implementation: ['implementation', 'onboarding', 'integration', 'solutions', 'deployment'],
  },

  init() {
    const el = document.getElementById('page-discovery');
    el.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Job Discovery</h1>
      </div>
      <div class="card">
        <div class="discovery-grid">
          <div>
            <label>Role title</label>
            <input id="d-title" type="text" placeholder="e.g. Implementation Engineer" />
          </div>
          <div>
            <label>Location</label>
            <input id="d-location" type="text" placeholder="e.g. Nairobi, Kenya or Remote" />
          </div>
          <div class="discovery-actions">
            <button class="btn" type="button" onclick="Discovery.search()">Search roles</button>
          </div>
        </div>
        <div class="discovery-filter-row">
          <label class="discovery-check">
            <input id="d-include-ineligible" type="checkbox" onchange="Discovery.toggleEligibilityFilter(this.checked)" />
            Include roles that are likely not eligible from Africa
          </label>
        </div>
        <div class="gen-help">Results are aggregated from multiple job boards and matched against your saved CV text.</div>
      </div>
      <div id="d-results"></div>
    `;
  },

  toggleEligibilityFilter(checked) {
    this.includeIneligible = !!checked;
    this.render();
  },

  cvTokens() {
    const cv = (Data.cvText || '').toLowerCase();
    return new Set(
      cv
        .split(/[^a-z0-9+#.]+/)
        .filter(function (w) {
          return w.length > 2;
        })
    );
  },

  scoreJob(job) {
    const cv = this.cvTokens();
    if (!cv.size) return 50;
    const text = (job.title + ' ' + job.company + ' ' + (job.description || '')).toLowerCase();
    const words = text.split(/[^a-z0-9+#.]+/).filter(function (w) { return w.length > 2; });
    let matches = 0;
    for (let i = 0; i < words.length; i++) {
      if (cv.has(words[i])) matches++;
    }
    const raw = Math.min(100, Math.round((matches / Math.max(30, words.length)) * 1200));
    return Math.max(0, raw);
  },

  titleTokens() {
    return new Set(
      (this.queryTitle || '')
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .map((w) => this.normalizeToken(w))
        .filter(function (w) { return w.length > 2; })
    );
  },

  normalizeToken(token) {
    if (!token) return '';
    var t = token.toLowerCase().trim();
    if (t.length > 5 && t.endsWith('ing')) t = t.slice(0, -3);
    else if (t.length > 4 && t.endsWith('ers')) t = t.slice(0, -1);
    else if (t.length > 4 && t.endsWith('ed')) t = t.slice(0, -2);
    else if (t.length > 3 && t.endsWith('s')) t = t.slice(0, -1);
    return t;
  },

  expandedQueryTerms() {
    const out = new Set();
    this.titleTokens().forEach((token) => {
      const variants = this.QUERY_EXPANSIONS[token] || [token];
      variants.forEach((v) => out.add(this.normalizeToken(v)));
    });
    return out;
  },

  tokenSet(text) {
    return new Set(
      (text || '')
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .map((w) => this.normalizeToken(w))
        .filter(function (w) {
          return w.length > 2;
        })
    );
  },

  titleRelevance(job) {
    const q = this.titleTokens();
    if (!q.size) return 100;
    const title = (job.title || '').toLowerCase();
    const titleTokens = this.tokenSet(job.title || '');
    const descTokens = this.tokenSet(job.description || '');
    const companyTokens = this.tokenSet(job.company || '');
    let titleHit = 0;
    let anyHit = 0;
    q.forEach((token) => {
      if (titleTokens.has(token)) titleHit++;
      if (titleTokens.has(token) || descTokens.has(token) || companyTokens.has(token)) anyHit++;
    });
    const base = Math.round((anyHit / q.size) * 100);
    const titleBoost = Math.round((titleHit / q.size) * 35);
    const phrase = (this.queryTitle || '').toLowerCase().trim();
    const phraseBoost = phrase && title.includes(phrase) ? 20 : 0;
    return Math.min(100, base + titleBoost + phraseBoost);
  },

  titleTokenHits(job) {
    const q = this.expandedQueryTerms();
    if (!q.size) return 0;
    const titleTokens = this.tokenSet(job.title || '');
    let hits = 0;
    q.forEach((token) => {
      if (titleTokens.has(token)) hits++;
    });
    return hits;
  },

  companyTokenHits(job) {
    const q = this.expandedQueryTerms();
    if (!q.size) return 0;
    const companyTokens = this.tokenSet(job.company || '');
    let hits = 0;
    q.forEach((token) => {
      if (companyTokens.has(token)) hits++;
    });
    return hits;
  },

  combinedScore(job) {
    if (typeof job.fitScore === 'number') return job.fitScore;
    const t = this.titleRelevance(job);
    const c = this.scoreJob(job);
    // Role intent first; CV alignment is a mild secondary signal.
    return Math.round(t * 0.9 + c * 0.1);
  },

  isRelevant(job) {
    if (typeof job.fitScore === 'number') return job.fitScore >= 30;
    const t = this.titleRelevance(job);
    const titleHits = this.titleTokenHits(job);
    const companyHits = this.companyTokenHits(job);
    const qCount = this.titleTokens().size;
    const phrase = (this.queryTitle || '').toLowerCase().trim();
    const title = (job.title || '').toLowerCase();
    const phraseHit = phrase && title.includes(phrase);
    // For multi-word queries, require strong title intent (both/most terms).
    if (qCount >= 2) return (titleHits >= 1 || phraseHit) && t >= 45;
    // Single-word queries can pass with one strong hit.
    return (titleHits >= 1 || companyHits >= 1) && t >= 40;
  },

  render() {
    const container = document.getElementById('d-results');
    const items = this.visibleResults();
    if (!items.length && this.results.length && !this.includeIneligible) {
      container.innerHTML =
        '<div class="card"><div style="font-size:13px;color:var(--text3);margin-bottom:8px">Matches exist, but all are flagged as likely not eligible from Africa.</div><button class="btn-sm" type="button" onclick="Discovery.showIneligible()">Show those roles</button></div>';
      return;
    }
    if (!items.length) {
      container.innerHTML = '<div class="card"><div style="font-size:13px;color:var(--text3)">No close matches found yet. Try adding location or a slightly broader role title.</div></div>';
      return;
    }
    container.innerHTML = items
      .map((job, idx) => {
        const score = this.combinedScore(job);
        return `
          <div class="card d-job">
            <div class="d-job-head">
              <div>
                <div class="d-job-title">${job.title}</div>
                <div class="d-job-meta">${job.company} · ${job.location || 'Location not specified'} · ${job.source || 'Source unknown'}</div>
              </div>
              <div class="d-score">${score}% match</div>
            </div>
            <div class="d-elig ${job.eligibility?.status || 'maybe'}" title="${job.eligibility?.reason || ''}">
              ${(job.eligibility && job.eligibility.label) || 'Eligibility unknown'}
            </div>
            <div class="d-desc">${(job.description || '').slice(0, 280)}${(job.description || '').length > 280 ? '…' : ''}</div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <a class="btn-sm" href="${job.url}" target="_blank" rel="noopener noreferrer">Open role</a>
              <button class="btn-sm" type="button" onclick="Discovery.saveById('${encodeURIComponent(job.url || job.title || '')}')">Save to board</button>
            </div>
          </div>
        `;
      })
      .join('');
  },

  async search() {
    const title = (document.getElementById('d-title').value || '').trim();
    this.queryTitle = title;
    const location = (document.getElementById('d-location').value || '').trim();
    const container = document.getElementById('d-results');
    container.innerHTML = '<div class="card"><span class="spinner"></span> Searching job boards…</div>';
    try {
      const q = new URLSearchParams({ title: title, location: location }).toString();
      const res = await fetch('/api/jobs/search?' + q);
      const data = await res.json();
      if (!res.ok || data.error) {
        container.innerHTML = '<div class="card"><div style="color:var(--red)">Could not fetch jobs right now. Try again.</div></div>';
        return;
      }
      const incoming = Array.isArray(data.jobs) ? data.jobs : [];
      const uniq = [];
      const seen = new Set();
      incoming.forEach((j) => {
        const key = `${(j.url || '').toLowerCase()}|${(j.title || '').toLowerCase()}|${(j.company || '').toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        uniq.push(j);
      });
      const ranked = uniq
        .sort((a, b) => this.combinedScore(b) - this.combinedScore(a));
      const strict = ranked
        .filter((j) => this.isRelevant(j))
        .slice(0, this.MAX_RESULTS);
      this.results = strict;
      this.render();
    } catch (e) {
      container.innerHTML = '<div class="card"><div style="color:var(--red)">Network error while searching jobs.</div></div>';
    }
  },

  save(idx) {
    const job = this.results[idx];
    if (!job) return;
    Data.add({
      role: job.title || 'Untitled role',
      co: job.company || 'Unknown company',
      date: new Date().toISOString().slice(0, 10),
      type: 'Other',
      status: 'Applied',
      cv: 'Custom',
    });
    alert('Saved to board: ' + (job.title || 'Role') + ' at ' + (job.company || 'Company'));
  },

  saveById(id) {
    const decoded = decodeURIComponent(id);
    const job = this.results.find((j) => (j.url || j.title || '') === decoded);
    if (!job) return;
    Data.add({
      role: job.title || 'Untitled role',
      co: job.company || 'Unknown company',
      date: new Date().toISOString().slice(0, 10),
      type: 'Other',
      status: 'Applied',
      cv: 'Custom',
    });
    alert('Saved to board: ' + (job.title || 'Role') + ' at ' + (job.company || 'Company'));
  },

  visibleResults() {
    if (this.includeIneligible) return this.results;
    return this.results.filter((j) => (j.eligibility?.status || 'maybe') !== 'ineligible');
  },

  showIneligible() {
    this.includeIneligible = true;
    const cb = document.getElementById('d-include-ineligible');
    if (cb) cb.checked = true;
    this.render();
  },
};
