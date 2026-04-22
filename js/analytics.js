// analytics.js — Analytics dashboard
const Analytics = {
  init() {
    document.getElementById('page-analytics').innerHTML = `
      <div class="page-header"><h1 class="page-title">Analytics</h1></div>
      <div class="stats-grid" id="a-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="card"><div class="card-title">Applications per week</div><div id="a-week"></div></div>
        <div class="card"><div class="card-title">Response rate by type</div><div id="a-type"></div></div>
      </div>
      <div class="card"><div class="card-title">Activity heatmap (last 84 days)</div><div class="heat-grid" id="a-heat"></div></div>
      <div class="card"><div class="card-title">Insights</div><div id="a-insights"></div></div>`;
    this.render();
  },

  render() {
    const s = Data.stats();
    document.getElementById('a-stats').innerHTML = `
      <div class="stat"><div class="stat-label">Total applied</div><div class="stat-val">${s.total}</div><div class="stat-sub">${s.thisWeek} this week</div></div>
      <div class="stat"><div class="stat-label">Response rate</div><div class="stat-val">${s.rate}%</div><div class="stat-sub">${s.responded} responded</div></div>
      <div class="stat"><div class="stat-label">Interviews</div><div class="stat-val">${s.interviews}</div><div class="stat-sub">active pipeline</div></div>
      <div class="stat"><div class="stat-label">Avg. response</div><div class="stat-val">${s.avgR ? s.avgR + 'd' : '—'}</div><div class="stat-sub">days to hear back</div></div>`;
    this.renderWeek(); this.renderType(); this.renderHeat(); this.renderInsights();
  },

  renderWeek() {
    const weeks = {};
    Data.jobs.forEach(j => { const k = Data.weekKey(new Date(j.date)); weeks[k] = (weeks[k] || 0) + 1; });
    const wks = Object.keys(weeks).sort().slice(-8);
    const max = Math.max(...wks.map(k => weeks[k]), 1);
    document.getElementById('a-week').innerHTML = wks.map(k => `
      <div class="bar-row"><span class="bar-name">${k}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(weeks[k] / max * 100)}%"></div></div>
      <span class="bar-val">${weeks[k]}</span></div>`).join('') || '<div style="font-size:13px;color:var(--text3);padding:8px 0">No data yet.</div>';
  },

  renderType() {
    const types = {}, resp = {};
    Data.jobs.forEach(j => { types[j.type] = (types[j.type] || 0) + 1; if (j.status !== 'Applied') resp[j.type] = (resp[j.type] || 0) + 1; });
    const sorted = Object.keys(types).sort((a, b) => types[b] - types[a]);
    document.getElementById('a-type').innerHTML = sorted.map(t => {
      const r = Math.round(((resp[t] || 0) / types[t]) * 100);
      const c = r >= 40 ? 'var(--green)' : r >= 20 ? 'var(--amber)' : 'var(--red)';
      return `<div class="bar-row"><span class="bar-name">${t}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${r}%;background:${c}"></div></div>
        <span class="bar-val">${r}%</span></div>`;
    }).join('') || '<div style="font-size:13px;color:var(--text3);padding:8px 0">No data yet.</div>';
  },

  renderHeat() {
    const counts = {};
    Data.jobs.forEach(j => { counts[j.date] = (counts[j.date] || 0) + 1; });
    const today = new Date(); const cells = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10); const n = counts[k] || 0;
      cells.push(`<div class="heat-cell${n >= 3 ? ' l4' : n === 2 ? ' l3' : n === 1 ? ' l2' : ''}" title="${k}: ${n} apps"></div>`);
    }
    document.getElementById('a-heat').innerHTML = cells.join('');
  },

  renderInsights() {
    const ins = [];
    const s = Data.stats();
    if (!s.total) { ins.push({ t: 'info', m: 'Add your first application to see insights.' }); }
    else {
      ins.push({ t: s.rate >= 25 ? 'good' : s.rate >= 12 ? 'warn' : 'info', m: `Overall response rate: ${s.rate}%. ${s.rate >= 25 ? 'Above average — strong performance.' : s.rate >= 12 ? 'Around market average. Try tailoring CVs more closely to each JD.' : 'Below average. Use the CV Tailor to score roles before applying.'}` });
      const { cv, cvr } = Data.cvStats();
      const best = Object.keys(cv).filter(v => cv[v] >= 2).sort((a, b) => ((cvr[b] || 0) / cv[b]) - ((cvr[a] || 0) / cv[a]))[0];
      if (best) { const r = Math.round(((cvr[best] || 0) / cv[best]) * 100); ins.push({ t: 'good', m: `Your "${best}" CV version has a ${r}% response rate — your strongest performer.` }); }
      ins.push({ t: s.thisWeek >= 5 ? 'good' : s.thisWeek >= 2 ? 'warn' : 'info', m: `${s.thisWeek} application${s.thisWeek !== 1 ? 's' : ''} this week. ${s.thisWeek >= 5 ? 'Good pace.' : 'Aim for 5–7 targeted applications weekly.'}` });
    }
    document.getElementById('a-insights').innerHTML = ins.map(i => `<div class="insight ${i.t}">${i.m}</div>`).join('');
  }
};
