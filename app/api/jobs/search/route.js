const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function extractJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  const raw = text.slice(start, end + 1);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractJsonArrayAfterKey(text, key) {
  const marker = `"${key}":[`;
  const startKey = text.indexOf(marker);
  if (startKey === -1) return null;
  const start = text.indexOf('[', startKey);
  if (start === -1) return null;
  let i = start;
  let depth = 0;
  let inString = false;
  let esc = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (esc) {
        esc = false;
      } else if (ch === '\\\\') {
        esc = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        const raw = text.slice(start, i + 1);
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function llmRerankJobs({ apiKey, title, location, jobs }) {
  if (!apiKey || !jobs.length) return null;
  const compact = jobs.slice(0, 60).map((j, i) => ({
    idx: i,
    title: j.title,
    company: j.company,
    location: j.location,
    description: (j.description || '').slice(0, 700),
  }));

  const prompt = `You are a strict job relevance and eligibility classifier.
User context:
- Searched role: ${title || 'not provided'}
- Preferred location: ${location || 'not provided'}
- Candidate region: Africa (EAT timezone)

Task:
For each job, return:
- idx (integer)
- semantic_fit_score (0-100) based on semantic role similarity to searched role intent
- eligibility_score (0-100): how likely this role is applyable from Africa
- overall_score (0-100): weighted final score for ranking
- eligibility_status ("eligible" | "maybe" | "ineligible") for someone based in Africa
- eligibility_reason (1 short sentence)
- why_match (1 short sentence)

Rules:
- Mark "ineligible" when listing is location-locked to US/EU/UK/etc or requires local work authorization.
- Mark "eligible" only when listing clearly allows worldwide/EMEA/Africa or is genuinely open remote with no regional lock.
- If unclear, mark "maybe".
- Be conservative; avoid false "eligible".
- Do not invent facts not present in each listing text.
- semantic_fit_score rubric:
  - 90-100: direct role family + likely responsibilities match
  - 70-89: close adjacent role family
  - 40-69: partial role overlap
  - 0-39: weak/irrelevant role intent
- overall_score = 70% semantic_fit_score + 30% eligibility_score

Return ONLY a JSON array of objects with keys:
idx, semantic_fit_score, eligibility_score, overall_score, eligibility_status, eligibility_reason, why_match

Jobs:
${JSON.stringify(compact)}`;

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = (Array.isArray(data.content) ? data.content : [])
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n');
  return extractJsonArray(text);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || '').trim();
  const location = (searchParams.get('location') || '').trim().toLowerCase();

  const EXPANSIONS = {
    implementation: ['implementation', 'onboarding', 'integration', 'solutions', 'deployment'],
  };
  const titleTokensRaw = (title || 'software')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 2);
  const expandedTerms = new Set();
  titleTokensRaw.forEach((t) => {
    const vars = EXPANSIONS[t] || [t];
    vars.forEach((v) => expandedTerms.add(v));
  });
  const searchQueries = [];
  if (title) {
    const suffixes = ['engineer', 'manager', 'specialist', 'consultant'];
    expandedTerms.forEach((term) => {
      searchQueries.push(term);
      suffixes.forEach((s) => {
        if (title.toLowerCase().includes(s)) searchQueries.push(`${term} ${s}`);
      });
    });
    searchQueries.push(title);
  } else {
    searchQueries.push('software');
  }
  const uniqQueries = Array.from(new Set(searchQueries)).slice(0, 12);
  const remotiveUrls = uniqQueries.map((qq) => `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(qq)}`);
  const arbeitnowUrl = `https://www.arbeitnow.com/api/job-board-api`;
  const remoteokUrl = `https://remoteok.com/api`;
  const workingNomadsUrl = `https://www.workingnomads.com/api/exposed_jobs`;
  const jobicyUrl = `https://jobicy.com/api/v2/remote-jobs?count=50`;
  const wwrRssUrl = `https://weworkremotely.com/categories/remote-programming-jobs.rss`;
  const brighterMondayUrl = `https://www.brightermonday.co.ke/jobs`;
  const deelAshbyUrl = `https://jobs.ashbyhq.com/deel`;
  const supabaseAshbyUrl = `https://jobs.ashbyhq.com/supabase`;
  const ethiojobsUrl = `https://ethiojobs.net/jobs`;

  const sanitizeText = (s) =>
    (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const decodeHtml = (s) =>
    (s || '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

  const keyOf = (j) =>
    `${(j.url || '').toLowerCase()}|${(j.title || '').toLowerCase()}|${(j.company || '').toLowerCase()}`;
  const queryTokens = (title || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 2);
  const normalize = (t) => {
    if (!t) return '';
    if (t.length > 5 && t.endsWith('ing')) return t.slice(0, -3);
    if (t.length > 4 && t.endsWith('ers')) return t.slice(0, -1);
    if (t.length > 4 && t.endsWith('ed')) return t.slice(0, -2);
    if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1);
    return t;
  };
  const textMatchesQuery = (job) => {
    if (!queryTokens.length) return true;
    const text = `${job.title || ''} ${job.company || ''} ${job.description || ''}`.toLowerCase();
    const normText = text
      .split(/[^a-z0-9+#.]+/)
      .map(normalize)
      .filter((w) => w.length > 2);
    const tokenSet = new Set(normText);
    const hits = queryTokens.filter((t) => tokenSet.has(normalize(t))).length;
    return hits >= 1;
  };
  const relevanceScore = (job) => {
    if (!queryTokens.length) return 0;
    const titleTokens = new Set(
      (job.title || '')
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .map(normalize)
        .filter((w) => w.length > 2)
    );
    const companyTokens = new Set(
      (job.company || '')
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .map(normalize)
        .filter((w) => w.length > 2)
    );
    const sourceTokens = new Set(
      (job.source || '')
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .map(normalize)
        .filter((w) => w.length > 2)
    );
    const descTokens = new Set(
      (job.description || '')
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .map(normalize)
        .filter((w) => w.length > 2)
    );
    let titleHits = 0;
    let companyHits = 0;
    let sourceHits = 0;
    let descHits = 0;
    queryTokens.forEach((t) => {
      const n = normalize(t);
      if (titleTokens.has(n)) titleHits++;
      if (companyTokens.has(n)) companyHits++;
      if (sourceTokens.has(n)) sourceHits++;
      if (descTokens.has(n)) descHits++;
    });
    return titleHits * 8 + companyHits * 6 + sourceHits * 5 + descHits * 2;
  };
  const classifyEligibility = (job) => {
    const txt = `${job.title || ''} ${job.location || ''} ${job.description || ''}`.toLowerCase();
    const has = (r) => r.test(txt);
    const loc = (job.location || '').toLowerCase();
    const locTokens = loc.split(/[^a-z0-9+#.]+/).filter(Boolean);

    const hardBlock = [
      /\b(us|usa|united states)\s+only\b/,
      /\buk\s+only\b/,
      /\bcanada\s+only\b/,
      /\beu\s+only\b/,
      /\bmust\s+be\s+based\s+in\b/,
      /\bright\s+to\s+work\s+in\s+(the\s+)?(us|uk|eu|canada)\b/,
      /\bno\s+visa\s+sponsorship\b/,
      /\bvisa\s+sponsorship\s+not\s+available\b/,
      /\bnot\s+open\s+to\s+international\b/,
      /\bstrictly\s+within\s+(the\s+)?(us|uk|eu|canada)\b/,
    ];
    if (hardBlock.some(has)) {
      return {
        status: 'ineligible',
        label: 'Not eligible from Africa',
        reason: 'Role has regional/work-authorization restrictions.',
      };
    }

    const localGeoHints = [
      /\busa?\b/,
      /\bunited states\b/,
      /\buk\b/,
      /\bunited kingdom\b/,
      /\bcanada\b/,
      /\bgermany\b/,
      /\bfrance\b/,
      /\bnetherlands\b/,
      /\bspain\b/,
      /\bitaly\b/,
      /\bswitzerland\b/,
      /\bpoland\b/,
      /\bportugal\b/,
      /\bbelgium\b/,
      /\baustria\b/,
      /\bsweden\b/,
      /\bnorway\b/,
      /\bdenmark\b/,
      /\bireland\b/,
      /\baustralia\b/,
      /\bnew zealand\b/,
      /\blas vegas\b/,
      /\bnew york\b/,
      /\bsan francisco\b/,
      /\blondon\b/,
      /\bberlin\b/,
      /\bparis\b/,
    ];
    const usStateAbbrev = /,\s?(al|ak|az|ar|ca|co|ct|dc|de|fl|ga|hi|ia|id|il|in|ks|ky|la|ma|md|me|mi|mn|mo|ms|mt|nc|nd|ne|nh|nj|nm|nv|ny|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|va|vt|wa|wi|wv|wy)\b/;
    const regionRestrictedHints = [
      /\bamericas?\b/,
      /\beurope\b/,
      /\basia\b/,
      /\boceania\b/,
      /\blatam\b/,
      /\bnorth america\b/,
      /\bsouth america\b/,
      /\bapac\b/,
    ];
    const hasLocalGeoHint =
      localGeoHints.some((r) => r.test(loc)) ||
      regionRestrictedHints.some((r) => r.test(loc)) ||
      usStateAbbrev.test(loc);

    const africaOrEmeaPositive = [
      /\bemea\b/,
      /\bafrica\b/,
      /\bafrican\b/,
    ];
    const hasAfricaOrEmeaPositive = africaOrEmeaPositive.some(has);

    const strongPositive = [
      /\bworldwide\b/,
      /\banywhere\b/,
      /\bwork\s+from\s+anywhere\b/,
      /\bopen\s+to\s+candidates\s+worldwide\b/,
      /\bremote\s+anywhere\b/,
    ];
    const hasStrongPositive = strongPositive.some(has);
    const onlyGlobalLocation =
      loc.length > 0 &&
      locTokens.length <= 4 &&
      /\b(worldwide|global|anywhere|remote)\b/.test(loc) &&
      !hasLocalGeoHint;

    const remoteGeneral = /\bremote\b/.test(txt);
    // Location-specific roles are ineligible unless globally open is explicit.
    if (hasLocalGeoHint && !hasAfricaOrEmeaPositive) {
      return {
        status: 'ineligible',
        label: 'Not eligible from Africa',
        reason: remoteGeneral
          ? 'Remote role appears tied to a specific non-African location.'
          : 'Role appears tied to a specific non-African location.',
      };
    }

    // Generic location-bound rule: if a concrete location is present and
    // listing is not remote/global/EMEA/Africa explicit, treat as ineligible.
    const hasConcreteLocation =
      loc &&
      loc.length > 2 &&
      !/\b(remote|worldwide|global|anywhere|emea|africa)\b/.test(loc);
    if (hasConcreteLocation && !hasStrongPositive && !hasAfricaOrEmeaPositive) {
      return {
        status: 'ineligible',
        label: 'Not eligible from Africa',
        reason: 'Role appears location-bound without explicit international remote eligibility.',
      };
    }

    if (hasAfricaOrEmeaPositive || hasStrongPositive || onlyGlobalLocation) {
      return {
        status: 'eligible',
        label: 'Eligible from Africa',
        reason: hasAfricaOrEmeaPositive
          ? 'Listing explicitly mentions Africa/EMEA eligibility.'
          : 'Listing explicitly says worldwide/anywhere.',
      };
    }

    if (remoteGeneral) {
      return {
        status: 'maybe',
        label: 'Maybe eligible',
        reason: 'Remote role, but region eligibility is not explicit.',
      };
    }

    return {
      status: 'maybe',
      label: 'Maybe eligible',
      reason: 'Region eligibility is unclear from listing text.',
    };
  };

  try {
    const remotiveTasks = remotiveUrls.map((u) => fetch(u, { cache: 'no-store' }));
    const remotiveSettled = await Promise.allSettled(remotiveTasks);
    const [arbeitnowRes, remoteokRes, workingNomadsRes, jobicyRes, wwrRssRes, brighterMondayRes, deelAshbyRes, supabaseAshbyRes, ethiojobsRes] = await Promise.allSettled([
      fetch(arbeitnowUrl, { cache: 'no-store' }),
      fetch(remoteokUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 ApplyPilot/1.0' },
      }),
      fetch(workingNomadsUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 ApplyPilot/1.0' },
      }),
      fetch(jobicyUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 ApplyPilot/1.0' },
      }),
      fetch(wwrRssUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 ApplyPilot/1.0' },
      }),
      fetch(brighterMondayUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 ApplyPilot/1.0' },
      }),
      fetch(deelAshbyUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 ApplyPilot/1.0' },
      }),
      fetch(supabaseAshbyUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 ApplyPilot/1.0' },
      }),
      fetch(ethiojobsUrl, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 ApplyPilot/1.0' },
      }),
    ]);

    let remotiveJobs = [];
    for (const remotiveRes of remotiveSettled) {
      if (remotiveRes.status !== 'fulfilled' || !remotiveRes.value.ok) continue;
      const data = await remotiveRes.value.json();
      const list = Array.isArray(data.jobs) ? data.jobs : [];
      remotiveJobs = remotiveJobs.concat(
        list
          .map((j) => ({
            title: j.title || 'Untitled role',
            company: j.company_name || 'Unknown company',
            location: j.candidate_required_location || 'Remote',
            description: sanitizeText(j.description),
            url: j.url || j.job_url || '#',
            source: 'Remotive',
          }))
          .map((job) => ({ ...job, eligibility: classifyEligibility(job) }))
      );
    }

    let arbeitnowJobs = [];
    if (arbeitnowRes.status === 'fulfilled' && arbeitnowRes.value.ok) {
      const data = await arbeitnowRes.value.json();
      const list = Array.isArray(data.data) ? data.data : [];
      arbeitnowJobs = list.map((j) => ({
        title: j.title || 'Untitled role',
        company: j.company_name || 'Unknown company',
        location:
          (Array.isArray(j.location) && j.location.join(', ')) ||
          j.location ||
          (j.remote ? 'Remote' : 'Location not specified'),
        description: sanitizeText(j.description),
        url: j.url || '#',
        source: 'Arbeitnow',
      })).map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
    }

    let remoteokJobs = [];
    if (remoteokRes.status === 'fulfilled' && remoteokRes.value.ok) {
      const data = await remoteokRes.value.json();
      const list = Array.isArray(data) ? data : [];
      remoteokJobs = list
        .filter((j) => j && typeof j === 'object' && (j.position || j.company))
        .map((j) => ({
          title: j.position || 'Untitled role',
          company: j.company || 'Unknown company',
          location:
            (Array.isArray(j.location) ? j.location.join(', ') : j.location) ||
            (j.country || '') ||
            (j.tags && j.tags.includes('remote') ? 'Remote' : 'Location not specified'),
          description: sanitizeText(j.description || j.description_text || ''),
          url: j.url || (j.id ? `https://remoteok.com/remote-jobs/${j.id}` : '#'),
          source: 'RemoteOK',
        }))
        .map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
    }

    let workingNomadsJobs = [];
    if (workingNomadsRes.status === 'fulfilled' && workingNomadsRes.value.ok) {
      const data = await workingNomadsRes.value.json();
      const list = Array.isArray(data) ? data : [];
      workingNomadsJobs = list
        .map((j) => ({
          title: j.title || 'Untitled role',
          company: j.company_name || 'Unknown company',
          location: j.location || 'Remote',
          description: sanitizeText(j.description || ''),
          url: j.url || '#',
          source: 'WorkingNomads',
        }))
        .map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
    }

    let jobicyJobs = [];
    if (jobicyRes.status === 'fulfilled' && jobicyRes.value.ok) {
      const data = await jobicyRes.value.json();
      const list = Array.isArray(data?.jobs) ? data.jobs : [];
      jobicyJobs = list
        .map((j) => ({
          title: j.jobTitle || 'Untitled role',
          company: j.companyName || 'Unknown company',
          location: j.jobGeo || 'Remote',
          description: sanitizeText(j.jobDescription || j.jobExcerpt || ''),
          url: j.url || '#',
          source: 'Jobicy',
        }))
        .map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
    }

    let wwrJobs = [];
    if (wwrRssRes.status === 'fulfilled' && wwrRssRes.value.ok) {
      const xml = await wwrRssRes.value.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      wwrJobs = items
        .map((item) => {
          const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i);
          const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
          const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i);
          const rawTitle = decodeHtml((titleMatch && (titleMatch[1] || titleMatch[2])) || 'Untitled role').trim();
          const title = rawTitle.replace(/\s+/g, ' ');
          const url = decodeHtml((linkMatch && linkMatch[1]) || '#').trim();
          const description = sanitizeText(decodeHtml((descMatch && (descMatch[1] || descMatch[2])) || ''));
          return {
            title: title || 'Untitled role',
            company: 'We Work Remotely',
            location: 'Remote',
            description,
            url,
            source: 'WeWorkRemotely',
          };
        })
        .filter((j) => j.url && j.url !== '#')
        .map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
    }

    let brighterMondayJobs = [];
    if (brighterMondayRes.status === 'fulfilled' && brighterMondayRes.value.ok) {
      const html = await brighterMondayRes.value.text();
      const links = Array.from(
        new Set(
          (html.match(/https:\/\/www\.brightermonday\.co\.ke\/listings\/[a-z0-9-]+/g) || []).slice(0, 60)
        )
      );
      brighterMondayJobs = links
        .map((url) => {
          const slug = (url.split('/listings/')[1] || '').replace(/-[a-z0-9]{6}$/i, '');
          const title = decodeHtml(slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
          return {
            title: title || 'Untitled role',
            company: 'BrighterMonday',
            location: 'Kenya',
            description: '',
            url,
            source: 'BrighterMonday',
          };
        })
        .map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
    }

    let deelJobs = [];
    if (deelAshbyRes.status === 'fulfilled' && deelAshbyRes.value.ok) {
      const html = await deelAshbyRes.value.text();
      const arr = extractJsonArrayAfterKey(html, 'jobPostings') || [];
      deelJobs = arr
        .map((j) => ({
          title: j.title || 'Untitled role',
          company: 'Deel',
          location: 'Global/Remote',
          description: '',
          url: j.id ? `https://jobs.ashbyhq.com/deel/${j.id}` : deelAshbyUrl,
          source: 'Deel',
        }))
        .map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
    }

    let supabaseJobs = [];
    if (supabaseAshbyRes.status === 'fulfilled' && supabaseAshbyRes.value.ok) {
      const html = await supabaseAshbyRes.value.text();
      const arr = extractJsonArrayAfterKey(html, 'jobPostings') || [];
      supabaseJobs = arr
        .map((j) => ({
          title: j.title || 'Untitled role',
          company: 'Supabase',
          location: 'Global/Remote',
          description: '',
          url: j.id ? `https://jobs.ashbyhq.com/supabase/${j.id}` : supabaseAshbyUrl,
          source: 'Supabase',
        }))
        .map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
    }

    let ethiojobsJobs = [];
    if (ethiojobsRes.status === 'fulfilled' && ethiojobsRes.value.ok) {
      const html = await ethiojobsRes.value.text();
      const nextMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
      );
      if (nextMatch && nextMatch[1]) {
        try {
          const data = JSON.parse(nextMatch[1]);
          const list = data?.props?.pageProps?.jobs?.data;
          if (Array.isArray(list)) {
            ethiojobsJobs = list
              .map((j) => ({
                title: j.title || 'Untitled role',
                company: (j.company && j.company.name) || 'Unknown company',
                location: 'Ethiopia',
                description: sanitizeText(j.description || ''),
                url: j.slug ? `https://ethiojobs.net/jobs/${j.slug}` : ethiojobsUrl,
                source: 'Ethiojobs',
              }))
              .map((job) => ({ ...job, eligibility: classifyEligibility(job) }));
          }
        } catch {
          // ignore parse errors; keep source best-effort only
        }
      }
    }

    // Keep only a coarse location prefilter to reduce noise/cost.
    // Final nuanced location eligibility is decided by Anthropic reranker.
    const isRemoteQuery =
      location === 'remote' ||
      location === 'anywhere' ||
      location === 'worldwide' ||
      location === 'global';
    const locationMatches = (jobLocation) => {
      if (!location) return true;
      const loc = (jobLocation || '').toLowerCase();
      if (isRemoteQuery) {
        return (
          loc.includes('remote') ||
          loc.includes('worldwide') ||
          loc.includes('anywhere') ||
          loc.includes('global') ||
          loc.includes('emea')
        );
      }
      // For typed non-remote locations, allow broad passthrough.
      // Anthropic will make final eligibility/location judgment.
      return true;
    };

    const merged = remotiveJobs.concat(
      arbeitnowJobs,
      remoteokJobs,
      workingNomadsJobs,
      jobicyJobs,
      wwrJobs,
      brighterMondayJobs,
      deelJobs,
      supabaseJobs,
      ethiojobsJobs
    );
    const dedupedMap = new Map();
    merged.forEach((j) => {
      const k = keyOf(j);
      if (!dedupedMap.has(k)) dedupedMap.set(k, j);
    });
    let mapped = Array.from(dedupedMap.values())
      .filter((j) => locationMatches(j.location))
      .filter((j) => textMatchesQuery(j))
      .sort((a, b) => relevanceScore(b) - relevanceScore(a))
      .slice(0, 120);

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const llm = await llmRerankJobs({
      apiKey: anthropicKey,
      title,
      location,
      jobs: mapped,
    });
    if (Array.isArray(llm) && llm.length) {
      const byIdx = new Map();
      llm.forEach((row) => {
        if (!row || typeof row.idx !== 'number') return;
        byIdx.set(row.idx, row);
      });
      mapped = mapped
        .map((j, i) => {
          const row = byIdx.get(i);
          if (!row) return j;
          const status =
            row.eligibility_status === 'eligible' ||
            row.eligibility_status === 'maybe' ||
            row.eligibility_status === 'ineligible'
              ? row.eligibility_status
              : j.eligibility.status;
          const label =
            status === 'eligible'
              ? 'Eligible from Africa'
              : status === 'ineligible'
                ? 'Not eligible from Africa'
                : 'Maybe eligible';
          return {
            ...j,
            fitScore:
              typeof row.overall_score === 'number'
                ? Math.max(0, Math.min(100, Math.round(row.overall_score)))
                : typeof row.semantic_fit_score === 'number'
                  ? Math.max(0, Math.min(100, Math.round(row.semantic_fit_score)))
                : undefined,
            semanticScore:
              typeof row.semantic_fit_score === 'number'
                ? Math.max(0, Math.min(100, Math.round(row.semantic_fit_score)))
                : undefined,
            eligibilityScore:
              typeof row.eligibility_score === 'number'
                ? Math.max(0, Math.min(100, Math.round(row.eligibility_score)))
                : undefined,
            whyMatch:
              typeof row.why_match === 'string' && row.why_match.trim()
                ? row.why_match.trim()
                : undefined,
            eligibility: {
              status,
              label,
              reason:
                typeof row.eligibility_reason === 'string' && row.eligibility_reason.trim()
                  ? row.eligibility_reason.trim()
                  : j.eligibility.reason,
            },
          };
        })
        .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
    }

    return Response.json({ jobs: mapped.slice(0, 60) });
  } catch (err) {
    return Response.json(
      {
        error: {
          message: 'Failed to fetch jobs',
          detail: err?.message || 'unknown',
        },
      },
      { status: 502 }
    );
  }
}
