// cvtracker.js — CV version performance tracker
const CVTracker = {
  init() {
    document.getElementById('page-cvtracker').innerHTML = `
      <div class="page-header"><h1 class="page-title">CV Tracker</h1></div>
      <div class="card">
        <div class="card-title">CV version performance</div>
        <table class="cv-table">
          <thead><tr><th>CV version</th><th>Used</th><th>Responses</th><th>Rate</th><th>Best role type</th></tr></thead>
          <tbody id="cv-tbody"></tbody>
        </table>
      </div>
      <div class="card"><div class="card-title">Time to response by company</div><div id="cv-ttresponse"></div></div>
      <div class="card"><div class="card-title">What to improve</div><div id="cv-improve"></div></div>`;
    this.render();
  },

  render() {
    const { cv, cvr, cvtype } = Data.cvStats();
    document.getElementById('cv-tbody').innerHTML = Object.keys(cv).map(v => {
      const used = cv[v], responded = cvr[v] || 0, rate = Math.round(responded / used * 100);
      const best = Object.keys(cvtype[v] || {}).sort((a, b) => (cvtype[v][b] || 0) - (cvtype[v][a] || 0))[0];
      const [bg, fg] = rate >= 40 ? ['#EAF3DE', '#27500A'] : rate >= 20 ? ['#FAEEDA', '#633806'] : ['#FCEBEB', '#791F1F'];
      return `<tr>
        <td style="font-weight:600">${v}</td><td>${used}</td><td>${responded}</td>
        <td><span class="rate-pill" style="background:${bg};color:${fg}">${rate}%</span></td>
        <td style="color:var(--text2)">${best || '—'}</td></tr>`;
    }).join('');

    const rd = Data.jobs.filter(j => j.responseDay);
    const rdMax = Math.max(...rd.map(j => j.responseDay), 1);
    document.getElementById('cv-ttresponse').innerHTML = rd.length
      ? rd.map(j => `<div class="bar-row"><span class="bar-name">${j.co}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.round(j.responseDay / rdMax * 100)}%;background:var(--blue)"></div></div>
          <span class="bar-val">${j.responseDay}d</span></div>`).join('')
      : '<div style="font-size:13px;color:var(--text3);padding:8px 0">No response data yet. Update job statuses as you hear back.</div>';

    const improve = [];
    const { cv: cv2, cvr: cvr2 } = Data.cvStats();
    const old = Data.jobs.filter(j => j.status === 'Applied' && (new Date() - new Date(j.date)) / 864e5 > 21);
    if (old.length) improve.push({ t: 'warn', m: `${old.length} application${old.length > 1 ? 's' : ''} with no response after 21+ days. Consider these inactive.` });
    const worst = Object.keys(cv2).filter(v => cv2[v] >= 2).sort((a, b) => ((cvr2[a] || 0) / cv2[a]) - ((cvr2[b] || 0) / cv2[b]))[0];
    if (worst && cv2[worst] >= 2) { const r = Math.round(((cvr2[worst] || 0) / cv2[worst]) * 100); improve.push({ t: 'warn', m: `"${worst}" CV has a ${r}% response rate. Consider retiring it.` }); }
    if (!improve.length) improve.push({ t: 'good', m: 'No major issues. Keep tracking — intelligence improves with more data.' });
    document.getElementById('cv-improve').innerHTML = improve.map(i => `<div class="insight ${i.t}">${i.m}</div>`).join('');
  }
};
