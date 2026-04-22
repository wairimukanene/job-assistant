// digest.js — AI weekly digest
const Digest = {
  init() {
    document.getElementById('page-digest').innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Weekly Digest</h1>
        <button class="btn" onclick="Digest.generate()">Generate</button>
      </div>
      <div class="card">
        <div id="d-content" style="font-size:13px;color:var(--text3);padding:0.5rem 0">
          Click Generate to get your personalised weekly summary and action plan.
        </div>
      </div>`;
  },

  async generate() {
    const el = document.getElementById('d-content');
    el.innerHTML = '<span class="spinner"></span> Generating your weekly digest...';
    const s = Data.stats();
    const { cv, cvr } = Data.cvStats();
    const thisWeek = Data.jobs.filter(j => (new Date() - new Date(j.date)) / 864e5 <= 7);
    const interviews = Data.jobs.filter(j => j.status === 'Interview');
    const offers = Data.jobs.filter(j => j.status === 'Offer');
    const bestCV = Object.keys(cv).sort((a, b) => ((cvr[b] || 0) / cv[b]) - ((cvr[a] || 0) / cv[a]))[0];

    const prompt = `You are a career coach writing a weekly job search digest. Be direct, warm, and actionable. Plain text only, no markdown.

Data:
- Total applications: ${s.total}
- Applied this week: ${thisWeek.length} (${thisWeek.map(j => j.role + ' at ' + j.co).join(', ') || 'none'})
- Active interviews: ${interviews.map(j => j.role + ' at ' + j.co).join(', ') || 'none'}
- Offers: ${offers.map(j => j.role + ' at ' + j.co).join(', ') || 'none'}
- Response rate: ${s.rate}%
- Best CV version: ${bestCV} (${Math.round(((cvr[bestCV] || 0) / cv[bestCV]) * 100)}% response rate)

Write a digest with these 4 labelled sections:
1. This week's summary (2-3 sentences)
2. What's working (1-2 specific observations)
3. What to improve (1-2 concrete action items)
4. Focus for next week (3 specific actions)

Under 250 words. Be specific to the data.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const detail = (data.error && (data.error.message || data.error.type)) || res.statusText || 'Request failed';
        el.innerHTML =
          '<div style="color:var(--red);font-size:13px">Could not generate digest. Check js/secrets.local.js and billing. ' +
          detail +
          '</div>';
        return;
      }
      const blocks = Array.isArray(data.content) ? data.content : [];
      const text = blocks
        .filter(function (b) {
          return b.type === 'text' && typeof b.text === 'string';
        })
        .map(function (b) {
          return b.text;
        })
        .join('');
      if (!text.trim()) {
        el.innerHTML =
          '<div style="color:var(--red);font-size:13px">Empty response from the model. Try again in a moment.</div>';
        return;
      }
      el.innerHTML = `<div class="digest-box">${text}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:8px">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>`;
    } catch (e) {
      el.innerHTML =
        '<div style="color:var(--red);font-size:13px">Could not generate digest. Check js/secrets.local.js and your network.</div>';
    }
  }
};
