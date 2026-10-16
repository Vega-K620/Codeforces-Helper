const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

let mainWindow = null;

// Data directory in user's AppData (ensures sharing the app doesn't leak personal config)
function getDataDir() {
  const dir = path.join(app.getPath('userData'), 'cf_helper_store');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getConfigPath() {
  return path.join(getDataDir(), 'config.json');
}

function getUserCachePath(handle) {
  const safeHandle = String(handle || 'default').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return path.join(getDataDir(), `user_${safeHandle}.json`);
}

function getGlobalCachePath(name) {
  return path.join(getDataDir(), `global_${name}.json`);
}

function readJsonSafe(filePath, fallback = null) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read JSON:', filePath, err.message);
  }
  return fallback;
}

function writeJsonSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write JSON:', filePath, err.message);
    return false;
  }
}

// Sleep utility for CF API rate limiting
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Build Codeforces API URL (supports both public & SHA-512 signed API Key requests)
function buildCfApiUrl(methodName, params = {}, apiKey = '', apiSecret = '') {
  const queryParams = { ...params };
  const cleanKey = (apiKey || '').trim();
  const cleanSecret = (apiSecret || '').trim();

  if (cleanKey && cleanSecret) {
    queryParams.apiKey = cleanKey;
    queryParams.time = Math.floor(Date.now() / 1000);

    // Sort parameters lexicographically by key, then by value
    const sortedEntries = Object.entries(queryParams)
      .map(([k, v]) => [String(k), String(v)])
      .sort((a, b) => {
        if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
        if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
        return 0;
      });

    const paramString = sortedEntries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const rand = crypto.randomBytes(3).toString('hex'); // 6 hex chars
    const toSign = `${rand}/${methodName}?${paramString}#${cleanSecret}`;
    const hash = crypto.createHash('sha512').update(toSign, 'utf8').digest('hex');
    const apiSig = `${rand}${hash}`;

    return `https://codeforces.com/api/${methodName}?${paramString}&apiSig=${apiSig}`;
  } else {
    const paramString = Object.entries(queryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return `https://codeforces.com/api/${methodName}${paramString ? '?' + paramString : ''}`;
  }
}

// Perform HTTPS GET request to Codeforces API with retry
function requestCfApi(methodName, params = {}, apiKey = '', apiSecret = '', retries = 2) {
  return new Promise((resolve, reject) => {
    const url = buildCfApiUrl(methodName, params, apiKey, apiSecret);

    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'CodeforcesHelperDesktop/1.0 (Electron Windows Client)',
          'Accept': 'application/json'
        },
        timeout: 20000
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', async () => {
          try {
            const parsed = JSON.parse(rawData);
            if (parsed.status === 'OK') {
              resolve(parsed.result);
            } else {
              const comment = parsed.comment || `Codeforces API returned ${parsed.status}`;
              // If rate limited, wait and retry
              if (retries > 0 && /limit|Call limit/i.test(comment)) {
                await sleep(1500);
                try {
                  const retryRes = await requestCfApi(methodName, params, apiKey, apiSecret, retries - 1);
                  resolve(retryRes);
                } catch (e) {
                  reject(e);
                }
                return;
              }
              reject(new Error(comment));
            }
          } catch (err) {
            if (retries > 0) {
              await sleep(1200);
              try {
                const retryRes = await requestCfApi(methodName, params, apiKey, apiSecret, retries - 1);
                resolve(retryRes);
              } catch (e) {
                reject(e);
              }
              return;
            }
            reject(new Error(`解析 Codeforces 响应失败 (HTTP ${res.statusCode})`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('连接 Codeforces API 超时，请检查网络或稍后重试'));
    });

    req.on('error', async (err) => {
      if (retries > 0) {
        await sleep(1200);
        try {
          const retryRes = await requestCfApi(methodName, params, apiKey, apiSecret, retries - 1);
          resolve(retryRes);
        } catch (e) {
          reject(e);
        }
        return;
      }
      reject(new Error(`网络请求异常: ${err.message}`));
    });
  });
}

// Generate realistic built-in demo dataset so users can explore all features immediately or offline
function generateDemoDataset(handle = 'Demo_Coder') {
  const nowSec = Math.floor(Date.now() / 1000);
  const daySec = 86400;

  const userInfo = {
    handle: handle,
    firstName: 'Alex',
    lastName: 'Chen',
    country: 'China',
    city: 'Beijing',
    organization: 'ACM-ICPC Training Team',
    contribution: 42,
    rank: 'expert',
    rating: 1685,
    maxRank: 'expert',
    maxRating: 1742,
    lastOnlineTimeSeconds: nowSec - 600,
    registrationTimeSeconds: nowSec - 540 * daySec,
    friendOfCount: 68,
    avatar: '',
    titlePhoto: ''
  };

  // Generate 22 historical contests
  const ratingStarts = [
    { delta: +115, rank: 3120, name: 'Codeforces Round 940 (Div. 3)' },
    { delta: +95, rank: 2410, name: 'Codeforces Round 943 (Div. 3)' },
    { delta: +68, rank: 1980, name: 'Educational Codeforces Round 165 (Div. 2)' },
    { delta: -35, rank: 4210, name: 'Codeforces Round 946 (Div. 2)' },
    { delta: +82, rank: 1450, name: 'Codeforces Round 949 (Div. 2)' },
    { delta: +54, rank: 1620, name: 'Codeforces Global Round 26' },
    { delta: -48, rank: 3890, name: 'Codeforces Round 952 (Div. 2)' },
    { delta: +76, rank: 1120, name: 'Educational Codeforces Round 167 (Div. 2)' },
    { delta: +42, rank: 1380, name: 'Codeforces Round 956 (Div. 2)' },
    { delta: +65, rank: 980, name: 'Codeforces Round 960 (Div. 2)' },
    { delta: -29, rank: 2650, name: 'Codeforces Round 964 (Div. 2)' },
    { delta: +58, rank: 890, name: 'Educational Codeforces Round 169 (Div. 2)' },
    { delta: +39, rank: 1050, name: 'Codeforces Round 968 (Div. 2)' },
    { delta: -62, rank: 3920, name: 'Codeforces Round 972 (Div. 2)' },
    { delta: +91, rank: 540, name: 'Codeforces Round 976 (Div. 2)' },
    { delta: +44, rank: 820, name: 'Educational Codeforces Round 171 (Div. 2)' },
    { delta: +31, rank: 910, name: 'Codeforces Round 981 (Div. 2)' },
    { delta: +48, rank: 630, name: 'Codeforces Round 985 (Div. 1 + Div. 2)' },
    { delta: -38, rank: 2490, name: 'Codeforces Round 989 (Div. 2)' },
    { delta: -19, rank: 1840, name: 'Educational Codeforces Round 173 (Div. 2)' },
    { delta: +52, rank: 670, name: 'Codeforces Round 993 (Div. 2)' },
    { delta: -12, rank: 1520, name: 'Codeforces Round 997 (Div. 2)' }
  ];

  let curRating = 960;
  const ratingHistory = ratingStarts.map((item, idx) => {
    const oldRating = curRating;
    const newRating = curRating + item.delta;
    curRating = newRating;
    const updateTime = nowSec - (ratingStarts.length - idx) * 14 * daySec;
    return {
      contestId: 1950 + idx * 4,
      contestName: item.name,
      handle: handle,
      rank: item.rank,
      ratingUpdateTimeSeconds: updateTime,
      oldRating: oldRating,
      newRating: newRating
    };
  });

  // Tag profile configuration to visibly demonstrate Strengths, Solid, Weaknesses, and Blind Spots
  const tagProfiles = [
    // Strengths: high pass rate, high rating
    { tags: ['greedy', 'sorting'], baseRating: 1700, count: 62, failRatio: 0.35, stuckCount: 1, titlePrefix: 'Optimal Sequence' },
    { tags: ['binary search', 'two pointers'], baseRating: 1750, count: 48, failRatio: 0.38, stuckCount: 1, titlePrefix: 'K-th Threshold' },
    { tags: ['implementation', 'constructive algorithms'], baseRating: 1650, count: 55, failRatio: 0.42, stuckCount: 2, titlePrefix: 'Matrix Construction' },
    // Solid (Comfort Zone): good count, but lower difficulty average
    { tags: ['math', 'number theory'], baseRating: 1350, count: 52, failRatio: 0.65, stuckCount: 3, titlePrefix: 'Modular GCD' },
    { tags: ['brute force', 'bitmasks'], baseRating: 1300, count: 36, failRatio: 0.55, stuckCount: 2, titlePrefix: 'Subset Xor' },
    // Weaknesses (Needs Improvement): high failure rate, more stuck problems, lower effective rating
    { tags: ['dp'], baseRating: 1450, count: 38, failRatio: 1.85, stuckCount: 9, titlePrefix: 'Interval Partition DP' },
    { tags: ['graphs', 'dfs and similar', 'shortest paths'], baseRating: 1420, count: 29, failRatio: 1.70, stuckCount: 7, titlePrefix: 'Directed Cycle Network' },
    { tags: ['trees', 'dsu'], baseRating: 1480, count: 24, failRatio: 1.55, stuckCount: 6, titlePrefix: 'Weighted Tree Diameter' },
    { tags: ['data structures'], baseRating: 1500, count: 26, failRatio: 1.60, stuckCount: 6, titlePrefix: 'Dynamic Segment Queries' },
    // Blind Spots: very few solved
    { tags: ['strings', 'hashing'], baseRating: 1400, count: 6, failRatio: 1.40, stuckCount: 3, titlePrefix: 'Palindrome Automaton' },
    { tags: ['combinatorics', 'probabilities'], baseRating: 1500, count: 5, failRatio: 1.50, stuckCount: 3, titlePrefix: 'Expected Permutations' },
    { tags: ['geometry'], baseRating: 1400, count: 3, failRatio: 1.80, stuckCount: 2, titlePrefix: 'Convex Polygon Area' },
    { tags: ['games'], baseRating: 1400, count: 4, failRatio: 1.30, stuckCount: 2, titlePrefix: 'Nim Variant Game' }
  ];

  const submissions = [];
  let subId = 285000000;
  let problemSeed = 1700;
  const indices = ['A', 'B', 'C', 'D', 'E', 'F'];
  const verdictsFail = ['WRONG_ANSWER', 'WRONG_ANSWER', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'MEMORY_LIMIT_EXCEEDED'];
  const langs = ['GNU C++20 (64)', 'GNU C++20 (64)', 'GNU C++20 (64)', 'GNU C++17', 'PyPy 3-64'];

  tagProfiles.forEach((prof, pIdx) => {
    // Solved problems
    for (let i = 0; i < prof.count; i++) {
      problemSeed++;
      const cId = 1750 + ((problemSeed * 7) % 300);
      const idx = indices[(i + pIdx) % indices.length];
      const ratingOffsets = [-300, -200, -100, 0, 0, 100, 100, 200, 300];
      const probRating = Math.max(800, Math.min(2600, prof.baseRating + ratingOffsets[(i * 3 + pIdx) % ratingOffsets.length]));
      const probName = `${prof.titlePrefix} #${i + 1}`;
      // Spread timestamps across last 320 days, with denser recent activity
      const daysAgo = i < prof.count * 0.35
        ? Math.floor((i * 27) % 30)
        : Math.floor(30 + ((i * 43 + pIdx * 19) % 290));
      const baseTime = nowSec - daysAgo * daySec - ((i * 3600) % 43200);

      // Determine how many failed submissions happened before AC
      const numFails = Math.floor(prof.failRatio * ((i % 3 === 0) ? 2 : (i % 2 === 0 ? 1 : 0)));
      for (let f = 0; f < numFails; f++) {
        submissions.push({
          id: subId++,
          contestId: cId,
          creationTimeSeconds: baseTime - (numFails - f) * 420,
          relativeTimeSeconds: 3600,
          problem: {
            contestId: cId,
            index: idx,
            name: probName,
            type: 'PROGRAMMING',
            rating: probRating,
            tags: prof.tags
          },
          author: {
            contestId: cId,
            members: [{ handle: handle }],
            participantType: i % 4 === 0 ? 'CONTESTANT' : 'PRACTICE',
            ghost: false
          },
          programmingLanguage: langs[(i + f) % langs.length],
          verdict: verdictsFail[(i + f) % verdictsFail.length],
          testset: 'TESTS',
          passedTestCount: (i * 5 + f * 3) % 42
        });
      }

      // AC submission
      submissions.push({
        id: subId++,
        contestId: cId,
        creationTimeSeconds: baseTime,
        relativeTimeSeconds: 4200,
        problem: {
          contestId: cId,
          index: idx,
          name: probName,
          type: 'PROGRAMMING',
          rating: probRating,
          tags: prof.tags
        },
        author: {
          contestId: cId,
          members: [{ handle: handle }],
          participantType: i % 4 === 0 ? 'CONTESTANT' : 'PRACTICE',
          ghost: false
        },
        programmingLanguage: langs[i % langs.length],
        verdict: 'OK',
        testset: 'TESTS',
        passedTestCount: 45 + (i % 30)
      });
    }

    // Stuck / Unsolved problems (attempted but never AC)
    for (let s = 0; s < prof.stuckCount; s++) {
      problemSeed++;
      const cId = 1880 + ((problemSeed * 11) % 180);
      const idx = indices[Math.min(5, 2 + (s % 4))];
      const probRating = Math.max(1200, Math.min(2400, prof.baseRating + 100 + (s % 3) * 100));
      const probName = `${prof.titlePrefix} (Hard Version ${s + 1})`;
      const daysAgo = 3 + ((s * 17 + pIdx * 9) % 75);
      const baseTime = nowSec - daysAgo * daySec;
      const attempts = 2 + (s % 3);

      for (let a = 0; a < attempts; a++) {
        submissions.push({
          id: subId++,
          contestId: cId,
          creationTimeSeconds: baseTime + a * 300,
          relativeTimeSeconds: 5000,
          problem: {
            contestId: cId,
            index: idx,
            name: probName,
            type: 'PROGRAMMING',
            rating: probRating,
            tags: prof.tags
          },
          author: {
            contestId: cId,
            members: [{ handle: handle }],
            participantType: 'PRACTICE',
            ghost: false
          },
          programmingLanguage: 'GNU C++20 (64)',
          verdict: verdictsFail[(s + a) % verdictsFail.length],
          testset: 'TESTS',
          passedTestCount: 3 + ((s + a) * 4) % 18
        });
      }
    }
  });

  // Sort submissions newest first (like Codeforces user.status)
  submissions.sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);

  const upcomingContests = [
    {
      id: 2065,
      name: 'Codeforces Round 1002 (Div. 2)',
      type: 'CF',
      phase: 'BEFORE',
      frozen: false,
      durationSeconds: 7200,
      startTimeSeconds: nowSec + 2 * daySec + 14400
    },
    {
      id: 2066,
      name: 'Educational Codeforces Round 175 (Rated for Div. 2)',
      type: 'ICPC',
      phase: 'BEFORE',
      frozen: false,
      durationSeconds: 7200,
      startTimeSeconds: nowSec + 5 * daySec + 7200
    },
    {
      id: 2067,
      name: 'Codeforces Round 1003 (Div. 3)',
      type: 'ICPC',
      phase: 'BEFORE',
      frozen: false,
      durationSeconds: 8100,
      startTimeSeconds: nowSec + 8 * daySec + 18000
    },
    {
      id: 2068,
      name: 'Codeforces Global Round 29',
      type: 'CF',
      phase: 'BEFORE',
      frozen: false,
      durationSeconds: 10800,
      startTimeSeconds: nowSec + 12 * daySec + 10800
    }
  ];

  // Sample curated high-quality problems for recommendation fallback
  const curatedProblemPool = getCuratedProblemPool();

  return {
    isDemo: true,
    syncedAt: Date.now(),
    userInfo,
    ratingHistory,
    submissions,
    upcomingContests,
    problemPool: curatedProblemPool
  };
}

// Built-in high-quality CF problem pool across all tags and ratings (used when offline or before full catalog sync)
function getCuratedProblemPool() {
  return [
    { contestId: 1996, index: 'D', name: 'Fun', rating: 1500, tags: ['brute force', 'math', 'number theory'], solvedCount: 14200 },
    { contestId: 1992, index: 'D', name: 'Test of Love', rating: 1200, tags: ['dp', 'greedy', 'implementation'], solvedCount: 21500 },
    { contestId: 1989, index: 'C', name: 'Two Movies', rating: 1400, tags: ['greedy', 'math'], solvedCount: 18400 },
    { contestId: 1986, index: 'D', name: 'Mathematical Problem', rating: 1400, tags: ['brute force', 'dp', 'greedy', 'math'], solvedCount: 16800 },
    { contestId: 1985, index: 'F', name: 'Final Boss', rating: 1500, tags: ['binary search', 'data structures'], solvedCount: 15900 },
    { contestId: 1980, index: 'D', name: 'GCD-sequence', rating: 1400, tags: ['brute force', 'greedy', 'implementation', 'math', 'number theory'], solvedCount: 17100 },
    { contestId: 1974, index: 'E', name: 'Money Buys Happiness', rating: 1800, tags: ['dp'], solvedCount: 9800 },
    { contestId: 1971, index: 'F', name: 'Circle Perimeter', rating: 1600, tags: ['binary search', 'brute force', 'geometry', 'math', 'two pointers'], solvedCount: 12400 },
    { contestId: 1968, index: 'D', name: 'Permutation Game', rating: 1300, tags: ['brute force', 'dfs and similar', 'games', 'graphs', 'greedy'], solvedCount: 19200 },
    { contestId: 1955, index: 'E', name: 'Long Inversions', rating: 1700, tags: ['bitmasks', 'brute force', 'data structures', 'greedy', 'strings'], solvedCount: 10300 },
    { contestId: 1950, index: 'E', name: 'Nearly Shortest Repeating Substring', rating: 1500, tags: ['brute force', 'Implementation', 'number theory', 'strings'], solvedCount: 14900 },
    { contestId: 1948, index: 'C', name: 'Arrow Path', rating: 1300, tags: ['dfs and similar', 'dp', 'graphs', 'shortest paths'], solvedCount: 18700 },
    { contestId: 1941, index: 'E', name: 'Rudolf and k Bridges', rating: 1600, tags: ['binary search', 'data structures', 'dp', 'two pointers'], solvedCount: 11800 },
    { contestId: 1933, index: 'E', name: 'Turtle vs. Rabbit Race: Optimal Trainings', rating: 1500, tags: ['binary search', 'implementation', 'math', 'ternary search'], solvedCount: 13600 },
    { contestId: 1931, index: 'E', name: 'Anna and the Valentine\'s Day Gift', rating: 1400, tags: ['games', 'greedy', 'math', 'sortings'], solvedCount: 17600 },
    { contestId: 1927, index: 'D', name: 'Find the Different Ones!', rating: 1300, tags: ['binary search', 'brute force', ' constructive algorithms', 'data structures', 'dp', 'greedy', 'two pointers'], solvedCount: 22100 },
    { contestId: 1926, index: 'E', name: 'Vlad and an Odd Ordering', rating: 1500, tags: ['Air', 'binary search', 'bitmasks', ' combinatorics', 'dp', 'math', 'number theory'], solvedCount: 14100 },
    { contestId: 1921, index: 'E', name: 'Eat the Chip', rating: 1600, tags: ['brute force', 'games', 'greedy', 'math'], solvedCount: 11200 },
    { contestId: 1915, index: 'F', name: 'Greetings', rating: 1500, tags: ['data structures', 'divide and conquer', 'sortings'], solvedCount: 15800 },
    { contestId: 1914, index: 'E2', name: 'Game with Marbles (Hard Version)', rating: 1400, tags: ['games', 'greedy', 'sortings'], solvedCount: 16900 },
    { contestId: 1907, index: 'E', name: 'Good Triples', rating: 1600, tags: ['brute force', 'combinatorics', 'dp', 'math', 'number theory'], solvedCount: 12900 },
    { contestId: 1899, index: 'E', name: 'Queue Sort', rating: 1300, tags: ['greedy', 'implementation', 'sortings'], solvedCount: 20400 },
    { contestId: 1883, index: 'G1', name: 'Dances (Easy version)', rating: 1400, tags: ['binary search', 'greedy', 'two pointers'], solvedCount: 17200 },
    { contestId: 1878, index: 'E', name: 'Iva & Pav', rating: 1400, tags: ['binary search', 'bitmasks', 'data structures', 'greedy'], solvedCount: 18900 },
    { contestId: 1873, index: 'G', name: 'ABBC or BACB', rating: 1500, tags: ['constructive algorithms', 'dp', 'greedy', 'strings'], solvedCount: 14700 },
    { contestId: 1862, index: 'E', name: 'Kolya and Movie Theatre', rating: 1600, tags: ['data structures', 'greedy'], solvedCount: 13400 },
    { contestId: 1857, index: 'F', name: 'Sum and Product', rating: 1600, tags: ['binary search', 'data structures', 'math'], solvedCount: 13900 },
    { contestId: 1851, index: 'E', name: 'Nastya and Potions', rating: 1500, tags: ['dfs and similar', 'dp', 'graphs', 'sortings'], solvedCount: 15200 },
    { contestId: 1846, index: 'E2', name: 'Rudolf and Snowflakes (hard version)', rating: 1800, tags: ['binary search', 'brute force', 'math', 'number theory'], solvedCount: 9100 },
    { contestId: 1843, index: 'E', name: 'Tracking Segments', rating: 1600, tags: ['binary search', 'brute force', 'data structures'], solvedCount: 13800 },
    { contestId: 1840, index: 'E', name: 'Character Blocking', rating: 1600, tags: ['data structures', 'hashing', 'implementation', 'strings'], solvedCount: 11600 },
    { contestId: 1833, index: 'E', name: 'Round Dance', rating: 1600, tags: ['dfs and similar', 'dsu', 'graphs', 'shortest paths'], solvedCount: 14400 },
    { contestId: 1829, index: 'G', name: 'Hits Different', rating: 1600, tags: ['combinatorics', 'data structures', 'dp', 'implementation', 'math'], solvedCount: 14800 },
    { contestId: 1822, index: 'E', name: 'Making Anti-Palindromes', rating: 1600, tags: ['greedy', 'math', 'strings'], solvedCount: 12500 },
    { contestId: 1807, index: 'F', name: 'Bouncy Ball', rating: 1700, tags: ['brute force', 'dfs and similar', 'geometry', 'graphs', 'implementation'], solvedCount: 9900 },
    { contestId: 1800, index: 'E2', name: 'Unforgivable Curse (hard version)', rating: 1500, tags: ['brute force', 'constructive algorithms', 'dfs and similar', 'dsu', 'graphs', 'greedy', 'strings'], solvedCount: 15600 },
    { contestId: 1791, index: 'F', name: 'Range Update Point Query', rating: 1500, tags: ['binary search', 'brute force', 'data structures', 'dsu'], solvedCount: 18200 },
    { contestId: 1790, index: 'E', name: 'Vlad and a Pair of Numbers', rating: 1400, tags: ['bitmasks', 'constructive algorithms', 'math'], solvedCount: 17800 },
    { contestId: 1772, index: 'D', name: 'Absolute Sorting', rating: 1400, tags: ['constructive algorithms', 'math'], solvedCount: 18500 },
    { contestId: 1760, index: 'F', name: 'Quests', rating: 1500, tags: ['binary search', 'greedy', 'sortings'], solvedCount: 17900 },
    { contestId: 1742, index: 'F', name: 'Smaller', rating: 1500, tags: ['constructive algorithms', 'greedy', 'strings'], solvedCount: 16400 },
    { contestId: 1730, index: 'B', name: 'Meeting on the Line', rating: 1600, tags: ['binary search', 'geometry', 'greedy', 'math', 'ternary search'], solvedCount: 13200 },
    { contestId: 1714, index: 'D', name: 'Color with Occurrences', rating: 1600, tags: ['brute force', 'dp', 'greedy', 'strings'], solvedCount: 12800 },
    { contestId: 1703, index: 'F', name: 'Yet Another Problem About Pairs Satisfying an Inequality', rating: 1300, tags: ['binary search', 'data structures', 'dp', 'greedy', 'sortings'], solvedCount: 23400 },
    { contestId: 1692, index: 'G', name: '2^Sort', rating: 1400, tags: ['data structures', 'dp', 'sortings', 'two pointers'], solvedCount: 21200 },
    { contestId: 1676, index: 'G', name: 'White-Black Balanced Subtrees', rating: 1300, tags: ['dfs and similar', 'dp', 'graphs', 'trees'], solvedCount: 22900 },
    { contestId: 1669, index: 'H', name: 'Maximal AND', rating: 1300, tags: ['bitmasks', 'greedy'], solvedCount: 24100 },
    { contestId: 1650, index: 'D', name: 'Twist the Permutation', rating: 1300, tags: ['brute force', 'constructive algorithms', 'implementation', 'math'], solvedCount: 20900 },
    { contestId: 1624, index: 'D', name: 'Palindromes Coloring', rating: 1400, tags: ['binary search', 'greedy', 'strings'], solvedCount: 19800 },
    { contestId: 1618, index: 'D', name: 'Array and Operations', rating: 1300, tags: ['dp', 'greedy', 'math', 'sortings'], solvedCount: 22700 },
    { contestId: 1593, index: 'E', name: 'Gardener and Tree', rating: 1600, tags: ['brute force', 'dfs and similar', 'graphs', 'greedy', 'implementation', 'trees'], solvedCount: 16700 },
    { contestId: 1559, index: 'D1', name: 'Mocha and Diana (Easy Version)', rating: 1400, tags: ['brute force', 'constructive algorithms', 'dfs and similar', 'dsu', 'graphs', 'trees'], solvedCount: 18600 },
    { contestId: 1538, index: 'F', name: 'Interesting Function', rating: 1500, tags: ['binary search', 'dp', 'math', 'number theory'], solvedCount: 23900 },
    { contestId: 1526, index: 'C2', name: 'Potions (Hard Version)', rating: 1600, tags: ['data structures', 'greedy'], solvedCount: 26400 },
    { contestId: 1516, index: 'B', name: 'AGAGA XOOORRR', rating: 1500, tags: ['bitmasks', 'brute force', 'dp', 'greedy'], solvedCount: 21900 },
    { contestId: 1490, index: 'F', name: 'Equalize the Array', rating: 1500, tags: ['binary search', 'data structures', 'greedy', 'math', 'sortings'], solvedCount: 22300 },
    { contestId: 1475, index: 'E', name: 'Advertising Agency', rating: 1600, tags: ['combinatorics', 'math', 'sortings'], solvedCount: 20100 },
    { contestId: 1462, index: 'E2', name: 'Close Tuples (hard version)', rating: 1700, tags: ['binary search', 'combinatorics', 'implementation', 'math', 'sortings', 'two pointers'], solvedCount: 15700 },
    { contestId: 1398, index: 'C', name: 'Good Subarrays', rating: 1600, tags: ['data structures', 'dp', 'math'], solvedCount: 31200 },
    { contestId: 1365, index: 'D', name: 'Solve The Maze', rating: 1700, tags: ['constructive algorithms', 'dfs and similar', 'graphs', 'greedy', 'implementation', 'shortest paths'], solvedCount: 21400 },
    { contestId: 1363, index: 'C', name: 'Game On Leaves', rating: 1600, tags: ['games', 'trees'], solvedCount: 22800 },
    { contestId: 1352, index: 'G', name: 'Special Permutation', rating: 1600, tags: ['constructive algorithms', 'dfs and similar', 'graphs'], solvedCount: 24900 }
  ];
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 1140,
    minHeight: 720,
    frame: false,
    backgroundColor: '#0b0f19',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        return false;
      } else {
        mainWindow.maximize();
        return true;
      }
    }
    return false;
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  // External link handler
  ipcMain.handle('shell:openExternal', async (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  // Load app config
  ipcMain.handle('storage:loadConfig', () => {
    const defaultConfig = {
      activeHandle: 'Demo_Coder',
      accounts: [
        { handle: 'Demo_Coder', label: '内置演示账号 (Demo)', isDemo: true }
      ],
      apiKey: '',
      apiSecret: '',
      targetRating: 1900
    };
    const saved = readJsonSafe(getConfigPath(), null);
    return saved ? { ...defaultConfig, ...saved } : defaultConfig;
  });

  // Save app config
  ipcMain.handle('storage:saveConfig', (_event, config) => {
    return writeJsonSafe(getConfigPath(), config);
  });

  // Get demo dataset
  ipcMain.handle('cf:getDemoData', (_event, handle) => {
    return generateDemoDataset(handle || 'Demo_Coder');
  });

  // Get cached user data if available
  ipcMain.handle('cf:getCachedUser', (_event, handle) => {
    if (!handle || handle === 'Demo_Coder') {
      return generateDemoDataset('Demo_Coder');
    }
    return readJsonSafe(getUserCachePath(handle), null);
  });

  // Fetch live Codeforces data for a handle
  ipcMain.handle('cf:fetchUserData', async (event, { handle, apiKey, apiSecret, forceRefresh }) => {
    const cleanHandle = String(handle || '').trim();
    if (!cleanHandle) {
      throw new Error('请输入有效的 Codeforces 用户名 (Handle)');
    }

    if (cleanHandle.toLowerCase() === 'demo_coder') {
      return generateDemoDataset('Demo_Coder');
    }

    // Check cache if not forceRefresh
    const cacheFile = getUserCachePath(cleanHandle);
    if (!forceRefresh) {
      const cached = readJsonSafe(cacheFile, null);
      if (cached && Date.now() - (cached.syncedAt || 0) < 10 * 60 * 1000) {
        return cached;
      }
    }

    const sendProgress = (stepText, percent) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('cf:syncProgress', { stepText, percent });
      }
    };

    sendProgress(`正在获取 ${cleanHandle} 的基本资料 (user.info)...`, 15);
    const userInfoArr = await requestCfApi('user.info', { handles: cleanHandle }, apiKey, apiSecret);
    if (!Array.isArray(userInfoArr) || userInfoArr.length === 0) {
      throw new Error(`未找到用户 "${cleanHandle}"`);
    }
    const userInfo = userInfoArr[0];

    await sleep(400);
    sendProgress(`正在拉取 ${userInfo.handle} 的历史比赛记录 (user.rating)...`, 40);
    let ratingHistory = [];
    try {
      ratingHistory = await requestCfApi('user.rating', { handle: userInfo.handle }, apiKey, apiSecret);
    } catch (err) {
      console.warn('user.rating fetch warning:', err.message);
      ratingHistory = [];
    }

    await sleep(400);
    sendProgress(`正在同步 ${userInfo.handle} 的全部提交记录 (user.status)...`, 70);
    const submissions = await requestCfApi('user.status', { handle: userInfo.handle, from: 1 }, apiKey, apiSecret);

    // Upcoming contests (cached for 4 hours)
    sendProgress('正在更新近期比赛日历与推荐题库...', 90);
    let upcomingContests = [];
    const contestCachePath = getGlobalCachePath('contests');
    const cachedContests = readJsonSafe(contestCachePath, null);
    if (cachedContests && Date.now() - (cachedContests.updatedAt || 0) < 4 * 3600 * 1000) {
      upcomingContests = cachedContests.list || [];
    } else {
      try {
        await sleep(350);
        const allContests = await requestCfApi('contest.list', { gym: 'false' });
        upcomingContests = (allContests || [])
          .filter((c) => c.phase === 'BEFORE')
          .sort((a, b) => (a.startTimeSeconds || 0) - (b.startTimeSeconds || 0))
          .slice(0, 8);
        writeJsonSafe(contestCachePath, { updatedAt: Date.now(), list: upcomingContests });
      } catch (e) {
        upcomingContests = generateDemoDataset().upcomingContests;
      }
    }

    const payload = {
      isDemo: false,
      syncedAt: Date.now(),
      userInfo,
      ratingHistory,
      submissions,
      upcomingContests,
      problemPool: getCuratedProblemPool()
    };

    writeJsonSafe(cacheFile, payload);
    sendProgress('同步完成！', 100);
    return payload;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
