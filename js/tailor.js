// tailor.js — Phase 1: CV tailor + cover letter generator
const Tailor = {
  step: 1,
  activeTab: 'paste',
  jdText: '',
  results: {},
  activeResult: '',

  init() {
    const el = document.getElementById('page-tailor');
    el.innerHTML = `
      <div class="page-header"><h1 class="page-title">CV Tailor</h1></div>
      <div class="steps">
        <div class="step active" id="ts1"><span class="step-num">1</span> Your CV</div>
        <div class="step-div"></div>
        <div class="step" id="ts2"><span class="step-num">2</span> Add Job</div>
        <div class="step-div"></div>
        <div class="step" id="ts3"><span class="step-num">3</span> Results</div>
      </div>
      <div id="t-page1">${this.renderStep1()}</div>
      <div id="t-page2" class="hidden">${this.renderStep2()}</div>
      <div id="t-page3" class="hidden">${this.renderStep3()}</div>
    `;
    this.bindStep1();
    if (Data.cvText) {
      document.getElementById('t-cv-text').value = Data.cvText;
      document.getElementById('t-btn1').disabled = false;
    }
  },

  renderStep1() {
    return `
      <div class="card">
        <div class="card-title">Upload or paste your CV</div>
        <div class="upload-zone" id="t-upload-zone" onclick="document.getElementById('t-cv-file').click()">
          <div style="font-size:28px;margin-bottom:8px">📄</div>
          <div style="font-size:14px;color:var(--text2)">Click to upload CV (PDF, TXT, DOCX)</div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">or paste below</div>
          <div style="font-size:11px;color:var(--amber);margin-top:8px;line-height:1.4">Tip: paste <strong>plain text</strong> for accurate tailoring. PDF/DOCX “upload” here only reads raw file bytes as text — use copy‑paste from your CV for best results.</div>
          <div id="t-upload-name" style="font-size:13px;color:var(--green);font-weight:600;margin-top:6px"></div>
        </div>
        <input type="file" id="t-cv-file" accept=".pdf,.doc,.docx,.txt" style="display:none">
        <div style="margin-top:12px">
          <label>Or paste your CV text</label>
          <textarea id="t-cv-text" placeholder="Paste your full CV here..." style="min-height:160px" oninput="Tailor.checkStep1()"></textarea>
        </div>
      </div>
      <button class="btn btn-full" id="t-btn1" onclick="Tailor.goTo(2)" disabled>Continue →</button>
    `;
  },

  renderStep2() {
    return `
      <button class="btn-sm" onclick="Tailor.goTo(1)" style="margin-bottom:1rem">← Back</button>
      <div class="card">
        <div class="card-title">Add the job</div>
        <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:6px;overflow:hidden;margin-bottom:1rem">
          <button class="rtab on" id="t-tab-paste" onclick="Tailor.switchTab('paste')" style="flex:1;border:none;border-radius:0;padding:8px">Paste description</button>
          <button class="rtab" id="t-tab-url" onclick="Tailor.switchTab('url')" style="flex:1;border:none;border-right:none;border-left:1px solid var(--border);border-radius:0;padding:8px">Job URL</button>
        </div>
        <div id="t-input-paste">
          <label>Paste the full job description</label>
          <textarea id="t-jd-text" placeholder="Paste job description here..." style="min-height:180px" oninput="Tailor.checkStep2()"></textarea>
        </div>
        <div id="t-input-url" class="hidden">
          <label>Job posting URL</label>
          <input type="url" id="t-jd-url" placeholder="https://company.com/jobs/..." oninput="Tailor.checkStep2()">
        </div>
      </div>
      <div class="card">
        <div class="card-title">What to generate</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
          <label class="rtab tailor-pill on" id="t-p-cv" style="cursor:pointer" onclick="Tailor.togglePill(event,'t-p-cv')"><input type="checkbox" checked class="tailor-pill-cb" tabindex="-1" aria-hidden="true"> Tailored CV</label>
          <label class="rtab tailor-pill on" id="t-p-cl" style="cursor:pointer" onclick="Tailor.togglePill(event,'t-p-cl')"><input type="checkbox" checked class="tailor-pill-cb" tabindex="-1" aria-hidden="true"> Cover letter</label>
          <label class="rtab tailor-pill on" id="t-p-qa" style="cursor:pointer" onclick="Tailor.togglePill(event,'t-p-qa')"><input type="checkbox" checked class="tailor-pill-cb" tabindex="-1" aria-hidden="true"> Application Q&A</label>
          <label class="rtab tailor-pill on" id="t-p-fit" style="cursor:pointer" onclick="Tailor.togglePill(event,'t-p-fit')"><input type="checkbox" checked class="tailor-pill-cb" tabindex="-1" aria-hidden="true"> Fit analysis</label>
        </div>
      </div>
      <button class="btn btn-full" id="t-btn2" onclick="Tailor.run()" disabled>Generate ✦</button>
    `;
  },

  renderStep3() {
    return `
      <button class="btn-sm" onclick="Tailor.goTo(2)" style="margin-bottom:1rem">← Back</button>
      <div id="t-loading" class="card" style="text-align:center;padding:2rem">
        <div class="spinner" id="t-load-spin"></div>
        <div id="t-load-msg" style="font-size:14px;color:var(--text2);margin-top:4px">Analysing job description...</div>
        <div id="t-load-actions" class="hidden" style="margin-top:14px">
          <button type="button" class="btn btn-full" onclick="Tailor.goTo(2)">← Back to job</button>
        </div>
      </div>
      <div id="t-results" class="hidden">
        <div class="card" id="t-fit-card" style="display:none">
          <div class="card-title">Fit analysis</div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
            <span>Match score</span><span id="t-fit-pct" style="font-weight:700">—</span>
          </div>
          <div style="height:8px;background:var(--surface2);border-radius:4px;overflow:hidden;margin-bottom:12px">
            <div id="t-fit-fill" style="height:100%;background:var(--accent);border-radius:4px;width:0%;transition:width 0.7s ease"></div>
          </div>
          <div id="t-gap-list"></div>
          <div id="t-gap-close-wrap" class="hidden" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text)">Closing the gaps</div>
            <div id="t-gap-close-list" style="font-size:13px;line-height:1.65"></div>
          </div>
        </div>
        <div class="card">
          <div class="rtabs" id="t-rtabs"></div>
          <div class="result-body" id="t-rbody"></div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn-sm" onclick="Tailor.copy()">Copy</button>
            <button class="btn-sm" onclick="Tailor.goTo(2)">New application</button>
            <button class="btn-sm" onclick="Tailor.saveAndTrack()">Save + add to tracker</button>
          </div>
        </div>
      </div>
    `;
  },

  bindStep1() {
    document.getElementById('t-cv-file').addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      document.getElementById('t-upload-name').textContent = '✓ ' + file.name;
      document.getElementById('t-upload-zone').classList.add('has-file');
      const r = new FileReader();
      r.onload = ev => { Data.saveCV(ev.target.result); document.getElementById('t-cv-text').value = ev.target.result; this.checkStep1(); };
      r.readAsText(file);
    });
  },

  checkStep1() {
    const text = document.getElementById('t-cv-text').value;
    if (text.trim().length > 50) Data.saveCV(text);
    document.getElementById('t-btn1').disabled = Data.cvText.trim().length < 50;
  },

  checkStep2() {
    const paste = document.getElementById('t-jd-text')?.value.trim().length > 50;
    const url = document.getElementById('t-jd-url')?.value.trim().length > 8;
    const ok = this.activeTab === 'paste' ? paste : url;
    document.getElementById('t-btn2').disabled = !ok;
  },

  switchTab(t) {
    this.activeTab = t;
    document.getElementById('t-tab-paste').classList.toggle('on', t === 'paste');
    document.getElementById('t-tab-url').classList.toggle('on', t === 'url');
    document.getElementById('t-input-paste').classList.toggle('hidden', t !== 'paste');
    document.getElementById('t-input-url').classList.toggle('hidden', t !== 'url');
    this.checkStep2();
  },

  togglePill(ev, id) {
    ev.preventDefault();
    const label = document.getElementById(id);
    const cb = label.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
    label.classList.toggle('on', cb.checked);
  },

  goTo(n) {
    this.step = n;
    [1,2,3].forEach(i => {
      document.getElementById('t-page' + i).classList.toggle('hidden', i !== n);
      const s = document.getElementById('ts' + i);
      s.className = 'step' + (i < n ? ' done' : i === n ? ' active' : '');
    });
  },

  CV_CONTEXT_CHARS: 14000,
  JD_CONTEXT_CHARS: 12000,

  /** Anthropic Messages API: collect plain text from content blocks. */
  anthropicText(data) {
    if (!data || !Array.isArray(data.content)) return '';
    return data.content
      .filter(function (b) { return b.type === 'text' && typeof b.text === 'string'; })
      .map(function (b) { return b.text; })
      .join('');
  },

  /** CV slice + flags when input is unusable for grounding. */
  cvForPrompt() {
    const raw = (Data.cvText || '').trim();
    if (!raw.length) {
      return { text: '(No CV text provided.)', pdfBinary: false, truncated: false };
    }
    const pdfBinary = raw.slice(0, 4) === '%PDF';
    const max = this.CV_CONTEXT_CHARS;
    let text = raw;
    let truncated = false;
    if (text.length > max) {
      text =
        text.slice(0, max) +
        '\n\n[--- CV text was truncated here for API size; paste full plain-text CV for complete coverage ---]\n';
      truncated = true;
    }
    return { text: text, pdfBinary: pdfBinary, truncated: truncated };
  },

  tailorSystemPrompt() {
    return [
      'You are an expert CV editor and career coach. You ONLY use facts stated in the CV text and job description supplied in the user message.',
      '',
      'Grounding (non-negotiable):',
      '- Never invent employers, job titles, dates, degrees, certifications, tools, stacks, or numeric results that are not clearly supported by the CV.',
      '- Forbidden: placeholder metrics or template slots such as [X], [Y], [Z], <n>, TBD, "N/A" as filler for numbers, or any bracketed dummy values. If the CV gives no number, write the achievement qualitatively with no fabricated quantity, or omit that metric entirely.',
      '- Do not claim PostgreSQL, Linux/Unix CLI, GitHub Issues, specific JS frameworks (React, Vue, Svelte), Node.js, ticket volumes, CSAT, SLA times, team sizes, or "years of experience" unless the CV explicitly supports it (same product names or unambiguous equivalents only).',
      '- Tailored CV: retarget wording and emphasis toward the job description while keeping every claim defensible from the CV. Prefer honest generalisation ("SQL experience" only if SQL appears) over implying tools not named.',
      '- Fit analysis: fit_score must reflect how well the CV *as given* evidences the JD (not hypothetical potential). Penalise heavily if the CV is empty, truncated, or unreadable (e.g. raw PDF binary).',
      '- fit_strengths: each line starts with "+ " and must reflect what the CV actually states (skills, domains, role types). No wishful alignment.',
      '- fit_gaps: each line starts with "- ". Call out JD requirements not clearly evidenced in the CV ("not evidenced in CV: …"). If input looks like PDF binary or garbled extraction, the first gap must say the CV could not be read as text and the user should paste plain text.',
      '- fit_close: follows fit_gaps. Each line starts with "- " and gives ONE honest, concrete next step to reduce a specific gap (CV bullet to add if true, LinkedIn/OSS activity, cert path, cover-letter framing, timezone availability wording). Never invent credentials the candidate already has.',
      '- tailored_cv XML must contain ONLY a full, revamped résumé draft grounded in CV facts. Include these sections in order when evidence exists: contact/header, **Professional Summary**, **Key Achievements** (5-6 bullets), **Professional Experience** (role/company/date + bullets), **Education**, and **Skills**. Do not include fit analysis, JD-mapping commentary, "+ strengths", or gap commentary inside tailored_cv — those belong only in fit_* tags.',
      '- Cover letter and application Q&A: same honesty rules; weave real CV facts; no placeholder metrics.',
      '',
      'Output: respond ONLY with the XML tag blocks requested in the user message, in the exact order given. No text outside those tags.',
    ].join('\n');
  },

  showRunError(message) {
    const spin = document.getElementById('t-load-spin');
    if (spin) spin.style.display = 'none';
    document.getElementById('t-load-msg').textContent = message;
    document.getElementById('t-load-actions').classList.remove('hidden');
  },

  resetLoadingUI() {
    const spin = document.getElementById('t-load-spin');
    if (spin) spin.style.display = '';
    document.getElementById('t-load-msg').textContent = 'Analysing job description...';
    document.getElementById('t-load-actions').classList.add('hidden');
  },

  async run() {
    this.jdText = this.activeTab === 'paste'
      ? document.getElementById('t-jd-text').value
      : 'Job URL: ' + document.getElementById('t-jd-url').value;
    this.goTo(3);
    this.resetLoadingUI();
    document.getElementById('t-loading').classList.remove('hidden');
    document.getElementById('t-results').classList.add('hidden');

    const msgs = ['Analysing job description...', 'Matching your CV...', 'Writing tailored content...', 'Finalising...'];
    let mi = 0;
    let tick = setInterval(function () {
      mi = Math.min(mi + 1, msgs.length - 1);
      document.getElementById('t-load-msg').textContent = msgs[mi];
    }, 2500);

    const checked = {
      cv:  document.querySelector('#t-p-cv input').checked,
      cl:  document.querySelector('#t-p-cl input').checked,
      qa:  document.querySelector('#t-p-qa input').checked,
      fit: document.querySelector('#t-p-fit input').checked,
    };

    if (!checked.fit && !checked.cv && !checked.cl && !checked.qa) {
      clearInterval(tick);
      this.goTo(2);
      document.getElementById('t-loading').classList.add('hidden');
      document.getElementById('t-results').classList.add('hidden');
      alert('Select at least one output (Tailored CV, Cover letter, Q&A, or Fit analysis).');
      return;
    }

    const cvPack = this.cvForPrompt();
    const jdBlock = (this.jdText || '').trim().slice(0, this.JD_CONTEXT_CHARS);
    let cvPreamble = '';
    if (cvPack.pdfBinary) {
      cvPreamble =
        '[IMPORTANT: The "CV" below begins with %PDF — it is raw PDF file bytes, not extracted readable text. You cannot infer skills from it. State this in fit_gaps; keep fit_score low; do not invent a CV — for tailored_cv/cover letter/application_qa, say briefly that plain-text CV is required, or produce only minimal honest framing.]\n\n';
    } else if (cvPack.truncated) {
      cvPreamble =
        '[Note: CV text was truncated at the end of the excerpt below — avoid over-claiming beyond what is visible.]\n\n';
    }

    const xmlBlocks = [];
    if (checked.cv) {
      xmlBlocks.push(
        `<tailored_cv>Use ONLY these sections inside this tag, in order:
1) Header/contact exactly as in CV (light cleanup allowed).
2) **Professional Summary** (4-5 sentences).
3) **Key Achievements** with exactly 5-6 bullets, each one line starting with "- ".
4) **Professional Experience** with each role as: role title | company | dates, then 2-5 grounded bullets.
5) **Education** (only what CV states).
6) **Skills** grouped briefly (only tools/skills evidenced by CV text).
Rules: no [X]/placeholder metrics; tools and numbers only if in the CV; retarget honest phrasing toward the JD; no fit-analysis commentary in this tag.</tailored_cv>`
      );
    }
    if (checked.cl) {
      xmlBlocks.push(
        `<cover_letter>3-4 paragraphs. Same grounding rules: no invented metrics or tools; tie claims to CV facts.</cover_letter>`
      );
    }
    if (checked.qa) {
      xmlBlocks.push(
        `<application_qa>2-3 likely application questions with answers grounded in the CV only. Format each as Q: then A:. No placeholder numbers.</application_qa>`
      );
    }
    if (checked.fit) {
      xmlBlocks.push(
        `<fit_score>Single integer 0-100: match quality based only on what the CV evidences vs the JD.</fit_score>
<fit_strengths>3-4 lines, each starting with "+ ", only strengths clearly supported by CV wording.</fit_strengths>
<fit_gaps>3-5 lines, each starting with "- ", including "not evidenced in CV" where the JD requires something not stated.</fit_gaps>
<fit_close>4-7 lines, each starting with "- ". Each line pairs with one gap above: a specific, honest action the candidate can take (e.g. add a GitHub Issues example if true, contribute to a small OSS discussion, clarify European hours availability in cover letter, complete a short Postgres course and list it — only suggest actions that close the gap without fabricating past experience).</fit_close>`
      );
    }

    const userPrompt = `${cvPreamble}### CV\n${cvPack.text}\n\n### JOB DESCRIPTION\n${jdBlock}\n\nGenerate ONLY the XML sections below, in this exact order (complete and close each tag before starting the next). No text outside the tags.

${xmlBlocks.join('\n\n')}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8192,
          system: this.tailorSystemPrompt(),
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        clearInterval(tick);
        this.showRunError('Something went wrong. Please try again. (Invalid response from server.)');
        return;
      }
      clearInterval(tick);

      if (!res.ok || data.error) {
        const detail =
          (data.error && (data.error.message || data.error.type)) ||
          res.statusText ||
          'Request failed';
        this.showRunError(
          'Something went wrong. Please try again. If this persists, check js/secrets.local.js and your Anthropic billing. Details: ' +
            detail
        );
        return;
      }

      const text = this.anthropicText(data);
      if (!text.trim()) {
        this.showRunError(
          'Something went wrong — empty reply from the model. Check js/secrets.local.js, then try again with fewer outputs selected.'
        );
        return;
      }

      this.showResults(text, checked);
    } catch (e) {
      clearInterval(tick);
      this.showRunError(
        'Something went wrong. Please try again. (' + (e && e.message ? e.message : 'network error') + ')'
      );
    }
  },

  getTag(text, tag) {
    const m = text.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>'));
    return m ? m[1].trim() : null;
  },

  /** Keep tailored CV intact; only strip accidentally leaked fit-analysis XML blocks. */
  sanitizeTailoredCv(s) {
    if (!s) return s;
    return s
      .replace(/<fit_score>[\s\S]*?<\/fit_score>/gi, '')
      .replace(/<fit_strengths>[\s\S]*?<\/fit_strengths>/gi, '')
      .replace(/<fit_gaps>[\s\S]*?<\/fit_gaps>/gi, '')
      .replace(/<fit_close>[\s\S]*?<\/fit_close>/gi, '')
      .trim();
  },

  showResults(text, checked) {
    this.results = {};
    const tabs = [];

    if (checked.fit) {
      const score = parseInt(this.getTag(text, 'fit_score')) || 0;
      document.getElementById('t-fit-card').style.display = 'block';
      document.getElementById('t-fit-pct').textContent = score + '%';
      document.getElementById('t-fit-fill').style.width = score + '%';
      const gl = document.getElementById('t-gap-list'); gl.innerHTML = '';
      (this.getTag(text,'fit_strengths')||'').split('\n').filter(l=>l.trim()).forEach(l => {
        gl.innerHTML += `<div class="insight good" style="margin-bottom:6px">${l.replace(/^\+\s*/,'')}</div>`;
      });
      (this.getTag(text,'fit_gaps')||'').split('\n').filter(l=>l.trim()).forEach(l => {
        gl.innerHTML += `<div class="insight warn" style="margin-bottom:6px">${l.replace(/^-\s*/,'')}</div>`;
      });
      const closeRaw = this.getTag(text, 'fit_close');
      const wrap = document.getElementById('t-gap-close-wrap');
      const closeList = document.getElementById('t-gap-close-list');
      if (closeRaw && closeRaw.trim()) {
        closeList.textContent = '';
        closeRaw.split('\n').filter(function (l) { return l.trim(); }).forEach(function (l) {
          const line = l.replace(/^[-•]\s*/, '').trim();
          if (!line) return;
          const row = document.createElement('div');
          row.className = 'insight info';
          row.style.marginBottom = '6px';
          row.textContent = line;
          closeList.appendChild(row);
        });
        wrap.classList.remove('hidden');
      } else {
        while (closeList.firstChild) closeList.removeChild(closeList.firstChild);
        wrap.classList.add('hidden');
      }
    } else {
      document.getElementById('t-gap-close-wrap').classList.add('hidden');
    }

    if (checked.cv) {
      const v = this.getTag(text, 'tailored_cv');
      if (v) {
        this.results['Tailored CV'] = this.sanitizeTailoredCv(v);
        tabs.push('Tailored CV');
      }
    }
    if (checked.cl) { const v = this.getTag(text,'cover_letter'); if(v) { this.results['Cover letter'] = v; tabs.push('Cover letter'); } }
    if (checked.qa) { const v = this.getTag(text,'application_qa'); if(v) { this.results['Q&A answers'] = v; tabs.push('Q&A answers'); } }

    const tabsEl = document.getElementById('t-rtabs'); tabsEl.innerHTML = '';
    tabs.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'rtab' + (i===0?' on':'');
      b.textContent = t;
      b.onclick = () => this.switchResult(t);
      tabsEl.appendChild(b);
    });
    if (tabs.length) {
      this.activeResult = tabs[0];
      document.getElementById('t-rbody').textContent = this.results[tabs[0]];
    } else if (checked.cv || checked.cl || checked.qa) {
      document.getElementById('t-rbody').textContent =
        'The model replied but the expected sections were not found. Try Generate again, or select fewer outputs at once.';
    }

    document.getElementById('t-load-actions').classList.add('hidden');
    document.getElementById('t-loading').classList.add('hidden');
    document.getElementById('t-results').classList.remove('hidden');
  },

  switchResult(t) {
    this.activeResult = t;
    document.querySelectorAll('#t-rtabs .rtab').forEach(b => b.classList.toggle('on', b.textContent === t));
    document.getElementById('t-rbody').textContent = this.results[t] || '';
  },

  copy() {
    navigator.clipboard.writeText(document.getElementById('t-rbody').textContent).catch(()=>{});
    alert('Copied!');
  },

  saveAndTrack() {
    const role = prompt('Role title for tracker:');
    const co = prompt('Company name:');
    if (role && co) {
      Data.add({ role, co, date: new Date().toISOString().slice(0,10), type: 'Implementation', status: 'Applied', cv: 'Custom' });
      alert('Added to tracker!');
      navigate('board');
    }
  }
};
