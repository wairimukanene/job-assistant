const InterviewPrep = {
  state: {
    role: '',
    company: '',
    jobDescription: '',
    competencyFocus: '',
    likelyQuestions: [],
    competencyBank: [],
    salaryScript: '',
    selectedQuestion: '',
  },

  init() {
    const el = document.getElementById('page-interview');
    el.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Interview Prep</h1>
      </div>
      <div class="card">
        <div class="interview-grid">
          <div>
            <label>Role title</label>
            <input id="ip-role" type="text" placeholder="e.g. Support Engineer" />
          </div>
          <div>
            <label>Company (optional)</label>
            <input id="ip-company" type="text" placeholder="e.g. Supabase" />
          </div>
        </div>
        <div class="field">
          <label>Job description (recommended)</label>
          <textarea id="ip-jd" placeholder="Paste role responsibilities and requirements..." style="min-height:140px"></textarea>
        </div>
        <div class="interview-grid">
          <div>
            <label>Competency focus (optional)</label>
            <input id="ip-competency" type="text" placeholder="e.g. Stakeholder management, incident response" />
          </div>
          <div class="interview-actions">
            <button class="btn" type="button" onclick="InterviewPrep.generateKit()">Generate interview kit</button>
          </div>
        </div>
        <div class="gen-help">Generates likely questions, competency-based bank, and salary negotiation script for this role.</div>
      </div>

      <div id="ip-loading" class="card hidden">
        <span class="spinner"></span> Building your interview kit...
      </div>

      <div id="ip-output" class="hidden">
        <div class="card">
          <div class="card-title">Likely interview questions per role</div>
          <div id="ip-questions"></div>
        </div>

        <div class="card">
          <div class="card-title">Practice answer with AI feedback</div>
          <label>Selected question</label>
          <textarea id="ip-selected-question" style="min-height:90px" placeholder="Select a generated question, or type your own."></textarea>
          <label style="margin-top:10px">Your practice answer</label>
          <textarea id="ip-answer" style="min-height:140px" placeholder="Write your answer using STAR where possible."></textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button class="btn-sm" type="button" onclick="InterviewPrep.getFeedback()">Get AI feedback</button>
          </div>
          <div id="ip-feedback" class="result-body hidden" style="margin-top:10px"></div>
        </div>

        <div class="card">
          <div class="card-title">Competency-based question bank</div>
          <div id="ip-competency-bank"></div>
        </div>

        <div class="card">
          <div class="card-title">Salary negotiation script per role</div>
          <div id="ip-salary-script" class="result-body"></div>
        </div>
      </div>
    `;
  },

  anthropicText(data) {
    if (!data || !Array.isArray(data.content)) return '';
    return data.content
      .filter(function (b) { return b.type === 'text' && typeof b.text === 'string'; })
      .map(function (b) { return b.text; })
      .join('\n');
  },

  readInputs() {
    this.state.role = (document.getElementById('ip-role').value || '').trim();
    this.state.company = (document.getElementById('ip-company').value || '').trim();
    this.state.jobDescription = (document.getElementById('ip-jd').value || '').trim();
    this.state.competencyFocus = (document.getElementById('ip-competency').value || '').trim();
  },

  setLoading(on) {
    document.getElementById('ip-loading').classList.toggle('hidden', !on);
  },

  extractJsonObject(text) {
    if (!text) return null;
    const fenced = text.match(/```json\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    const raw = candidate.slice(start, end + 1);
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  interviewSystemPrompt() {
    return [
      'You are a practical interview coach.',
      'Be specific to the target role and job description context.',
      'Do not invent private candidate history beyond provided CV/job details.',
      'Return concise, plain-English, actionable content.',
      'Return only JSON with the exact schema requested by the user.',
    ].join('\n');
  },

  async generateKit() {
    this.readInputs();
    if (!this.state.role) {
      alert('Please enter a role title first.');
      return;
    }

    this.setLoading(true);
    document.getElementById('ip-output').classList.add('hidden');

    const userPrompt = `Create a role-specific interview prep kit.

Role title: ${this.state.role}
Company: ${this.state.company || 'Not provided'}
Competency focus: ${this.state.competencyFocus || 'General'}
CV context (if available): ${(Data.cvText || '').slice(0, 6000) || 'Not provided'}
Job description context: ${(this.state.jobDescription || '').slice(0, 9000) || 'Not provided'}

Return ONLY JSON in this schema:
{
  "likely_questions": ["8-10 realistic interview questions"],
  "competency_bank": [
    {
      "competency": "name",
      "questions": ["3-4 competency-based questions"]
    }
  ],
  "salary_script": {
    "anchor_opening": "short opening line",
    "value_case": ["3-5 bullets proving value to role"],
    "negotiation_lines": ["4-6 reusable negotiation lines"],
    "fallback_plan": "what to do if budget is constrained"
  }
}`;

    try {
      const res = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          temperature: 0.2,
          system: this.interviewSystemPrompt(),
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      const data = await res.json();
      this.setLoading(false);
      if (!res.ok || data.error) {
        alert('Could not generate interview kit right now. Please try again.');
        return;
      }
      const parsed = this.extractJsonObject(this.anthropicText(data));
      if (!parsed) {
        alert('Model output was not in expected JSON format. Please retry.');
        return;
      }
      this.state.likelyQuestions = Array.isArray(parsed.likely_questions) ? parsed.likely_questions : [];
      this.state.competencyBank = Array.isArray(parsed.competency_bank) ? parsed.competency_bank : [];
      this.state.salaryScript = parsed.salary_script || {};
      this.renderKit();
    } catch (e) {
      this.setLoading(false);
      alert('Network error while generating interview kit.');
    }
  },

  renderKit() {
    const questionsEl = document.getElementById('ip-questions');
    questionsEl.innerHTML = '';
    if (!this.state.likelyQuestions.length) {
      questionsEl.innerHTML = '<div class="insight warn">No questions generated yet. Try adding a richer job description.</div>';
    } else {
      this.state.likelyQuestions.forEach((q) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'ip-question';
        row.textContent = q;
        row.onclick = () => {
          this.state.selectedQuestion = q;
          document.getElementById('ip-selected-question').value = q;
        };
        questionsEl.appendChild(row);
      });
    }

    const bankEl = document.getElementById('ip-competency-bank');
    bankEl.innerHTML = '';
    if (!this.state.competencyBank.length) {
      bankEl.innerHTML = '<div class="insight warn">No competency bank generated yet.</div>';
    } else {
      this.state.competencyBank.forEach((entry) => {
        const wrap = document.createElement('div');
        wrap.className = 'ip-bank-group';
        const title = document.createElement('div');
        title.className = 'ip-bank-title';
        title.textContent = entry.competency || 'Competency';
        wrap.appendChild(title);
        const qs = Array.isArray(entry.questions) ? entry.questions : [];
        qs.forEach((q) => {
          const li = document.createElement('div');
          li.className = 'ip-bank-item';
          li.textContent = '- ' + q;
          wrap.appendChild(li);
        });
        bankEl.appendChild(wrap);
      });
    }

    const salary = this.state.salaryScript || {};
    const lines = [];
    if (salary.anchor_opening) lines.push('Opening: ' + salary.anchor_opening);
    if (Array.isArray(salary.value_case) && salary.value_case.length) {
      lines.push('');
      lines.push('Value case:');
      salary.value_case.forEach((v) => lines.push('- ' + v));
    }
    if (Array.isArray(salary.negotiation_lines) && salary.negotiation_lines.length) {
      lines.push('');
      lines.push('Negotiation lines:');
      salary.negotiation_lines.forEach((v) => lines.push('- ' + v));
    }
    if (salary.fallback_plan) {
      lines.push('');
      lines.push('Fallback plan: ' + salary.fallback_plan);
    }
    document.getElementById('ip-salary-script').textContent =
      lines.join('\n') || 'No salary script generated yet.';

    document.getElementById('ip-feedback').classList.add('hidden');
    document.getElementById('ip-feedback').textContent = '';
    document.getElementById('ip-output').classList.remove('hidden');
  },

  async getFeedback() {
    const question = (document.getElementById('ip-selected-question').value || '').trim();
    const answer = (document.getElementById('ip-answer').value || '').trim();
    if (!question) {
      alert('Select or type an interview question first.');
      return;
    }
    if (answer.length < 40) {
      alert('Please write a fuller practice answer (at least 40 characters).');
      return;
    }

    const feedbackEl = document.getElementById('ip-feedback');
    feedbackEl.classList.remove('hidden');
    feedbackEl.textContent = 'Reviewing your answer...';

    const userPrompt = `Give coaching feedback on this interview answer.

Role: ${this.state.role || 'Not provided'}
Company: ${this.state.company || 'Not provided'}
Question: ${question}
Candidate answer: ${answer}

Return plain text with this structure:
Overall score: <0-100>
What works:
- ...
- ...
What to improve:
- ...
- ...
Stronger rewrite:
<rewrite in 120-180 words, concise and natural>`;

    try {
      const res = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1800,
          temperature: 0.2,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        feedbackEl.textContent = 'Could not generate feedback right now. Please try again.';
        return;
      }
      const text = this.anthropicText(data).trim();
      feedbackEl.textContent = text || 'No feedback returned. Please retry.';
    } catch (e) {
      feedbackEl.textContent = 'Network error while getting feedback.';
    }
  },
};
