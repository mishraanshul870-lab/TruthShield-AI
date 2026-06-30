import { Scan, User, registerScanMutationHook } from '../config/models.js';
import { getDbState } from '../config/db.js';

// In-memory dashboard stats cache
const statsCache = new Map();

export const clearStatsCache = () => {
  statsCache.clear();
  console.log('⚡ [STATS CACHE] Cache invalidated due to scan database mutation.');
};

// Register hook to automatically invalidate stats cache on any scan write or delete
registerScanMutationHook(clearStatsCache);

/**
 * @desc    Get comprehensive dashboard statistics using MongoDB aggregation pipelines
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    if (statsCache.has(userId)) {
      console.log(`⚡ [STATS CACHE HIT] Returning cached dashboard stats for user: ${userId}`);
      return res.json(statsCache.get(userId));
    }

    console.log(`⚡ [STATS CACHE MISS] Recalculating dashboard stats for user: ${userId}`);

    // Create a mock response object to intercept and cache the response
    const mockRes = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        if (this.statusCode === 200) {
          statsCache.set(userId, data);
        }
        return res.status(this.statusCode).json(data);
      }
    };

    if (getDbState().isMongoConnected) {
      return await getStatsFromMongo(userId, mockRes);
    } else {
      return await getStatsFromJsonFallback(userId, mockRes);
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error generating dashboard statistics' });
  }
};

// ──────────────────────────────────────────────
// MongoDB Aggregation Pipeline Approach
// ──────────────────────────────────────────────
async function getStatsFromMongo(userId, res) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  // Build daily boundaries for the last 7 days
  const dailyBoundaries = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    dailyBoundaries.push(d);
  }

  // Build weekly boundaries for the last 4 weeks
  const weeklyBoundaries = [];
  for (let i = 4; i >= 0; i--) {
    const w = new Date(todayStart);
    w.setDate(w.getDate() - i * 7);
    weeklyBoundaries.push(w);
  }

  const pipeline = [
    { $match: { userId } },
    {
      $facet: {
        // Core counts
        coreCounts: [
          {
            $group: {
              _id: null,
              totalScans: { $sum: 1 },
              fakeScans: { $sum: { $cond: [{ $eq: ['$prediction', 'Fake'] }, 1, 0] } },
              realScans: { $sum: { $cond: [{ $eq: ['$prediction', 'Real'] }, 1, 0] } },
              failedScans: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
              successfulScans: { $sum: { $cond: [{ $ne: ['$status', 'failed'] }, 1, 0] } },
              totalConfidence: { $sum: { $ifNull: ['$confidenceScore', 0] } },
              totalRiskScore: {
                $sum: {
                  $cond: [
                    { $eq: ['$prediction', 'Fake'] },
                    { $ifNull: ['$confidenceScore', 0] },
                    { $subtract: [100, { $ifNull: ['$confidenceScore', 0] }] }
                  ]
                }
              },
              totalAiGeneratedProbability: {
                $sum: {
                  $ifNull: [
                    '$factCheckReport.aiGeneratedProbability',
                    {
                      $cond: [
                        { $eq: ['$prediction', 'Fake'] },
                        { $ifNull: ['$confidenceScore', 50] },
                        { $subtract: [100, { $ifNull: ['$confidenceScore', 50] }] }
                      ]
                    }
                  ]
                }
              },
              totalHumanAuthenticityProbability: {
                $sum: {
                  $ifNull: [
                    '$factCheckReport.humanAuthenticityProbability',
                    {
                      $cond: [
                        { $eq: ['$prediction', 'Real'] },
                        { $ifNull: ['$confidenceScore', 50] },
                        { $subtract: [100, { $ifNull: ['$confidenceScore', 50] }] }
                      ]
                    }
                  ]
                }
              },
            }
          }
        ],

        // Average processing time (only scans with processingTime > 0)
        avgProcessing: [
          { $match: { processingTime: { $gt: 0 } } },
          { $group: { _id: null, avg: { $avg: '$processingTime' } } }
        ],

        // Time-windowed counts
        todayScans: [
          { $match: { createdAt: { $gte: todayStart } } },
          { $count: 'count' }
        ],
        weeklyScans: [
          { $match: { createdAt: { $gte: weekStart } } },
          { $count: 'count' }
        ],
        monthlyScans: [
          { $match: { createdAt: { $gte: monthStart } } },
          { $count: 'count' }
        ],

        // Type breakdown
        typeBreakdown: [
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ],

        // Provider usage
        providerUsage: [
          {
            $group: {
              _id: { $ifNull: ['$provider', 'Gemini'] },
              count: { $sum: 1 }
            }
          }
        ],

        // Confidence distribution (5 buckets)
        confidenceDistribution: [
          {
            $bucket: {
              groupBy: '$confidenceScore',
              boundaries: [0, 21, 41, 61, 81, 101],
              default: 'other',
              output: { count: { $sum: 1 } }
            }
          }
        ],

        // Daily trend (last 7 days)
        dailyTrend: [
          { $match: { createdAt: { $gte: dailyBoundaries[0] } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              total: { $sum: 1 },
              safe: { $sum: { $cond: [{ $eq: ['$prediction', 'Real'] }, 1, 0] } },
              threats: { $sum: { $cond: [{ $eq: ['$prediction', 'Fake'] }, 1, 0] } }
            }
          },
          { $sort: { _id: 1 } }
        ],

        // Weekly activity (last 4 weeks)
        weeklyActivity: [
          { $match: { createdAt: { $gte: weeklyBoundaries[0] } } },
          {
            $addFields: {
              weekBucket: {
                $switch: {
                  branches: weeklyBoundaries.slice(0, -1).map((start, i) => ({
                    case: {
                      $and: [
                        { $gte: ['$createdAt', start] },
                        { $lt: ['$createdAt', weeklyBoundaries[i + 1]] }
                      ]
                    },
                    then: `W${i + 1}`
                  })),
                  default: 'W4'
                }
              }
            }
          },
          {
            $group: {
              _id: '$weekBucket',
              total: { $sum: 1 },
              safe: { $sum: { $cond: [{ $eq: ['$prediction', 'Real'] }, 1, 0] } },
              threats: { $sum: { $cond: [{ $eq: ['$prediction', 'Fake'] }, 1, 0] } }
            }
          },
          { $sort: { _id: 1 } }
        ],

        // Recent 10 scans
        recentScans: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 1,
              type: 1,
              content: 1,
              prediction: 1,
              confidenceScore: 1,
              riskLevel: 1,
              credibilityScore: 1,
              explanation: 1,
              provider: { $ifNull: ['$provider', 'Gemini'] },
              processingTime: { $ifNull: ['$processingTime', 0] },
              factCheckReport: { $ifNull: ['$factCheckReport', null] },
              thumbnail: { $ifNull: ['$thumbnail', ''] },
              status: { $ifNull: ['$status', 'success'] },
              timeline: { $ifNull: ['$timeline', []] },
              createdAt: 1
            }
          }
        ],

        // Most recent scan (for active provider)
        latestScan: [
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { provider: { $ifNull: ['$provider', 'Gemini'] } } }
        ]
      }
    }
  ];

  const [[result], totalUsers] = await Promise.all([
    Scan.aggregate(pipeline),
    User.countDocuments()
  ]);

  // Extract core counts
  const core = result.coreCounts[0] || {
    totalScans: 0, fakeScans: 0, realScans: 0,
    failedScans: 0, successfulScans: 0,
    totalConfidence: 0, totalRiskScore: 0,
    totalAiGeneratedProbability: 0, totalHumanAuthenticityProbability: 0
  };

  const totalScans = core.totalScans;
  const avgConfidence = totalScans > 0 ? Math.round(core.totalConfidence / totalScans) : 0;
  const avgRiskScore = totalScans > 0 ? Math.round(core.totalRiskScore / totalScans) : 0;
  const successRate = totalScans > 0 ? Math.round((core.successfulScans / totalScans) * 100) : 0;
  const avgProcessingTime = result.avgProcessing[0] ? Math.round(result.avgProcessing[0].avg) : 0;
  const avgAiGeneratedProbability = totalScans > 0 ? Math.round(core.totalAiGeneratedProbability / totalScans) : 0;
  const avgHumanAuthenticityProbability = totalScans > 0 ? Math.round(core.totalHumanAuthenticityProbability / totalScans) : 0;

  // Type breakdown
  const typeBreakdown = { text: 0, url: 0, image: 0, video: 0 };
  result.typeBreakdown.forEach(t => {
    if (typeBreakdown.hasOwnProperty(t._id)) typeBreakdown[t._id] = t.count;
  });

  // Provider usage
  const providerUsage = {};
  result.providerUsage.forEach(p => {
    const providerName = p._id || 'Gemini';
    const key = providerName.toLowerCase();
    providerUsage[key] = (providerUsage[key] || 0) + p.count;
  });

  // Confidence distribution
  const confBucketMap = { 0: '0-20', 21: '21-40', 41: '41-60', 61: '61-80', 81: '81-100' };
  const confidenceDistribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
  result.confidenceDistribution.forEach(b => {
    const label = confBucketMap[b._id];
    if (label) confidenceDistribution[label] = b.count;
  });

  // Daily trend — fill in missing days with zeros
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyTrendMap = {};
  result.dailyTrend.forEach(d => { dailyTrendMap[d._id] = d; });

  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = dailyTrendMap[dateStr];
    dailyTrend.push({
      day: dayNames[d.getDay()],
      date: dateStr,
      total: entry ? entry.total : 0,
      safe: entry ? entry.safe : 0,
      threats: entry ? entry.threats : 0,
    });
  }

  // Weekly activity — fill in missing weeks
  const weeklyActivityMap = {};
  result.weeklyActivity.forEach(w => { weeklyActivityMap[w._id] = w; });

  const weeklyActivity = [];
  for (let i = 1; i <= 4; i++) {
    const entry = weeklyActivityMap[`W${i}`];
    weeklyActivity.push({
      week: `W${i}`,
      total: entry ? entry.total : 0,
      safe: entry ? entry.safe : 0,
      threats: entry ? entry.threats : 0,
    });
  }

  // Active provider
  const activeProvider = result.latestScan[0]?.provider || 'None';

  // Total users count already resolved in Promise.all

  res.json({
    totalScans,
    fakeScans: core.fakeScans,
    realScans: core.realScans,
    failedScans: core.failedScans,
    successRate,
    avgConfidence,
    avgRiskScore,
    avgProcessingTime,
    avgAiGeneratedProbability,
    avgHumanAuthenticityProbability,
    todayScans: result.todayScans[0]?.count || 0,
    weeklyScans: result.weeklyScans[0]?.count || 0,
    monthlyScans: result.monthlyScans[0]?.count || 0,
    typeBreakdown,
    providerUsage,
    activeProvider,
    confidenceDistribution,
    dailyTrend,
    weeklyActivity,
    recentScans: result.recentScans,
    totalUsers,
  });
}

// ──────────────────────────────────────────────
// JSON DB Fallback (identical logic to legacy getUserStats)
// ──────────────────────────────────────────────
async function getStatsFromJsonFallback(userId, res) {
  const [scans, totalUsers] = await Promise.all([
    Scan.find({ userId }),
    User.countDocuments()
  ]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  const todayStartStr = todayStart.toISOString();
  const weekStartStr = weekStart.toISOString();
  const monthStartStr = monthStart.toISOString();

  const totalScans = scans.length;
  const fakeScans = scans.filter(s => s.prediction === 'Fake').length;
  const realScans = scans.filter(s => s.prediction === 'Real').length;
  const failedScans = scans.filter(s => s.status === 'failed').length;
  const successfulScans = scans.filter(s => s.status !== 'failed').length;
  const successRate = totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 0;

  // Time-windowed counts optimized using ISO string comparisons
  const todayScans = scans.filter(s => (s.createdAt || '') >= todayStartStr).length;
  const weeklyScans = scans.filter(s => (s.createdAt || '') >= weekStartStr).length;
  const monthlyScans = scans.filter(s => (s.createdAt || '') >= monthStartStr).length;

  // Average confidence
  let avgConfidence = 0;
  if (totalScans > 0) {
    avgConfidence = Math.round(scans.reduce((acc, s) => acc + (s.confidenceScore || 0), 0) / totalScans);
  }

  // Average risk score
  let avgRiskScore = 0;
  if (totalScans > 0) {
    const sumRisk = scans.reduce((acc, scan) => {
      let score = scan.prediction === 'Fake' ? scan.confidenceScore : (100 - scan.confidenceScore);
      return acc + score;
    }, 0);
    avgRiskScore = Math.round(sumRisk / totalScans);
  }

  // Average processing time (ms)
  let avgProcessingTime = 0;
  const scansWithTime = scans.filter(s => s.processingTime > 0);
  if (scansWithTime.length > 0) {
    avgProcessingTime = Math.round(scansWithTime.reduce((acc, s) => acc + s.processingTime, 0) / scansWithTime.length);
  }

  // Type breakdown
  const typeBreakdown = {
    text: scans.filter(s => s.type === 'text').length,
    url: scans.filter(s => s.type === 'url').length,
    image: scans.filter(s => s.type === 'image').length,
    video: scans.filter(s => s.type === 'video').length,
  };

  // Average AI / Human probabilities
  let avgAiGeneratedProbability = 0;
  let avgHumanAuthenticityProbability = 0;
  if (totalScans > 0) {
    const sumAi = scans.reduce((acc, s) => {
      const val = s.factCheckReport?.aiGeneratedProbability ?? (s.prediction === 'Fake' ? (s.confidenceScore || 50) : (100 - (s.confidenceScore || 50)));
      return acc + val;
    }, 0);
    const sumHuman = scans.reduce((acc, s) => {
      const val = s.factCheckReport?.humanAuthenticityProbability ?? (s.prediction === 'Real' ? (s.confidenceScore || 50) : (100 - (s.confidenceScore || 50)));
      return acc + val;
    }, 0);
    avgAiGeneratedProbability = Math.round(sumAi / totalScans);
    avgHumanAuthenticityProbability = Math.round(sumHuman / totalScans);
  }

  // Provider usage (calculated dynamically)
  const providerUsage = {};
  scans.forEach(s => {
    const providerName = s.provider || 'Gemini';
    const key = providerName.toLowerCase();
    providerUsage[key] = (providerUsage[key] || 0) + 1;
  });

  // Currently active provider (from most recent scan)
  const activeProvider = totalScans > 0 ? (scans[0].provider || 'Gemini') : 'None';

  // Confidence distribution buckets
  const confidenceDistribution = {
    '0-20': scans.filter(s => s.confidenceScore >= 0 && s.confidenceScore <= 20).length,
    '21-40': scans.filter(s => s.confidenceScore >= 21 && s.confidenceScore <= 40).length,
    '41-60': scans.filter(s => s.confidenceScore >= 41 && s.confidenceScore <= 60).length,
    '61-80': scans.filter(s => s.confidenceScore >= 61 && s.confidenceScore <= 80).length,
    '81-100': scans.filter(s => s.confidenceScore >= 81 && s.confidenceScore <= 100).length,
  };

  // Daily scan trend (last 7 days) optimized with ISO strings
  const dailyTrend = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dStr = d.toISOString();
    const nextDStr = nextD.toISOString();

    const dayScans = scans.filter(s => (s.createdAt || '') >= dStr && (s.createdAt || '') < nextDStr);
    dailyTrend.push({
      day: dayNames[d.getDay()],
      date: d.toISOString().split('T')[0],
      total: dayScans.length,
      safe: dayScans.filter(s => s.prediction === 'Real').length,
      threats: dayScans.filter(s => s.prediction === 'Fake').length,
    });
  }

  // Weekly activity (last 4 weeks) optimized with ISO strings
  const weeklyActivity = [];
  for (let i = 3; i >= 0; i--) {
    const wStart = new Date(todayStart);
    wStart.setDate(wStart.getDate() - (i + 1) * 7);
    const wEnd = new Date(todayStart);
    wEnd.setDate(wEnd.getDate() - i * 7);

    const wStartStr = wStart.toISOString();
    const wEndStr = wEnd.toISOString();

    const wScans = scans.filter(s => (s.createdAt || '') >= wStartStr && (s.createdAt || '') < wEndStr);
    weeklyActivity.push({
      week: `W${4 - i}`,
      total: wScans.length,
      safe: wScans.filter(s => s.prediction === 'Real').length,
      threats: wScans.filter(s => s.prediction === 'Fake').length,
    });
  }

  // Recent 10 scans
  const recentScans = scans.slice(0, 10).map(s => ({
    _id: s._id,
    type: s.type,
    content: s.content,
    prediction: s.prediction,
    confidenceScore: s.confidenceScore,
    riskLevel: s.riskLevel,
    credibilityScore: s.credibilityScore,
    explanation: s.explanation,
    provider: s.provider || 'Gemini',
    processingTime: s.processingTime || 0,
    factCheckReport: s.factCheckReport || null,
    thumbnail: s.thumbnail || '',
    status: s.status || 'success',
    timeline: s.timeline || [],
    createdAt: s.createdAt,
  }));

  res.json({
    totalScans,
    fakeScans,
    realScans,
    failedScans,
    successRate,
    avgConfidence,
    avgRiskScore,
    avgProcessingTime,
    avgAiGeneratedProbability,
    avgHumanAuthenticityProbability,
    todayScans,
    weeklyScans,
    monthlyScans,
    typeBreakdown,
    providerUsage,
    activeProvider,
    confidenceDistribution,
    dailyTrend,
    weeklyActivity,
    recentScans,
    totalUsers,
  });
}
