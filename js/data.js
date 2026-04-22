// data.js — shared state and helpers
const Data = {
  jobs: [],
  cvText: '',

  load() {
    const r = Storage.get('ja-jobs');
    this.jobs = r ? JSON.parse(r.value) : [];
    const cv = Storage.get('ja-cv');
    this.cvText = cv ? cv.value : '';
    if (!this.jobs.length) this.seed();
  },

  save() {
    Storage.set('ja-jobs', JSON.stringify(this.jobs));
  },

  saveCV(text) {
    this.cvText = text;
    Storage.set('ja-cv', text);
  },

  seed() {
    const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0,10); };
    this.jobs = [
      { id:1, role:'Implementation Manager', co:'Motivity', date:d(12), type:'Implementation', status:'Interview', cv:'Implementation-focused', responseDay:8 },
      { id:2, role:'Implementation Manager', co:'Supermove', date:d(5),  type:'Implementation', status:'Applied',   cv:'Implementation-focused', responseDay:null },
      { id:3, role:'Customer Success Manager', co:'Fintech Co', date:d(20), type:'Customer Success', status:'Rejected', cv:'General', responseDay:14 },
      { id:4, role:'Onboarding Specialist',  co:'TechSaaS',  date:d(8),  type:'Implementation', status:'Applied',   cv:'SaaS-focused', responseDay:null },
      { id:5, role:'Implementation Engineer', co:'Credrails', date:d(30), type:'Implementation', status:'Offer',    cv:'Implementation-focused', responseDay:5 },
      { id:6, role:'CSM Lead',               co:'Paystack',  date:d(3),  type:'Customer Success', status:'Applied', cv:'General', responseDay:null },
      { id:7, role:'Solutions Engineer',      co:'Andela',   date:d(18), type:'Engineering', status:'Interview', cv:'SaaS-focused', responseDay:10 },
    ];
    this.save();
  },

  add(job) {
    this.jobs.push({ id: Date.now(), responseDay: null, ...job });
    this.save();
  },

  remove(id) {
    this.jobs = this.jobs.filter(j => j.id !== id);
    this.save();
  },

  updateStatus(id, status) {
    const j = this.jobs.find(x => x.id === id);
    if (j) { j.status = status; this.save(); }
  },

  // helpers
  fmt(s) { return new Date(s).toLocaleDateString('en-GB', { day:'numeric', month:'short' }); },

  weekKey(d) {
    const s = new Date(d);
    s.setDate(s.getDate() - s.getDay());
    return s.toISOString().slice(5,10);
  },

  stats() {
    const total = this.jobs.length;
    const responded = this.jobs.filter(j => j.status !== 'Applied').length;
    const rate = total ? Math.round(responded / total * 100) : 0;
    const interviews = this.jobs.filter(j => j.status === 'Interview' || j.status === 'Offer').length;
    const thisWeek = this.jobs.filter(j => (new Date() - new Date(j.date)) / 864e5 <= 7).length;
    const rdDays = this.jobs.filter(j => j.responseDay).map(j => j.responseDay);
    const avgR = rdDays.length ? Math.round(rdDays.reduce((a,b) => a+b, 0) / rdDays.length) : null;
    return { total, responded, rate, interviews, thisWeek, avgR };
  },

  cvStats() {
    const cv = {}, cvr = {}, cvtype = {};
    this.jobs.forEach(j => {
      const v = j.cv || 'General';
      cv[v] = (cv[v] || 0) + 1;
      if (j.status !== 'Applied') cvr[v] = (cvr[v] || 0) + 1;
      if (!cvtype[v]) cvtype[v] = {};
      cvtype[v][j.type] = (cvtype[v][j.type] || 0) + 1;
    });
    return { cv, cvr, cvtype };
  }
};
