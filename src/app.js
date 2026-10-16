/* ==========================================================================
   Codeforces Helper Desktop Client - Renderer Analytics & UI Controller
   ========================================================================== */

// Tag Chinese translation dictionary for clear bilingual display
const TAG_CN_MAP = {
  'dp': '动态规划 (dp)',
  'greedy': '贪心 (greedy)',
  'math': '数学 (math)',
  'implementation': '模拟实现 (implementation)',
  'data structures': '数据结构 (data structures)',
  'brute force': '暴力枚举 (brute force)',
  'constructive algorithms': '构造算法 (constructive)',
  'graphs': '图论 (graphs)',
  'sortings': '排序 (sortings)',
  'sorting': '排序 (sorting)',
  'binary search': '二分查找 (binary search)',
  'dfs and similar': 'DFS及变种 (dfs)',
  'trees': '树论 (trees)',
  'strings': '字符串 (strings)',
  'number theory': '数论 (number theory)',
  'combinatorics': '组合数学 (combinatorics)',
  'two pointers': '双指针 (two pointers)',
  'bitmasks': '位运算/状压 (bitmasks)',
  'geometry': '计算几何 (geometry)',
  'dsu': '并查集 (dsu)',
  'shortest paths': '最短路 (shortest paths)',
  'probabilities': '概率/期望 (probabilities)',
  'divide and conquer': '分治 (divide & conquer)',
  'hashing': '哈希 (hashing)',
  'games': '博弈论 (games)',
  'flows': '网络流 (flows)',
  'interactive': '交互题 (interactive)',
  'matrices': '矩阵 (matrices)',
  'ternary search': '三分查找 (ternary search)',
  'fft': '快速傅里叶 (fft)',
  'string suffix structures': '后缀结构 (suffix)',
  '2-sat': '2-SAT'
};

function formatTagName(tag) {
  const clean = String(tag || '').trim().toLowerCase();
  return TAG_CN_MAP[clean] || clean;
}

function getCfRankInfo(rating) {
  const r = Number(rating) || 0;
  if (r <= 0) return { title: 'Unrated', cn: '未定级', color: '#9ca3af', nextRating: 1200, nextTitle: 'Pupil (绿名)' };
  if (r < 1200) return { title: 'Newbie', cn: 'Newbie (灰名)', color: '#9ca3af', nextRating: 1200, nextTitle: 'Pupil (绿名 1200)' };
  if (r < 1400) return { title: 'Pupil', cn: 'Pupil (绿名)', color: '#22c55e', nextRating: 1400, nextTitle: 'Specialist (青名 1400)' };
  if (r < 1600) return { title: 'Specialist', cn: 'Specialist (青名)', color: '#06b6d4', nextRating: 1600, nextTitle: 'Expert (蓝名 1600)' };
  if (r < 1900) return { title: 'Expert', cn: 'Expert (蓝名)', color: '#3b82f6', nextRating: 1900, nextTitle: 'Candidate Master (紫名 1900)' };
  if (r < 2100) return { title: 'Candidate Master', cn: 'Candidate Master (紫名)', color: '#a855f7', nextRating: 2100, nextTitle: 'Master (橙名 2100)' };
  if (r < 2300) return { title: 'Master', cn: 'Master (橙名)', color: '#f59e0b', nextRating: 2300, nextTitle: 'International Master (深橙 2300)' };
  if (r < 2400) return { title: 'International Master', cn: 'Intl. Master (深橙)', color: '#f59e0b', nextRating: 2400, nextTitle: 'Grandmaster (红名 2400)' };
  if (r < 3000) return { title: 'Grandmaster', cn: 'Grandmaster (红名)', color: '#ef4444', nextRating: 3000, nextTitle: 'Legendary GM (黑红 3000)' };
  return { title: 'Legendary Grandmaster', cn: 'Legendary GM (黑红)', color: '#ef4444', nextRating: r + 100, nextTitle: 'GOAT 巅峰突破' };
}

function getProblemRatingColor(rating) {
  const r = Number(rating) || 0;
  if (r < 1200) return '#9ca3af';
  if (r < 1400) return '#22c55e';
  if (r < 1600) return '#06b6d4';
  if (r < 1900) return '#3b82f6';
  if (r < 2100) return '#a855f7';
  if (r < 2400) return '#f59e0b';
  return '#ef4444';
}

function formatDate(sec) {
  if (!sec) return '-';
  const d = new Date(sec * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(sec) {
  if (!sec) return '-';
  const d = new Date(sec * 1000);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

function showToast(msg, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${isError ? 'error' : ''}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3400);
}

function openExternalUrl(url) {
  if (window.cfDesktop && window.cfDesktop.openExternal) {
    window.cfDesktop.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

// Global State
const state = {
  config: {
    activeHandle: 'Demo_Coder',
    accounts: [{ handle: 'Demo_Coder', label: '内置演示账号 (Demo)', isDemo: true }],
    apiKey: '',
    apiSecret: ''
  },
  rawData: null,
  analysis: null,
  charts: {}
};

/* ==========================================================================
   Core Analytics Engine
   ========================================================================== */
function analyzeDataset(rawData) {
  const userInfo = rawData.userInfo || {};
  const currentRating = Number(userInfo.rating) || 1400;
  const maxRating = Number(userInfo.maxRating) || currentRating;
  const submissions = Array.isArray(rawData.submissions) ? rawData.submissions : [];
  const ratingHistory = Array.isArray(rawData.ratingHistory) ? rawData.ratingHistory : [];

  // Sort submissions oldest -> newest to accurately track first-attempt (1A) and attempts before AC
  const chronoSubs = [...submissions].sort((a, b) => (a.creationTimeSeconds || 0) - (b.creationTimeSeconds || 0));

  const problemMap = new Map();
  const verdictCounts = {
    OK: 0,
    WRONG_ANSWER: 0,
    TIME_LIMIT_EXCEEDED: 0,
    RUNTIME_ERROR: 0,
    MEMORY_LIMIT_EXCEEDED: 0,
    COMPILATION_ERROR: 0,
    OTHER: 0
  };
  const dailyActivity = new Map(); // 'YYYY-MM-DD' -> count
  const activeDaysSet = new Set();

  chronoSubs.forEach((sub) => {
    const verdict = sub.verdict || 'OTHER';
    if (verdictCounts[verdict] !== undefined) {
      verdictCounts[verdict]++;
    } else {
      verdictCounts.OTHER++;
    }

    if (sub.creationTimeSeconds) {
      const dayStr = formatDate(sub.creationTimeSeconds);
      activeDaysSet.add(dayStr);
      dailyActivity.set(dayStr, (dailyActivity.get(dayStr) || 0) + 1);
    }

    const prob = sub.problem;
    if (!prob) return;
    const probId = `${prob.contestId || prob.problemsetName || 'CF'}${prob.index || ''}`;

    let rec = problemMap.get(probId);
    if (!rec) {
      rec = {
        id: probId,
        contestId: prob.contestId,
        index: prob.index,
        name: prob.name || probId,
        rating: Number(prob.rating) || 0,
        tags: Array.isArray(prob.tags) ? prob.tags.map((t) => String(t).trim().toLowerCase()) : [],
        solved: false,
        attemptsBeforeAc: 0,
        totalAttempts: 0,
        firstAcTime: 0,
        lastSubTime: 0,
        lastVerdict: verdict,
        language: sub.programmingLanguage || ''
      };
      problemMap.set(probId, rec);
    }

    rec.totalAttempts++;
    rec.lastSubTime = Math.max(rec.lastSubTime, sub.creationTimeSeconds || 0);
    rec.lastVerdict = verdict;
    if (sub.programmingLanguage) rec.language = sub.programmingLanguage;

    if (verdict === 'OK') {
      if (!rec.solved) {
        rec.solved = true;
        rec.firstAcTime = sub.creationTimeSeconds || 0;
      }
    } else {
      if (!rec.solved) {
        rec.attemptsBeforeAc++;
      }
    }
  });

  const allProblems = Array.from(problemMap.values()).sort((a, b) => b.lastSubTime - a.lastSubTime);
  const solvedProblems = allProblems.filter((p) => p.solved);
  const stuckProblems = allProblems.filter((p) => !p.solved);
  const solved1A = solvedProblems.filter((p) => p.attemptsBeforeAc === 0);

  const ratedSolved = solvedProblems.filter((p) => p.rating > 0);
  const maxSolvedRating = ratedSolved.length > 0 ? Math.max(...ratedSolved.map((p) => p.rating)) : 0;
  const avgSolvedRating = ratedSolved.length > 0
    ? Math.round(ratedSolved.reduce((s, p) => s + p.rating, 0) / ratedSolved.length)
    : 0;

  const nowSec = Math.floor(Date.now() / 1000);
  const recent30DaysSolved = solvedProblems.filter((p) => nowSec - p.firstAcTime <= 30 * 86400);

  // Difficulty buckets (800 to 2600+)
  const ratingBuckets = {};
  for (let r = 800; r <= 2600; r += 100) {
    ratingBuckets[r] = 0;
  }
  ratedSolved.forEach((p) => {
    const bucket = Math.min(2600, Math.max(800, Math.floor(p.rating / 100) * 100));
    ratingBuckets[bucket] = (ratingBuckets[bucket] || 0) + 1;
  });

  // =========================================================================
  // Tag Mastery Diagnostic Model
  // =========================================================================
  const CORE_CF_TAGS = [
    'dp', 'greedy', 'math', 'graphs', 'data structures', 'binary search',
    'trees', 'constructive algorithms', 'strings', 'number theory',
    'dfs and similar', 'two pointers', 'combinatorics', 'bitmasks',
    'sortings', 'dsu', 'shortest paths', 'geometry', 'games'
  ];

  const tagStatsMap = new Map();
  const ensureTag = (tag) => {
    const t = String(tag).trim().toLowerCase();
    if (!tagStatsMap.has(t)) {
      tagStatsMap.set(t, {
        tag: t,
        cnName: formatTagName(t),
        acCount: 0,
        attemptedCount: 0,
        stuckCount: 0,
        firstTryCount: 0,
        totalSubs: 0,
        ratings: [],
        avgRating: 0,
        top5Rating: 0,
        passRate: 0,
        firstTryRate: 0,
        masteryScore: 0,
        category: 'solid'
      });
    }
    return tagStatsMap.get(t);
  };

  // Seed core tags so blind spots are always detected even if 0 solved
  CORE_CF_TAGS.forEach((t) => ensureTag(t));

  allProblems.forEach((prob) => {
    prob.tags.forEach((rawTag) => {
      const st = ensureTag(rawTag);
      st.attemptedCount++;
      st.totalSubs += prob.totalAttempts;
      if (prob.solved) {
        st.acCount++;
        if (prob.attemptsBeforeAc === 0) st.firstTryCount++;
        if (prob.rating > 0) st.ratings.push(prob.rating);
      } else {
        st.stuckCount++;
      }
    });
  });

  const userBenchmarkRating = Math.max(1100, currentRating);

  const tagDiagnostics = Array.from(tagStatsMap.values())
    .filter((st) => st.attemptedCount > 0 || CORE_CF_TAGS.includes(st.tag))
    .map((st) => {
      const sortedR = [...st.ratings].sort((a, b) => b - a);
      st.avgRating = sortedR.length > 0
        ? Math.round(sortedR.reduce((a, b) => a + b, 0) / sortedR.length)
        : 0;
      const top5 = sortedR.slice(0, 5);
      st.top5Rating = top5.length > 0
        ? Math.round(top5.reduce((a, b) => a + b, 0) / top5.length)
        : 0;

      // Submission-level pass rate & problem-level first-try rate
      st.passRate = st.totalSubs > 0 ? Math.round((st.acCount / st.totalSubs) * 100) : 0;
      st.firstTryRate = st.acCount > 0 ? Math.round((st.firstTryCount / st.acCount) * 100) : 0;

      // 4-Dimensional Mastery Score (0 - 100)
      // 1. Volume (0 - 25)
      const volScore = Math.min(25, st.acCount * 0.65);
      // 2. Difficulty Capability vs User Benchmark (0 - 35)
      const effectiveR = st.top5Rating > 0 ? (st.top5Rating * 0.65 + st.avgRating * 0.35) : 0;
      const diffRatio = effectiveR > 0 ? (effectiveR / userBenchmarkRating) : 0;
      const diffScore = effectiveR > 0 ? Math.max(4, Math.min(35, (diffRatio - 0.55) * 60)) : 0;
      // 3. Pass Rate & 1A proficiency (0 - 25)
      const accScore = st.acCount > 0
        ? Math.min(25, (st.passRate / 100) * 16 + (st.firstTryRate / 100) * 9)
        : 0;
      // 4. Completion / Low Stuck Debt (0 - 15)
      const stuckRatio = st.attemptedCount > 0 ? (st.stuckCount / st.attemptedCount) : 0;
      const debtScore = st.attemptedCount > 0 ? Math.max(0, 15 * (1 - stuckRatio * 2.2)) : 0;

      st.masteryScore = Math.round(Math.min(99, Math.max(5, volScore + diffScore + accScore + debtScore)));
      if (st.acCount === 0) st.masteryScore = 5;

      // Categorize into 4 Quadrants:
      // 1) Blindspot: High-frequency tag with < 8 AC
      // 2) Weakness: High stuck count (>= 4 or stuckRatio >= 0.16) OR low passRate (< 48%) OR lagging difficulty with many fails
      // 3) Solid (Comfort Zone): Good AC count, low stuck, but avgRating is significantly below user rating
      // 4) Strength: High mastery, difficulty matches/exceeds benchmark, good pass rate
      if (st.acCount < 8 && CORE_CF_TAGS.includes(st.tag)) {
        st.category = 'blindspot';
      } else if (
        st.stuckCount >= 4 ||
        stuckRatio >= 0.16 ||
        st.passRate < 48 ||
        (st.acCount >= 8 && st.top5Rating < userBenchmarkRating - 80 && st.passRate < 60)
      ) {
        st.category = 'weakness';
      } else if (st.avgRating < userBenchmarkRating - 180 && st.top5Rating < userBenchmarkRating + 20) {
        st.category = 'solid';
      } else {
        st.category = 'strength';
      }

      return st;
    });

  // 8-Axis Radar Dimension Calculation
  const RADAR_DIMS = [
    { name: '动态规划 (DP)', tags: ['dp'] },
    { name: '图论与树论', tags: ['graphs', 'trees', 'dfs and similar', 'shortest paths', 'dsu'] },
    { name: '数学与数论', tags: ['math', 'number theory', 'combinatorics', 'probabilities'] },
    { name: '贪心与构造', tags: ['greedy', 'constructive algorithms', 'sortings', 'sorting'] },
    { name: '数据结构', tags: ['data structures', 'divide and conquer', 'hashing'] },
    { name: '二分与双指针', tags: ['binary search', 'two pointers', 'ternary search'] },
    { name: '字符串算法', tags: ['strings', 'string suffix structures'] },
    { name: '位运算/博弈/几何', tags: ['bitmasks', 'games', 'geometry'] }
  ];

  const radarScores = RADAR_DIMS.map((dim) => {
    const matched = tagDiagnostics.filter((t) => dim.tags.includes(t.tag) && t.acCount > 0);
    if (matched.length === 0) return { name: dim.name, score: 18 };
    const totalAc = matched.reduce((s, m) => s + m.acCount, 0);
    const weightedMastery = matched.reduce((s, m) => s + m.masteryScore * m.acCount, 0) / Math.max(1, totalAc);
    const maxScore = Math.max(...matched.map((m) => m.masteryScore));
    const finalScore = Math.min(98, Math.round(weightedMastery * 0.55 + maxScore * 0.45));
    return { name: dim.name, score: finalScore };
  });

  // =========================================================================
  // True Practice Rating Predictor (Recent Solved Difficulty Fitting)
  // =========================================================================
  const recentRatedSolved = [...ratedSolved]
    .sort((a, b) => b.firstAcTime - a.firstAcTime)
    .slice(0, 35);

  let practiceRating = currentRating;
  let recentAvgDiff = currentRating;
  let recentTop80Diff = currentRating;

  if (recentRatedSolved.length >= 3) {
    // Exponentially decay weights so newest solved problems matter more
    let weightSum = 0;
    let weightedRatingSum = 0;
    recentRatedSolved.forEach((p, idx) => {
      const w = Math.pow(0.94, idx);
      weightSum += w;
      weightedRatingSum += p.rating * w;
    });
    recentAvgDiff = Math.round(weightedRatingSum / weightSum);

    const sortedRec = [...recentRatedSolved].map((p) => p.rating).sort((a, b) => b - a);
    const topSlice = sortedRec.slice(0, Math.max(2, Math.ceil(sortedRec.length * 0.28)));
    recentTop80Diff = Math.round(topSlice.reduce((a, b) => a + b, 0) / topSlice.length);

    const rec1ARate = recentRatedSolved.filter((p) => p.attemptsBeforeAc === 0).length / recentRatedSolved.length;
    const proficiencyBonus = Math.round((rec1ARate - 0.45) * 140);

    // Combine top capability ceiling (60%), weighted recent average (40%), and 1A bonus
    practiceRating = Math.round(recentTop80Diff * 0.62 + recentAvgDiff * 0.38 + proficiencyBonus);
    practiceRating = Math.max(800, Math.min(3500, practiceRating));
  }

  return {
    userInfo,
    currentRating,
    maxRating,
    totalSubmissions: submissions.length,
    allProblems,
    solvedProblems,
    stuckProblems,
    solved1A,
    maxSolvedRating,
    avgSolvedRating,
    recent30DaysCount: recent30DaysSolved.length,
    activeDaysCount: activeDaysSet.size,
    verdictCounts,
    dailyActivity,
    ratingBuckets,
    tagDiagnostics,
    radarScores,
    ratingHistory,
    practiceRating,
    recentAvgDiff,
    recentTop80Diff
  };
}

/* ==========================================================================
   Contest Elo-MMR Delta Simulator Engine
   ========================================================================== */
const CONTEST_POOLS = {
  div3: { label: 'Div. 3 (约 18,000 人)', size: 18000, mean: 1120, scale: 330 },
  div2: { label: 'Div. 2 标准场 (约 12,000 人)', size: 12000, mean: 1340, scale: 360 },
  edu:  { label: 'Educational Div. 2 (约 14,000 人)', size: 14000, mean: 1360, scale: 370 },
  div12:{ label: 'Div. 1 + Div. 2 联合场 (约 15,000 人)', size: 15000, mean: 1460, scale: 420 },
  div1: { label: 'Div. 1 独立场 (约 2,500 人)', size: 2500, mean: 2080, scale: 310 }
};

function simulateContestOutcome(baseRating, contestType, rank) {
  const pool = CONTEST_POOLS[contestType] || CONTEST_POOLS.div2;
  const clampedRank = Math.max(1, Math.min(pool.size - 1, Number(rank) || 1));

  // Elo-MMR logistic performance mapping
  const ratio = (pool.size - clampedRank + 0.5) / (clampedRank - 0.5);
  const perf = Math.round(pool.mean + pool.scale * Math.log10(ratio));
  const delta = Math.round((perf - baseRating) / 3.8);
  const newRating = Math.max(0, baseRating + delta);

  // Also calculate break-even rank (where perf == baseRating)
  const breakEvenRatio = Math.pow(10, (baseRating - pool.mean) / pool.scale);
  const breakEvenRank = Math.max(1, Math.min(pool.size, Math.round((pool.size + 0.5) / (1 + breakEvenRatio))));

  return {
    pool,
    rank: clampedRank,
    perf,
    delta,
    newRating,
    breakEvenRank
  };
}

function estimateRankForTargetDelta(baseRating, contestType, targetDelta) {
  const pool = CONTEST_POOLS[contestType] || CONTEST_POOLS.div2;
  const neededPerf = baseRating + targetDelta * 3.8;
  const ratio = Math.pow(10, (neededPerf - pool.mean) / pool.scale);
  const rank = Math.round((pool.size + 0.5) / (1 + ratio));
  return Math.max(1, Math.min(pool.size, rank));
}

/* ==========================================================================
   UI Rendering & ECharts Initialization
   ========================================================================== */
function getOrCreateChart(domId) {
  const dom = document.getElementById(domId);
  if (!dom) return null;
  if (state.charts[domId]) {
    state.charts[domId].resize();
    return state.charts[domId];
  }
  const chart = echarts.init(dom);
  state.charts[domId] = chart;
  return chart;
}

function resizeAllCharts() {
  Object.values(state.charts).forEach((c) => {
    if (c && typeof c.resize === 'function') c.resize();
  });
}

function renderAllViews() {
  if (!state.analysis) return;
  const A = state.analysis;
  const rankInfo = getCfRankInfo(A.currentRating);
  const maxRankInfo = getCfRankInfo(A.maxRating);

  // 1. Sidebar & Header Profile
  const handleEl = document.getElementById('sidebar-handle');
  handleEl.textContent = A.userInfo.handle || state.config.activeHandle;
  handleEl.style.color = rankInfo.color;

  const rankEl = document.getElementById('sidebar-rank');
  rankEl.textContent = rankInfo.cn;
  rankEl.style.color = rankInfo.color;

  const ratingEl = document.getElementById('sidebar-rating');
  ratingEl.textContent = A.currentRating || 'Unrated';
  ratingEl.style.color = rankInfo.color;

  const maxRatingEl = document.getElementById('sidebar-max-rating');
  maxRatingEl.textContent = A.maxRating || '-';
  maxRatingEl.style.color = maxRankInfo.color;

  const avatarEl = document.getElementById('sidebar-avatar');
  if (A.userInfo.titlePhoto && A.userInfo.titlePhoto.startsWith('http')) {
    avatarEl.innerHTML = `<img src="${A.userInfo.titlePhoto}" alt="avatar" />`;
  } else {
    avatarEl.textContent = (A.userInfo.handle || 'CF').slice(0, 2).toUpperCase();
  }

  // Demo Banner visibility
  const demoBanner = document.getElementById('demo-notice-banner');
  if (demoBanner) {
    demoBanner.style.display = state.rawData.isDemo ? 'flex' : 'none';
  }

  document.getElementById('sidebar-mode-tag').textContent = state.rawData.isDemo
    ? '模式：内置演示数据 (离线可用)'
    : (state.config.apiKey ? '模式：官方 API (SHA-512 签名已启用)' : '模式：官方公开 API 实时连接');

  const syncTimeStr = state.rawData.syncedAt ? formatDateTime(Math.floor(state.rawData.syncedAt / 1000)) : '刚刚';
  document.getElementById('sidebar-sync-time').textContent = `上次同步：${syncTimeStr}`;

  // Badges on sidebar
  document.getElementById('nav-ac-badge').textContent = `${A.solvedProblems.length} AC`;
  const weakCount = A.tagDiagnostics.filter((t) => t.category === 'weakness' || t.category === 'blindspot').length;
  document.getElementById('nav-weak-badge').textContent = `${weakCount} 待提升`;

  renderOverviewTab();
  renderProblemsTab();
  renderTagsTab();
  renderContestsTab();
  renderPredictorTab();
  renderSettingsTab();

  setTimeout(resizeAllCharts, 60);
}

/* --------------------------------------------------------------------------
   Tab 1: Overview Dashboard
   -------------------------------------------------------------------------- */
function renderOverviewTab() {
  const A = state.analysis;
  const rankInfo = getCfRankInfo(A.currentRating);
  const predRankInfo = getCfRankInfo(A.practiceRating);

  const kpiRating = document.getElementById('ov-kpi-rating');
  kpiRating.textContent = A.currentRating;
  kpiRating.style.color = rankInfo.color;
  document.getElementById('ov-kpi-rating-sub').textContent = `最高: ${A.maxRating} | ${rankInfo.cn}`;

  const oneARate = A.solvedProblems.length > 0
    ? Math.round((A.solved1A.length / A.solvedProblems.length) * 100)
    : 0;
  document.getElementById('ov-kpi-solved').textContent = `${A.solvedProblems.length} 题`;
  document.getElementById('ov-kpi-solved-sub').textContent = `总提交: ${A.totalSubmissions} | 一发入魂率: ${oneARate}%`;

  const kpiPred = document.getElementById('ov-kpi-pred');
  const diffGap = A.practiceRating - A.currentRating;
  kpiPred.textContent = `${A.practiceRating}`;
  kpiPred.style.color = predRankInfo.color;
  document.getElementById('ov-kpi-pred-sub').textContent =
    diffGap >= 0
      ? `高于当前 Rating +${diffGap} 分 (${predRankInfo.title})`
      : `距当前 Rating ${diffGap} 分 (建议提高刷题难度)`;

  const weakTags = A.tagDiagnostics.filter((t) => t.category === 'weakness');
  document.getElementById('ov-kpi-weak').textContent = `${weakTags.length} 个薄弱项`;
  document.getElementById('ov-kpi-weak-sub').textContent = `积压待补题目: ${A.stuckProblems.length} 道`;

  // Overview Rating Chart
  const ratingChart = getOrCreateChart('chart-overview-rating');
  if (ratingChart) {
    const xData = A.ratingHistory.map((r) => formatDate(r.ratingUpdateTimeSeconds));
    const yData = A.ratingHistory.map((r) => r.newRating);
    ratingChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 }
      },
      grid: { left: 45, right: 24, top: 24, bottom: 28 },
      xAxis: {
        type: 'category',
        data: xData.length ? xData : ['暂无比赛'],
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        axisLine: { lineStyle: { color: '#374151' } }
      },
      yAxis: {
        type: 'value',
        min: (val) => Math.max(600, Math.floor((val.min - 150) / 100) * 100),
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      series: [
        {
          name: '比赛 Rating',
          type: 'line',
          smooth: 0.25,
          data: yData.length ? yData : [A.currentRating],
          symbolSize: 7,
          itemStyle: { color: '#3b82f6' },
          lineStyle: { width: 3, color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
            ])
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#10b981', width: 2 },
            label: {
              formatter: `刷题实力拟合: ${A.practiceRating}`,
              color: '#34d399',
              position: 'insideEndTop'
            },
            data: [{ yAxis: A.practiceRating }]
          }
        }
      ]
    });
  }

  // Overview Radar Chart
  const radarChart = getOrCreateChart('chart-overview-radar');
  if (radarChart) {
    radarChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6' }
      },
      radar: {
        radius: '66%',
        indicator: A.radarScores.map((d) => ({ name: d.name, max: 100 })),
        axisName: { color: '#d1d5db', fontSize: 11.5 },
        splitArea: {
          areaStyle: {
            color: ['rgba(59,130,246,0.03)', 'rgba(59,130,246,0.07)']
          }
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: A.radarScores.map((d) => d.score),
              name: '核心算法掌握度',
              symbolSize: 6,
              itemStyle: { color: '#8b5cf6' },
              lineStyle: { width: 2.5, color: '#8b5cf6' },
              areaStyle: { color: 'rgba(139, 92, 246, 0.32)' }
            }
          ]
        }
      ]
    });
  }

  // Strengths vs Weaknesses Quick Summary
  const strengths = [...A.tagDiagnostics]
    .filter((t) => t.category === 'strength')
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .slice(0, 4);
  const weaknesses = [...A.tagDiagnostics]
    .filter((t) => t.category === 'weakness' || t.category === 'blindspot')
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 4);

  const highlightBox = document.getElementById('ov-tag-highlights');
  highlightBox.innerHTML = `
    <div style="margin-bottom: 14px;">
      <div style="font-size: 12px; color: #34d399; font-weight: 700; margin-bottom: 8px;">🟢 拿手强项 (高掌握度 & 高通过率)</div>
      <div class="tag-chip-list">
        ${strengths.map((t) => `
          <div class="tag-chip" data-jump-tag="${t.tag}">
            <span>${t.cnName}</span>
            <span class="tag-chip-meta">${t.acCount}题 · 均难${t.avgRating} · ${t.passRate}%通过</span>
          </div>
        `).join('') || '<span style="color:var(--text-muted);font-size:12px;">暂无数据</span>'}
      </div>
    </div>
    <div>
      <div style="font-size: 12px; color: #fbbf24; font-weight: 700; margin-bottom: 8px;">🟠 待改进短板 (建议优先补题与专项训练)</div>
      <div class="tag-chip-list">
        ${weaknesses.map((t) => `
          <div class="tag-chip" style="border-color: rgba(245,158,11,0.35);" data-jump-tag="${t.tag}">
            <span>${t.cnName}</span>
            <span class="tag-chip-meta">${t.acCount}题 · 待补${t.stuckCount}题 · ${t.passRate}%通过</span>
          </div>
        `).join('') || '<span style="color:var(--text-muted);font-size:12px;">暂无明显短板</span>'}
      </div>
    </div>
  `;

  // Recent Submissions Feed
  const recentTbody = document.getElementById('ov-recent-tbody');
  recentTbody.innerHTML = A.allProblems.slice(0, 8).map((p) => {
    const rColor = getProblemRatingColor(p.rating);
    const statusBadge = p.solved
      ? (p.attemptsBeforeAc === 0
          ? '<span class="badge badge-green">1A 通过</span>'
          : `<span class="badge badge-blue">AC (${p.totalAttempts}次)</span>`)
      : `<span class="badge badge-rose">待补题 (${p.totalAttempts}次失败)</span>`;
    return `
      <tr>
        <td>
          <button class="link-btn problem-link" data-cid="${p.contestId}" data-idx="${p.index}">
            ${p.id}. ${p.name}
          </button>
        </td>
        <td><span style="color:${rColor}; font-weight:700;">${p.rating || '-'}</span></td>
        <td>${statusBadge}</td>
        <td style="color:var(--text-secondary);">${formatDateTime(p.lastSubTime)}</td>
      </tr>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   Tab 2: Problem Solving Statistics
   -------------------------------------------------------------------------- */
function renderProblemsTab() {
  const A = state.analysis;
  const oneARate = A.solvedProblems.length > 0
    ? Math.round((A.solved1A.length / A.solvedProblems.length) * 100)
    : 0;
  const totalPassRate = A.totalSubmissions > 0
    ? Math.round((A.verdictCounts.OK / A.totalSubmissions) * 100)
    : 0;

  document.getElementById('prob-kpi-ac').textContent = `${A.solvedProblems.length}`;
  document.getElementById('prob-kpi-attempted').textContent = `累计尝试过 ${A.allProblems.length} 道独立题目 (${A.stuckProblems.length} 道待补)`;

  const maxRColor = getProblemRatingColor(A.maxSolvedRating);
  const maxREl = document.getElementById('prob-kpi-max-rating');
  maxREl.textContent = A.maxSolvedRating || '-';
  maxREl.style.color = maxRColor;
  document.getElementById('prob-kpi-avg-rating').textContent = `全部 AC 题目平均难度: ${A.avgSolvedRating || '-'}`;

  document.getElementById('prob-kpi-1a').textContent = `${oneARate}%`;
  document.getElementById('prob-kpi-passrate').textContent = `总提交通过率: ${totalPassRate}% (${A.verdictCounts.OK}/${A.totalSubmissions})`;

  document.getElementById('prob-kpi-days').textContent = `${A.activeDaysCount} 天`;
  document.getElementById('prob-kpi-recent30').textContent = `近 30 天新攻克: ${A.recent30DaysCount} 道题`;

  // Rating Distribution Bar Chart
  const rChart = getOrCreateChart('chart-problem-rating');
  if (rChart) {
    const keys = Object.keys(A.ratingBuckets).map(Number).sort((a, b) => a - b);
    rChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6' },
        formatter: (params) => {
          const p = params[0];
          return `难度 <b>${p.name}</b><br/>已通过: <b>${p.value}</b> 题`;
        }
      },
      grid: { left: 42, right: 18, top: 22, bottom: 32 },
      xAxis: {
        type: 'category',
        data: keys.map((k) => (k === 2600 ? '2600+' : String(k))),
        axisLabel: { color: '#9ca3af', fontSize: 11, rotate: 30 },
        axisLine: { lineStyle: { color: '#374151' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 26,
          data: keys.map((k) => ({
            value: A.ratingBuckets[k],
            itemStyle: {
              color: getProblemRatingColor(k),
              borderRadius: [4, 4, 0, 0]
            }
          }))
        }
      ]
    });
  }

  // Verdict Donut Chart
  const vChart = getOrCreateChart('chart-problem-verdict');
  if (vChart) {
    const vData = [
      { name: 'Accepted (AC)', value: A.verdictCounts.OK, color: '#10b981' },
      { name: 'Wrong Answer (WA)', value: A.verdictCounts.WRONG_ANSWER, color: '#f43f5e' },
      { name: 'Time Limit (TLE)', value: A.verdictCounts.TIME_LIMIT_EXCEEDED, color: '#f59e0b' },
      { name: 'Runtime Error (RE)', value: A.verdictCounts.RUNTIME_ERROR, color: '#8b5cf6' },
      { name: 'Memory Limit (MLE)', value: A.verdictCounts.MEMORY_LIMIT_EXCEEDED, color: '#06b6d4' },
      { name: 'Compile Error (CE)', value: A.verdictCounts.COMPILATION_ERROR, color: '#6b7280' }
    ].filter((d) => d.value > 0);

    vChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6' },
        formatter: '{b}: <b>{c}</b> 次 ({d}%)'
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#9ca3af', fontSize: 11 }
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '70%'],
          center: ['50%', '43%'],
          avoidLabelOverlap: true,
          label: { show: false },
          data: vData.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: d.color }
          }))
        }
      ]
    });
  }

  // 365-Day Activity Heatmap
  const hChart = getOrCreateChart('chart-problem-heatmap');
  if (hChart) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 364 * 86400 * 1000);
    const startStr = formatDate(Math.floor(startDate.getTime() / 1000));
    const endStr = formatDate(Math.floor(endDate.getTime() / 1000));

    const heatmapData = [];
    for (let t = startDate.getTime(); t <= endDate.getTime(); t += 86400 * 1000) {
      const dStr = formatDate(Math.floor(t / 1000));
      heatmapData.push([dStr, A.dailyActivity.get(dStr) || 0]);
    }

    hChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 },
        formatter: (p) => `${p.data[0]}<br/>提交次数: <b>${p.data[1]}</b> 次`
      },
      visualMap: {
        min: 0,
        max: 10,
        show: false,
        inRange: {
          color: ['#161f30', '#064e3b', '#059669', '#10b981', '#34d399']
        }
      },
      calendar: {
        top: 26,
        left: 40,
        right: 20,
        cellSize: ['auto', 15],
        range: [startStr, endStr],
        itemStyle: {
          borderWidth: 3,
          borderColor: '#0b0f19'
        },
        splitLine: { show: false },
        yearLabel: { show: false },
        monthLabel: { color: '#9ca3af', fontSize: 11 },
        dayLabel: { color: '#6b7280', fontSize: 10, firstDay: 1 }
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: heatmapData
        }
      ]
    });
  }

  // Populate Tag filter dropdown
  const tagSelect = document.getElementById('prob-filter-tag');
  const currentTagVal = tagSelect.value || 'all';
  const sortedTags = [...A.tagDiagnostics].filter((t) => t.attemptedCount > 0).sort((a, b) => b.acCount - a.acCount);
  tagSelect.innerHTML = `<option value="all">全部 Tag 标签 (${sortedTags.length})</option>` +
    sortedTags.map((t) => `<option value="${t.tag}">${t.cnName} (${t.acCount}/${t.attemptedCount})</option>`).join('');
  tagSelect.value = sortedTags.some((t) => t.tag === currentTagVal) ? currentTagVal : 'all';

  renderProblemExplorerTable();
}

function renderProblemExplorerTable() {
  if (!state.analysis) return;
  const statusFilter = document.getElementById('prob-filter-status').value;
  const tagFilter = document.getElementById('prob-filter-tag').value;
  const searchKw = (document.getElementById('prob-filter-search').value || '').trim().toLowerCase();

  let list = state.analysis.allProblems;
  if (statusFilter === 'ac') list = list.filter((p) => p.solved);
  if (statusFilter === 'stuck') list = list.filter((p) => !p.solved);
  if (statusFilter === '1a') list = list.filter((p) => p.solved && p.attemptsBeforeAc === 0);

  if (tagFilter !== 'all') {
    list = list.filter((p) => p.tags.includes(tagFilter));
  }
  if (searchKw) {
    list = list.filter(
      (p) => p.id.toLowerCase().includes(searchKw) || p.name.toLowerCase().includes(searchKw)
    );
  }

  const tbody = document.getElementById('prob-table-tbody');
  tbody.innerHTML = list.slice(0, 120).map((p) => {
    const rColor = getProblemRatingColor(p.rating);
    const statusHtml = p.solved
      ? (p.attemptsBeforeAc === 0
          ? '<span class="badge badge-green">⚡ 1A 一遍过</span>'
          : `<span class="badge badge-blue">✅ AC (${p.totalAttempts}次提交)</span>`)
      : `<span class="badge badge-rose">❌ 待补题 (${p.totalAttempts}次未过)</span>`;

    return `
      <tr>
        <td style="font-weight:700; color:#93c5fd;">${p.id}</td>
        <td>
          <button class="link-btn problem-link" data-cid="${p.contestId}" data-idx="${p.index}">
            ${p.name} ↗
          </button>
        </td>
        <td><span style="color:${rColor}; font-weight:800;">${p.rating || 'Unrated'}</span></td>
        <td>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            ${p.tags.slice(0, 4).map((t) => `<span class="badge" style="background:rgba(255,255,255,0.06);color:#d1d5db;">${formatTagName(t)}</span>`).join('')}
          </div>
        </td>
        <td>${statusHtml}</td>
        <td style="color:var(--text-secondary);">${formatDate(p.lastSubTime)}</td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">没有匹配的题目记录</td></tr>`;
}

/* --------------------------------------------------------------------------
   Tab 3: Tag Mastery & Weakness Diagnostics (CORE FEATURE)
   -------------------------------------------------------------------------- */
function renderTagsTab() {
  const A = state.analysis;
  const tags = A.tagDiagnostics;

  const strengths = tags.filter((t) => t.category === 'strength').sort((a, b) => b.masteryScore - a.masteryScore);
  const solids = tags.filter((t) => t.category === 'solid').sort((a, b) => b.acCount - a.acCount);
  const weaknesses = tags.filter((t) => t.category === 'weakness').sort((a, b) => a.masteryScore - b.masteryScore);
  const blindspots = tags.filter((t) => t.category === 'blindspot').sort((a, b) => a.acCount - b.acCount);

  document.getElementById('quad-count-strength').textContent = `${strengths.length} 个标签`;
  document.getElementById('quad-count-solid').textContent = `${solids.length} 个标签`;
  document.getElementById('quad-count-weakness').textContent = `${weaknesses.length} 个标签`;
  document.getElementById('quad-count-blindspot').textContent = `${blindspots.length} 个标签`;

  const renderChips = (arr, emptyText) =>
    arr.map((t) => `
      <div class="tag-chip" data-select-rec-tag="${t.tag}" title="点击查看该 Tag 的推荐练习题">
        <span>${t.cnName}</span>
        <span class="tag-chip-meta">${t.acCount}AC · 均难${t.avgRating || '-'} · 评分${t.masteryScore}</span>
      </div>
    `).join('') || `<span style="color:var(--text-muted);font-size:12px;">${emptyText}</span>`;

  document.getElementById('quad-list-strength').innerHTML = renderChips(strengths, '继续加油积累优势标签');
  document.getElementById('quad-list-solid').innerHTML = renderChips(solids, '暂无舒适区低分标签');
  document.getElementById('quad-list-weakness').innerHTML = renderChips(weaknesses, '太棒了！暂无明显薄弱标签');
  document.getElementById('quad-list-blindspot').innerHTML = renderChips(blindspots, '高频核心标签均已覆盖');

  // Scatter Chart: Avg Rating (X) vs Pass Rate (Y), Bubble Size = AC Count
  const scatterChart = getOrCreateChart('chart-tag-scatter');
  if (scatterChart) {
    const activeTags = tags.filter((t) => t.acCount > 0);
    const catColors = {
      strength: '#10b981',
      solid: '#3b82f6',
      weakness: '#f59e0b',
      blindspot: '#a855f7'
    };

    scatterChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 },
        formatter: (p) => {
          const d = p.data.raw;
          return `<b>${d.cnName}</b><br/>` +
                 `掌握度评分: <b>${d.masteryScore}</b> / 100<br/>` +
                 `已通过: <b>${d.acCount}</b> 题 (待补 ${d.stuckCount} 题)<br/>` +
                 `平均攻克难度: <b>${d.avgRating}</b> (Top5: ${d.top5Rating})<br/>` +
                 `提交通过率: <b>${d.passRate}%</b>`;
        }
      },
      grid: { left: 46, right: 28, top: 28, bottom: 38 },
      xAxis: {
        name: '平均攻克难度',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        type: 'value',
        min: (v) => Math.max(800, Math.floor((v.min - 100) / 100) * 100),
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      yAxis: {
        name: '提交通过率 (%)',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      series: [
        {
          type: 'scatter',
          symbolSize: (val) => Math.max(12, Math.min(44, Math.sqrt(val[2]) * 5.2)),
          label: {
            show: true,
            formatter: (p) => p.data.raw.tag,
            position: 'top',
            color: '#d1d5db',
            fontSize: 10.5
          },
          data: activeTags.map((t) => ({
            value: [t.avgRating, t.passRate, t.acCount],
            raw: t,
            itemStyle: {
              color: catColors[t.category] || '#3b82f6',
              opacity: 0.86
            }
          })),
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.22)' },
            data: [
              { xAxis: A.currentRating, name: '当前 Rating' },
              { yAxis: 50, name: '50% 通过率基准' }
            ]
          }
        }
      ]
    });
  }

  // Bar Chart: Top 14 Tags Solved vs Stuck
  const barChart = getOrCreateChart('chart-tag-bar');
  if (barChart) {
    const topTags = [...tags]
      .filter((t) => t.attemptedCount > 0)
      .sort((a, b) => b.attemptedCount - a.attemptedCount)
      .slice(0, 12)
      .reverse();

    barChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 }
      },
      legend: {
        top: 0,
        textStyle: { color: '#9ca3af', fontSize: 11.5 }
      },
      grid: { left: 135, right: 20, top: 28, bottom: 24 },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      yAxis: {
        type: 'category',
        data: topTags.map((t) => t.cnName),
        axisLabel: { color: '#d1d5db', fontSize: 11 }
      },
      series: [
        {
          name: '已通过 (AC)',
          type: 'bar',
          stack: 'total',
          data: topTags.map((t) => t.acCount),
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: '待补题 (未AC)',
          type: 'bar',
          stack: 'total',
          data: topTags.map((t) => t.stuckCount),
          itemStyle: { color: '#f43f5e', borderRadius: [0, 4, 4, 0] }
        }
      ]
    });
  }

  // Populate Weak-Tag Recommender Select
  const recSelect = document.getElementById('rec-tag-select');
  const priorityTags = [...weaknesses, ...blindspots, ...solids, ...strengths];
  recSelect.innerHTML = `<option value="auto_weak">🔥 智能混推所有薄弱/盲区标签</option>` +
    priorityTags.map((t) => {
      const prefix = t.category === 'weakness' ? '🟠 [待改进]' : (t.category === 'blindspot' ? '⚪ [盲区]' : '🟢');
      return `<option value="${t.tag}">${prefix} ${t.cnName}</option>`;
    }).join('');

  renderRecommendedProblems();
  renderStuckProblemsQueue();
  renderTagDiagnosticTable();
}

function renderRecommendedProblems() {
  if (!state.analysis || !state.rawData) return;
  const A = state.analysis;
  const pool = Array.isArray(state.rawData.problemPool) ? state.rawData.problemPool : [];
  const solvedIds = new Set(A.solvedProblems.map((p) => p.id));

  const selectedTag = document.getElementById('rec-tag-select').value || 'auto_weak';
  const diffMode = document.getElementById('rec-diff-select').value || 'push';

  const baseR = Math.max(1000, A.currentRating);
  let minR = baseR - 100;
  let maxR = baseR + 150;
  if (diffMode === 'push') {
    minR = baseR - 50;
    maxR = baseR + 250;
  } else if (diffMode === 'hard') {
    minR = baseR + 100;
    maxR = baseR + 400;
  }

  const weakTagNames = new Set(
    A.tagDiagnostics
      .filter((t) => t.category === 'weakness' || t.category === 'blindspot')
      .map((t) => t.tag)
  );

  let candidates = pool.filter((p) => {
    const pid = `${p.contestId}${p.index}`;
    if (solvedIds.has(pid)) return false;
    const cleanTags = (p.tags || []).map((t) => String(t).trim().toLowerCase());
    if (selectedTag === 'auto_weak') {
      return weakTagNames.size === 0 || cleanTags.some((t) => weakTagNames.has(t));
    } else {
      return cleanTags.includes(selectedTag);
    }
  });

  // Sort by closeness to target difficulty window
  const targetMid = (minR + maxR) / 2;
  candidates.sort((a, b) => Math.abs((a.rating || 1500) - targetMid) - Math.abs((b.rating || 1500) - targetMid));

  const tbody = document.getElementById('rec-problems-tbody');
  tbody.innerHTML = candidates.slice(0, 10).map((p) => {
    const rColor = getProblemRatingColor(p.rating);
    const cleanTags = (p.tags || []).map((t) => String(t).trim().toLowerCase());
    return `
      <tr>
        <td style="font-weight:700; color:#93c5fd;">${p.contestId}${p.index}</td>
        <td>
          <button class="link-btn problem-link" data-cid="${p.contestId}" data-idx="${p.index}">
            ${p.name}
          </button>
        </td>
        <td><span style="color:${rColor}; font-weight:800;">${p.rating}</span></td>
        <td>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            ${cleanTags.slice(0, 3).map((t) => `<span class="badge" style="background:rgba(255,255,255,0.06);color:#d1d5db;">${formatTagName(t)}</span>`).join('')}
          </div>
        </td>
        <td>
          <button class="btn-top-action problem-link" data-cid="${p.contestId}" data-idx="${p.index}" style="padding:3px 8px;font-size:11px;">
            去挑战 ↗
          </button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:18px;">暂无匹配推荐题，可切换难度档位查看</td></tr>`;
}

function renderStuckProblemsQueue() {
  if (!state.analysis) return;
  const stuck = state.analysis.stuckProblems;
  const tbody = document.getElementById('stuck-problems-tbody');

  tbody.innerHTML = stuck.slice(0, 25).map((p) => {
    const rColor = getProblemRatingColor(p.rating);
    return `
      <tr>
        <td style="font-weight:700; color:#fda4af;">${p.id}</td>
        <td>
          <button class="link-btn problem-link" data-cid="${p.contestId}" data-idx="${p.index}">
            ${p.name} ↗
          </button>
        </td>
        <td><span style="color:${rColor}; font-weight:800;">${p.rating || '-'}</span></td>
        <td>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            ${p.tags.slice(0, 3).map((t) => `<span class="badge" style="background:rgba(255,255,255,0.06);color:#d1d5db;">${formatTagName(t)}</span>`).join('')}
          </div>
        </td>
        <td><span class="badge badge-rose">${p.totalAttempts} 次未过</span></td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5" style="text-align:center;color:#34d399;padding:20px;">🎉 太强了！当前没有任何积压未过的题目！</td></tr>`;
}

function renderTagDiagnosticTable() {
  if (!state.analysis) return;
  const sortMode = document.getElementById('tag-table-sort').value || 'mastery_desc';
  const list = [...state.analysis.tagDiagnostics];

  if (sortMode === 'mastery_desc') list.sort((a, b) => b.masteryScore - a.masteryScore);
  if (sortMode === 'mastery_asc') list.sort((a, b) => a.masteryScore - b.masteryScore);
  if (sortMode === 'ac_desc') list.sort((a, b) => b.acCount - a.acCount);
  if (sortMode === 'rating_desc') list.sort((a, b) => b.avgRating - a.avgRating);
  if (sortMode === 'stuck_desc') list.sort((a, b) => b.stuckCount - a.stuckCount);

  const catBadgeMap = {
    strength: '<span class="badge badge-green">🟢 优势擅长</span>',
    solid: '<span class="badge badge-blue">🔵 常规巩固</span>',
    weakness: '<span class="badge badge-amber">🟠 薄弱待改进</span>',
    blindspot: '<span class="badge badge-purple">⚪ 高频盲区</span>'
  };

  const tbody = document.getElementById('tag-diagnostic-tbody');
  tbody.innerHTML = list.map((t) => {
    const barColor =
      t.masteryScore >= 72 ? '#10b981' : (t.masteryScore >= 50 ? '#3b82f6' : '#f59e0b');
    return `
      <tr>
        <td style="font-weight:700;">${t.cnName}</td>
        <td>${catBadgeMap[t.category] || ''}</td>
        <td>
          <div class="mastery-bar-bg">
            <div class="mastery-bar-fill" style="width:${t.masteryScore}%; background:${barColor};"></div>
          </div>
          <span style="font-weight:700; color:${barColor};">${t.masteryScore}</span>
        </td>
        <td style="font-weight:700;">${t.acCount} 题</td>
        <td>${t.stuckCount > 0 ? `<span style="color:#fb7185;font-weight:700;">${t.stuckCount} 题</span>` : '<span style="color:var(--text-muted);">0</span>'}</td>
        <td>${t.passRate}% <span style="color:var(--text-muted);font-size:11px;">(1A: ${t.firstTryRate}%)</span></td>
        <td style="color:${getProblemRatingColor(t.avgRating)}; font-weight:700;">${t.avgRating || '-'}</td>
        <td style="color:${getProblemRatingColor(t.top5Rating)}; font-weight:700;">${t.top5Rating || '-'}</td>
        <td>
          <button class="link-btn" data-select-rec-tag="${t.tag}">推题训练 →</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   Tab 4: Contest Performance & History
   -------------------------------------------------------------------------- */
function renderContestsTab() {
  const A = state.analysis;
  const contests = A.ratingHistory;

  const totalC = contests.length;
  const winCount = contests.filter((c) => c.newRating > c.oldRating).length;
  const winRate = totalC > 0 ? Math.round((winCount / totalC) * 100) : 0;

  const deltas = contests.map((c) => c.newRating - c.oldRating);
  const maxUp = deltas.length > 0 ? Math.max(0, ...deltas) : 0;
  const maxDown = deltas.length > 0 ? Math.min(0, ...deltas) : 0;
  const recent5Net = deltas.slice(-5).reduce((a, b) => a + b, 0);

  const ranks = contests.map((c) => c.rank).filter((r) => r > 0);
  const bestRank = ranks.length > 0 ? Math.min(...ranks) : 0;
  const avgRank = ranks.length > 0 ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : 0;

  document.getElementById('contest-kpi-count').textContent = `${totalC} 场`;
  document.getElementById('contest-kpi-winrate').textContent = `上分场次占比: ${winRate}% (${winCount}/${totalC})`;

  const peakEl = document.getElementById('contest-kpi-peak');
  peakEl.textContent = A.maxRating || '-';
  peakEl.style.color = getCfRankInfo(A.maxRating).color;
  document.getElementById('contest-kpi-cur').textContent = `当前 Rating: ${A.currentRating}`;

  document.getElementById('contest-kpi-maxdelta').innerHTML =
    `<span style="color:#34d399;">+${maxUp}</span> / <span style="color:#fb7185;">${maxDown}</span>`;
  document.getElementById('contest-kpi-avgdelta').textContent =
    `近 5 场累计净变化: ${recent5Net >= 0 ? '+' + recent5Net : recent5Net}`;

  document.getElementById('contest-kpi-bestrank').textContent = bestRank ? `#${bestRank}` : '-';
  document.getElementById('contest-kpi-avgrank').textContent = avgRank ? `历史场均排名: #${avgRank}` : '暂无排名记录';

  // Full Rating Curve Chart with Tier Background Bands
  const cChart = getOrCreateChart('chart-contest-rating');
  if (cChart) {
    const xDates = contests.map((c) => formatDate(c.ratingUpdateTimeSeconds));
    const yRatings = contests.map((c) => c.newRating);

    cChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 },
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const c = contests[idx];
          if (!c) return '';
          const delta = c.newRating - c.oldRating;
          const dStr = delta >= 0 ? `<span style="color:#34d399;">+${delta}</span>` : `<span style="color:#fb7185;">${delta}</span>`;
          return `<b>${c.contestName}</b><br/>` +
                 `日期: ${formatDate(c.ratingUpdateTimeSeconds)}<br/>` +
                 `排名: <b>#${c.rank}</b><br/>` +
                 `Rating: ${c.oldRating} → <b>${c.newRating}</b> (${dStr})`;
        }
      },
      grid: { left: 48, right: 26, top: 24, bottom: 52 },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', height: 18, bottom: 10, borderColor: 'transparent', textStyle: { color: '#9ca3af' } }
      ],
      xAxis: {
        type: 'category',
        data: xDates.length ? xDates : ['暂无参赛记录'],
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        axisLine: { lineStyle: { color: '#374151' } }
      },
      yAxis: {
        type: 'value',
        min: (v) => Math.max(700, Math.floor((v.min - 150) / 100) * 100),
        max: (v) => Math.max(2000, Math.ceil((v.max + 150) / 100) * 100),
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      series: [
        {
          type: 'line',
          data: yRatings.length ? yRatings : [A.currentRating],
          symbolSize: 8,
          itemStyle: { color: '#facc15', borderColor: '#111827', borderWidth: 2 },
          lineStyle: { width: 3, color: '#3b82f6' },
          markArea: {
            silent: true,
            data: [
              [{ yAxis: 0, itemStyle: { color: 'rgba(156, 163, 175, 0.05)' } }, { yAxis: 1200 }],
              [{ yAxis: 1200, itemStyle: { color: 'rgba(34, 197, 94, 0.05)' } }, { yAxis: 1400 }],
              [{ yAxis: 1400, itemStyle: { color: 'rgba(6, 182, 212, 0.05)' } }, { yAxis: 1600 }],
              [{ yAxis: 1600, itemStyle: { color: 'rgba(59, 130, 246, 0.06)' } }, { yAxis: 1900 }],
              [{ yAxis: 1900, itemStyle: { color: 'rgba(168, 85, 247, 0.06)' } }, { yAxis: 2100 }],
              [{ yAxis: 2100, itemStyle: { color: 'rgba(245, 158, 11, 0.06)' } }, { yAxis: 2400 }],
              [{ yAxis: 2400, itemStyle: { color: 'rgba(239, 68, 68, 0.06)' } }, { yAxis: 4000 }]
            ]
          }
        }
      ]
    });
  }

  // Contest History Table (Newest first)
  const historyTbody = document.getElementById('contest-history-tbody');
  const reversedContests = [...contests].reverse();
  historyTbody.innerHTML = reversedContests.map((c, idx) => {
    const seq = contests.length - idx;
    const delta = c.newRating - c.oldRating;
    const estPerf = c.oldRating + delta * 4;
    const perfColor = getCfRankInfo(estPerf).color;
    const newColor = getCfRankInfo(c.newRating).color;
    const deltaBadge = delta >= 0
      ? `<span class="badge badge-green">+${delta}</span>`
      : `<span class="badge badge-rose">${delta}</span>`;

    return `
      <tr>
        <td style="color:var(--text-muted);">${seq}</td>
        <td>
          <button class="link-btn contest-link" data-cid="${c.contestId}">
            ${c.contestName} ↗
          </button>
        </td>
        <td style="color:var(--text-secondary);">${formatDate(c.ratingUpdateTimeSeconds)}</td>
        <td style="font-weight:700;">#${c.rank}</td>
        <td><span style="color:${perfColor}; font-weight:700;">~${estPerf}</span></td>
        <td>${deltaBadge}</td>
        <td><span style="color:${newColor}; font-weight:800;">${c.newRating}</span></td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">暂无 Rated 比赛记录</td></tr>`;

  // Upcoming Contests List
  const upcomingBox = document.getElementById('upcoming-contests-list');
  const upcoming = Array.isArray(state.rawData.upcomingContests) ? state.rawData.upcomingContests : [];
  const nowSec = Math.floor(Date.now() / 1000);

  upcomingBox.innerHTML = upcoming.map((u) => {
    const diffSec = Math.max(0, (u.startTimeSeconds || nowSec) - nowSec);
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const durHrs = ((u.durationSeconds || 7200) / 3600).toFixed(1);

    return `
      <div style="padding:12px 14px; border-radius:9px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div>
          <div style="font-weight:700; font-size:13px; color:#f3f4f6;">${u.name}</div>
          <div style="font-size:11.5px; color:var(--text-secondary); margin-top:4px;">
            🕒 开始时间: ${formatDateTime(u.startTimeSeconds)} | 时长: ${durHrs}h
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div class="badge badge-blue" style="margin-bottom:5px;">倒计时 ${days}天 ${hours}小时</div>
          <div>
            <button class="link-btn contest-link" data-cid="${u.id}" style="font-size:11.5px;">前往赛场 ↗</button>
          </div>
        </div>
      </div>
    `;
  }).join('') || `<div style="color:var(--text-muted);text-align:center;padding:24px;">暂无近期比赛预告</div>`;
}

/* --------------------------------------------------------------------------
   Tab 5: Rating Predictor & Elo Simulator (CORE FEATURE)
   -------------------------------------------------------------------------- */
function renderPredictorTab() {
  const A = state.analysis;
  const curR = A.currentRating;
  const pracR = A.practiceRating;
  const gap = pracR - curR;

  const offEl = document.getElementById('pred-official-rating');
  offEl.textContent = curR;
  offEl.style.color = getCfRankInfo(curR).color;

  const pracEl = document.getElementById('pred-practice-rating');
  pracEl.textContent = pracR;
  pracEl.style.color = getCfRankInfo(pracR).color;

  const gapEl = document.getElementById('pred-rating-gap');
  gapEl.textContent = gap >= 0 ? `+${gap}` : `${gap}`;
  gapEl.style.color = gap >= 0 ? '#34d399' : '#fb7185';

  // Gauge Chart
  const gChart = getOrCreateChart('chart-predictor-gauge');
  if (gChart) {
    gChart.setOption({
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          min: 800,
          max: 2600,
          splitNumber: 6,
          radius: '90%',
          center: ['50%', '58%'],
          axisLine: {
            lineStyle: {
              width: 14,
              color: [
                [0.22, '#9ca3af'],
                [0.33, '#22c55e'],
                [0.44, '#06b6d4'],
                [0.61, '#3b82f6'],
                [0.72, '#a855f7'],
                [0.88, '#f59e0b'],
                [1, '#ef4444']
              ]
            }
          },
          pointer: {
            itemStyle: { color: '#facc15' }
          },
          axisTick: { show: false },
          splitLine: { length: 10, lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9ca3af', fontSize: 10, distance: 18 },
          title: { offsetCenter: [0, '30%'], color: '#9ca3af', fontSize: 12 },
          detail: {
            valueAnimation: true,
            formatter: '{value}',
            color: getCfRankInfo(pracR).color,
            fontSize: 26,
            fontWeight: 800,
            offsetCenter: [0, '62%']
          },
          data: [{ value: pracR, name: '刷题拟合实力 Rating' }]
        }
      ]
    });
  }

  // Diagnostic Insight Text
  const insightBox = document.getElementById('pred-insight-box');
  if (gap >= 50) {
    insightBox.innerHTML = `
      📈 <strong>实力评估结论：具备明显上分潜力 (+${gap})</strong><br/>
      您近期攻克题目的加权难度为 <strong>${A.recentAvgDiff}</strong>，前 28% 高难攻克均值达 <strong>${A.recentTop80Diff}</strong>，实力已达到 <strong>${getCfRankInfo(pracR).cn}</strong> 水准。只要在接下来的比赛中稳住前两题的一发通过率，预计未来 2~3 场比赛可稳定向 <strong>${pracR}</strong> 靠拢。
    `;
  } else if (gap >= -40) {
    insightBox.innerHTML = `
      ⚖️ <strong>实力评估结论：刷题难度与当前段位基本匹配 (${gap >= 0 ? '+' + gap : gap})</strong><br/>
      您近期训练题目的有效难度 (<strong>${A.recentAvgDiff}</strong>) 与您当前的官方 Rating (<strong>${curR}</strong>) 处于同一水平线。若想在接下来的比赛中突破瓶颈，建议在「Tag 强弱项诊断」中选择 <strong>当前 Rating +150 分</strong> 的进阶题目进行专项突破。
    `;
  } else {
    insightBox.innerHTML = `
      ⚠️ <strong>实力评估结论：近期刷题难度偏低 (${gap})，警惕掉分风险</strong><br/>
      您近期刷题的平均难度 (<strong>${A.recentAvgDiff}</strong>) 低于您当前的比赛 Rating (<strong>${curR}</strong>)。长期停留在低分段舒适区可能导致比赛后半场手生，建议减少简单题数量，增加 <strong>${curR} ~ ${curR + 200}</strong> 难度区间的训练。
    `;
  }

  // Initialize Simulator Sliders to user's current rating
  const baseSlider = document.getElementById('sim-base-rating');
  baseSlider.value = Math.max(800, Math.min(2800, curR));

  updateSimulatorView();
  renderNextTierRoadmap();
}

function updateSimulatorView() {
  const baseRating = Number(document.getElementById('sim-base-rating').value) || 1500;
  const contestType = document.getElementById('sim-contest-type').value || 'div2';
  const rankSlider = document.getElementById('sim-expected-rank');
  const pool = CONTEST_POOLS[contestType] || CONTEST_POOLS.div2;

  rankSlider.max = pool.size;
  if (Number(rankSlider.value) > pool.size) {
    rankSlider.value = Math.round(pool.size * 0.15);
  }
  const rank = Number(rankSlider.value) || 500;

  document.getElementById('sim-base-rating-label').textContent = `${baseRating} (${getCfRankInfo(baseRating).title})`;
  document.getElementById('sim-pool-label').textContent = pool.label;
  const pct = ((rank / pool.size) * 100).toFixed(1);
  document.getElementById('sim-rank-label').textContent = `第 ${rank} 名 (前 ${pct}%)`;

  const sim = simulateContestOutcome(baseRating, contestType, rank);

  const perfEl = document.getElementById('sim-perf-val');
  perfEl.textContent = sim.perf;
  perfEl.style.color = getCfRankInfo(sim.perf).color;

  const deltaEl = document.getElementById('sim-delta-val');
  deltaEl.textContent = sim.delta >= 0 ? `+${sim.delta}` : `${sim.delta}`;
  deltaEl.style.color = sim.delta >= 0 ? '#34d399' : '#fb7185';

  const newREl = document.getElementById('sim-new-rating-val');
  newREl.textContent = sim.newRating;
  newREl.style.color = getCfRankInfo(sim.newRating).color;

  document.getElementById('sim-breakeven-hint').innerHTML =
    `💡 在本场 ${pool.label} 中，您的<strong>保分名次 (Δ = 0)</strong> 约为第 <strong>#${sim.breakEvenRank}</strong> 名；若想单场暴涨 <strong>+50 分</strong>，需排进前 <strong>#${estimateRankForTargetDelta(baseRating, contestType, 50)}</strong> 名。`;

  // Render Rank vs Delta Curve
  const curveChart = getOrCreateChart('chart-predictor-curve');
  if (curveChart) {
    const sampleRanks = [];
    const step = Math.max(25, Math.floor(pool.size / 40));
    for (let r = 20; r <= pool.size * 0.65; r += step) {
      sampleRanks.push(r);
    }
    const sampleDeltas = sampleRanks.map((r) => simulateContestOutcome(baseRating, contestType, r).delta);

    curveChart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111827',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 },
        formatter: (params) => {
          const p = params[0];
          const d = p.value;
          return `比赛名次: <b>#${p.name}</b><br/>预计 Rating 变化: <b>${d >= 0 ? '+' + d : d}</b>`;
        }
      },
      grid: { left: 46, right: 24, top: 24, bottom: 34 },
      xAxis: {
        name: '名次',
        type: 'category',
        data: sampleRanks.map(String),
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        axisLine: { lineStyle: { color: '#374151' } }
      },
      yAxis: {
        name: 'Δ Rating',
        type: 'value',
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: sampleDeltas,
          itemStyle: { color: '#06b6d4' },
          lineStyle: { width: 2.5, color: '#06b6d4' },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#f43f5e' },
            data: [{ yAxis: 0, name: '保分线 (Δ=0)' }]
          }
        }
      ]
    });
  }
}

function renderNextTierRoadmap() {
  if (!state.analysis) return;
  const curR = state.analysis.currentRating;
  const rInfo = getCfRankInfo(curR);
  const needed = Math.max(10, rInfo.nextRating - curR);

  const oneShotRank = estimateRankForTargetDelta(curR, 'div2', needed);
  const threeStepDelta = Math.ceil(needed / 3);
  const threeStepRank = estimateRankForTargetDelta(curR, 'div2', threeStepDelta);

  const box = document.getElementById('next-tier-roadmap');
  box.innerHTML = `
    <div style="padding: 14px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); margin-bottom: 12px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12.5px; color:var(--text-secondary);">下一目标段位</span>
        <span style="font-size:14px; font-weight:800; color:${getCfRankInfo(rInfo.nextRating).color};">${rInfo.nextTitle}</span>
      </div>
      <div style="margin-top:8px; font-size:12.5px;">
        当前距离晋升还差 <strong style="color:#fff; font-size:15px;">+${needed}</strong> 分
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:10px; font-size:12.5px;">
      <div style="padding:11px 14px; border-radius:9px; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25);">
        🚀 <strong>方案 A：一场直接冲段（需 +${needed} 分）</strong><br/>
        在标准 Div.2 (12,000人) 比赛中需排进约前 <strong>#${oneShotRank} 名</strong>（当场表现分需达 <strong>~${curR + Math.round(needed * 3.8)}</strong>）。
      </div>
      <div style="padding:11px 14px; border-radius:9px; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.25);">
        🧭 <strong>方案 B：三场稳步晋级（场均 +${threeStepDelta} 分）</strong><br/>
        每场 Div.2 比赛只需稳定保持在前 <strong>#${threeStepRank} 名</strong> 左右即可在 3 场内顺利晋升。
      </div>
      <div style="padding:11px 14px; border-radius:9px; background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.25);">
        📚 <strong>日常训练建议难度区间：${Math.round((curR + 100) / 100) * 100} ~ ${Math.round((rInfo.nextRating + 100) / 100) * 100}</strong><br/>
        重点清理「Tag 强弱项诊断」中的薄弱标签与待补题目。
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   Tab 6: Account & Settings
   -------------------------------------------------------------------------- */
function renderSettingsTab() {
  // Populate account switcher in sidebar and settings list
  const accounts = state.config.accounts || [];
  const switcher = document.getElementById('account-switcher');
  switcher.innerHTML = accounts.map((acc) => `
    <option value="${acc.handle}" ${acc.handle === state.config.activeHandle ? 'selected' : ''}>
      ${acc.handle} ${acc.isDemo ? '(演示)' : ''}
    </option>
  `).join('');

  document.getElementById('settings-apikey-input').value = state.config.apiKey || '';
  document.getElementById('settings-apisecret-input').value = state.config.apiSecret || '';

  const listBox = document.getElementById('saved-accounts-list');
  listBox.innerHTML = accounts.map((acc) => {
    const isActive = acc.handle.toLowerCase() === String(state.config.activeHandle).toLowerCase();
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid ${isActive ? 'rgba(59,130,246,0.5)' : 'var(--border-subtle)'};">
        <div>
          <span style="font-weight:700; color:#fff;">${acc.handle}</span>
          ${acc.isDemo ? '<span class="badge badge-purple" style="margin-left:6px;">内置演示</span>' : '<span class="badge badge-blue" style="margin-left:6px;">Codeforces 账号</span>'}
          ${isActive ? '<span class="badge badge-green" style="margin-left:6px;">当前使用中</span>' : ''}
        </div>
        <div style="display:flex; gap:8px;">
          ${!isActive ? `<button class="btn-secondary switch-acc-btn" data-handle="${acc.handle}" style="padding:4px 10px;font-size:12px;">切换</button>` : ''}
          ${!acc.isDemo ? `<button class="btn-secondary remove-acc-btn" data-handle="${acc.handle}" style="padding:4px 10px;font-size:12px;color:#fb7185;">移除</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   Data Sync & Account Switching Actions
   ========================================================================== */
function setSyncStatus(text, isSyncing = false) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-status-text');
  if (dot) {
    if (isSyncing) dot.classList.add('syncing');
    else dot.classList.remove('syncing');
  }
  if (txt) txt.textContent = text;
}

async function loadAndSyncHandle(handle, forceRefresh = false) {
  const cleanHandle = String(handle || '').trim();
  if (!cleanHandle) {
    showToast('请输入有效的 Codeforces 用户名 (Handle)', true);
    return;
  }

  try {
    setSyncStatus(`正在同步 ${cleanHandle}...`, true);
    let data = null;

    if (window.cfDesktop) {
      data = await window.cfDesktop.fetchUserData({
        handle: cleanHandle,
        apiKey: state.config.apiKey,
        apiSecret: state.config.apiSecret,
        forceRefresh
      });
    } else {
      throw new Error('Desktop IPC 未就绪');
    }

    const canonicalHandle = (data.userInfo && data.userInfo.handle) || cleanHandle;
    state.config.activeHandle = canonicalHandle;

    // Add to saved accounts if not present
    const exists = state.config.accounts.some(
      (a) => a.handle.toLowerCase() === canonicalHandle.toLowerCase()
    );
    if (!exists) {
      state.config.accounts.push({
        handle: canonicalHandle,
        label: canonicalHandle,
        isDemo: canonicalHandle.toLowerCase() === 'demo_coder'
      });
    }

    if (window.cfDesktop) {
      await window.cfDesktop.saveConfig(state.config);
    }

    state.rawData = data;
    state.analysis = analyzeDataset(data);
    renderAllViews();

    setSyncStatus(`已同步: ${canonicalHandle}`, false);
    showToast(`账号 ${canonicalHandle} 数据同步成功！`);
  } catch (err) {
    setSyncStatus('同步失败', false);
    showToast(err.message || '同步 Codeforces 数据失败', true);
  }
}

/* ==========================================================================
   Event Listeners & Initialization
   ========================================================================== */
function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === tabId);
  });
  setTimeout(resizeAllCharts, 40);
}

window.addEventListener('DOMContentLoaded', async () => {
  // Window control buttons
  document.getElementById('win-min-btn').addEventListener('click', () => {
    if (window.cfDesktop) window.cfDesktop.minimizeWindow();
  });
  document.getElementById('win-max-btn').addEventListener('click', () => {
    if (window.cfDesktop) window.cfDesktop.maximizeWindow();
  });
  document.getElementById('win-close-btn').addEventListener('click', () => {
    if (window.cfDesktop) window.cfDesktop.closeWindow();
  });

  // Sidebar tab navigation
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Top bar login & refresh
  const topInput = document.getElementById('top-handle-input');
  document.getElementById('top-login-btn').addEventListener('click', () => {
    loadAndSyncHandle(topInput.value, true);
  });
  topInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadAndSyncHandle(topInput.value, true);
  });

  document.getElementById('top-refresh-btn').addEventListener('click', () => {
    loadAndSyncHandle(state.config.activeHandle, true);
  });

  // Account switcher dropdown
  document.getElementById('account-switcher').addEventListener('change', (e) => {
    loadAndSyncHandle(e.target.value, false);
  });

  // Problem Explorer filters
  ['prob-filter-status', 'prob-filter-tag'].forEach((id) => {
    document.getElementById(id).addEventListener('change', renderProblemExplorerTable);
  });
  document.getElementById('prob-filter-search').addEventListener('input', renderProblemExplorerTable);

  // Tag Diagnostic controls
  ['rec-tag-select', 'rec-diff-select'].forEach((id) => {
    document.getElementById(id).addEventListener('change', renderRecommendedProblems);
  });
  document.getElementById('tag-table-sort').addEventListener('change', renderTagDiagnosticTable);

  // Simulator sliders
  ['sim-base-rating', 'sim-contest-type', 'sim-expected-rank'].forEach((id) => {
    document.getElementById(id).addEventListener('input', updateSimulatorView);
    document.getElementById(id).addEventListener('change', updateSimulatorView);
  });

  // Settings tab actions
  const settingsHandleInput = document.getElementById('settings-handle-input');
  document.getElementById('settings-login-btn').addEventListener('click', () => {
    loadAndSyncHandle(settingsHandleInput.value, true);
  });
  settingsHandleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadAndSyncHandle(settingsHandleInput.value, true);
  });

  document.querySelectorAll('.preset-handle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadAndSyncHandle(btn.dataset.handle, false);
    });
  });

  document.getElementById('settings-save-api-btn').addEventListener('click', async () => {
    state.config.apiKey = document.getElementById('settings-apikey-input').value.trim();
    state.config.apiSecret = document.getElementById('settings-apisecret-input').value.trim();
    if (window.cfDesktop) {
      await window.cfDesktop.saveConfig(state.config);
    }
    renderAllViews();
    showToast('API Key 密钥配置已保存在本机！');
  });

  document.getElementById('settings-open-cfapi-btn').addEventListener('click', () => {
    openExternalUrl('https://codeforces.com/settings/api');
  });

  // Global delegated click handlers (problem links, contest links, tag jumps, account buttons)
  document.body.addEventListener('click', async (e) => {
    const gotoBtn = e.target.closest('[data-goto-tab]');
    if (gotoBtn) {
      switchTab(gotoBtn.dataset.gotoTab);
      return;
    }

    const jumpTag = e.target.closest('[data-jump-tag]');
    if (jumpTag) {
      switchTab('tab-tags');
      const sel = document.getElementById('rec-tag-select');
      if (sel) {
        sel.value = jumpTag.dataset.jumpTag;
        renderRecommendedProblems();
      }
      return;
    }

    const selectRecTag = e.target.closest('[data-select-rec-tag]');
    if (selectRecTag) {
      const sel = document.getElementById('rec-tag-select');
      if (sel) {
        sel.value = selectRecTag.dataset.selectRecTag;
        renderRecommendedProblems();
        showToast(`已切换至「${formatTagName(selectRecTag.dataset.selectRecTag)}」专项推荐题单`);
      }
      return;
    }

    const probLink = e.target.closest('.problem-link');
    if (probLink) {
      const cid = probLink.dataset.cid;
      const idx = probLink.dataset.idx;
      if (cid && idx) {
        openExternalUrl(`https://codeforces.com/contest/${cid}/problem/${idx}`);
      }
      return;
    }

    const contestLink = e.target.closest('.contest-link');
    if (contestLink) {
      const cid = contestLink.dataset.cid;
      if (cid) {
        openExternalUrl(`https://codeforces.com/contest/${cid}`);
      }
      return;
    }

    const switchAccBtn = e.target.closest('.switch-acc-btn');
    if (switchAccBtn) {
      loadAndSyncHandle(switchAccBtn.dataset.handle, false);
      return;
    }

    const removeAccBtn = e.target.closest('.remove-acc-btn');
    if (removeAccBtn) {
      const h = removeAccBtn.dataset.handle;
      state.config.accounts = state.config.accounts.filter((a) => a.handle !== h);
      if (state.config.activeHandle === h) {
        state.config.activeHandle = 'Demo_Coder';
      }
      if (window.cfDesktop) {
        await window.cfDesktop.saveConfig(state.config);
      }
      loadAndSyncHandle(state.config.activeHandle, false);
      return;
    }
  });

  window.addEventListener('resize', resizeAllCharts);

  // Listen to sync progress from main process
  if (window.cfDesktop && window.cfDesktop.onSyncProgress) {
    window.cfDesktop.onSyncProgress(({ stepText }) => {
      setSyncStatus(stepText, true);
    });
  }

  // Initial load from saved config / cache / demo dataset
  if (window.cfDesktop) {
    const savedConfig = await window.cfDesktop.loadConfig();
    if (savedConfig) state.config = savedConfig;

    const cached = await window.cfDesktop.getCachedUser(state.config.activeHandle);
    if (cached) {
      state.rawData = cached;
      state.analysis = analyzeDataset(cached);
      renderAllViews();
      setSyncStatus(`已就绪: ${state.config.activeHandle}`, false);
    } else {
      await loadAndSyncHandle(state.config.activeHandle || 'Demo_Coder', false);
    }
  }
});
