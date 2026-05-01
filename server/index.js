import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Load data from extracted JSON files
const dataDir = join(__dirname, '..'); 
const developers = JSON.parse(readFileSync(join(dataDir, 'extracted_dim_developers.json'), 'utf-8'));
const issues = JSON.parse(readFileSync(join(dataDir, 'extracted_fact_jira_issues.json'), 'utf-8'));
const pullRequests = JSON.parse(readFileSync(join(dataDir, 'extracted_fact_pull_requests.json'), 'utf-8'));
const deployments = JSON.parse(readFileSync(join(dataDir, 'extracted_fact_ci_deployments.json'), 'utf-8'));
const bugs = JSON.parse(readFileSync(join(dataDir, 'extracted_fact_bug_reports.json'), 'utf-8'));

// ========== METRIC CALCULATION FUNCTIONS ==========

function calculateMetrics(devId, month) {
  const devIssues = issues.filter(i => i.developer_id === devId && i.month_done === month);
  const devPRs = pullRequests.filter(p => p.developer_id === devId && p.month_merged === month);
  const devDeploys = deployments.filter(d => d.developer_id === devId && d.month_deployed === month && d.status === 'success' && d.environment === 'prod');
  const devBugs = bugs.filter(b => b.developer_id === devId && b.month_found === month && b.escaped_to_prod === 'Yes');

  // Cycle Time: Average cycle_time_days from completed issues
  const avgCycleTime = devIssues.length > 0
    ? devIssues.reduce((sum, i) => sum + i.cycle_time_days, 0) / devIssues.length
    : 0;

  // Lead Time: Average lead_time_days from successful prod deployments
  const avgLeadTime = devDeploys.length > 0
    ? devDeploys.reduce((sum, d) => sum + d.lead_time_days, 0) / devDeploys.length
    : 0;

  // PR Throughput
  const prThroughput = devPRs.length;

  // Deployment Frequency
  const deployFrequency = devDeploys.length;

  // Bug Rate: escaped bugs / issues completed
  const bugRate = devIssues.length > 0
    ? devBugs.length / devIssues.length
    : 0;

  // Extra analytics for deeper interpretation
  const avgReviewWaitHours = devPRs.length > 0
    ? devPRs.reduce((sum, p) => sum + p.review_wait_hours, 0) / devPRs.length
    : 0;

  const avgLinesChanged = devPRs.length > 0
    ? devPRs.reduce((sum, p) => sum + p.lines_changed, 0) / devPRs.length
    : 0;

  const avgReviewRounds = devPRs.length > 0
    ? devPRs.reduce((sum, p) => sum + p.review_rounds, 0) / devPRs.length
    : 0;

  const avgMergeTimeHours = devPRs.length > 0
    ? devPRs.reduce((sum, p) => sum + p.merge_time_hours, 0) / devPRs.length
    : 0;

  return {
    cycleTime: Math.round(avgCycleTime * 100) / 100,
    leadTime: Math.round(avgLeadTime * 100) / 100,
    prThroughput,
    deployFrequency,
    bugRate: Math.round(bugRate * 100) / 100,
    issuesDone: devIssues.length,
    escapedBugs: devBugs.length,
    avgReviewWaitHours: Math.round(avgReviewWaitHours * 10) / 10,
    avgLinesChanged: Math.round(avgLinesChanged),
    avgReviewRounds: Math.round(avgReviewRounds * 10) / 10,
    avgMergeTimeHours: Math.round(avgMergeTimeHours * 10) / 10,
    totalLinesChanged: devPRs.reduce((sum, p) => sum + p.lines_changed, 0),
    totalStoryPoints: devIssues.reduce((sum, i) => sum + (i.story_points || 0), 0),
    bugDetails: devBugs.map(b => ({ 
      id: b.bug_id,
      severity: b.severity, 
      rootCause: b.root_cause_bucket,
      linkedIssue: b.linked_issue_id,
      status: b.status,
    })),
  };
}

// ========== FLOW BREAKDOWN (Pipeline Stage Analysis) ==========

function calculateFlowBreakdown(devId, month) {
  const devPRs = pullRequests.filter(p => p.developer_id === devId && p.month_merged === month);
  const devDeploys = deployments.filter(d => d.developer_id === devId && d.month_deployed === month && d.status === 'success');

  if (devPRs.length === 0) return null;

  // Calculate average time spent in each stage (in hours)
  let totalCodingHours = 0;
  let totalReviewWaitHours = 0;
  let totalReviewToMergeHours = 0;
  let totalMergeToDeployHours = 0;

  devPRs.forEach(pr => {
    // Coding time: issue in_progress to PR opened (approximate from data)
    totalReviewWaitHours += pr.review_wait_hours;
    totalReviewToMergeHours += (pr.merge_time_hours - pr.review_wait_hours);

    // Merge to deploy: find the deployment for this PR
    const deploy = devDeploys.find(d => d.pr_id === pr.pr_id);
    if (deploy) {
      const mergeToDeployDays = deploy.lead_time_days - (pr.merge_time_hours / 24);
      totalMergeToDeployHours += Math.max(0, mergeToDeployDays * 24);
    }
  });

  const count = devPRs.length;
  
  const stages = [
    {
      name: 'Review Wait',
      hours: Math.round(totalReviewWaitHours / count * 10) / 10,
      description: 'Time from PR opened to first review',
      color: '#f59e0b',
    },
    {
      name: 'Review & Merge',
      hours: Math.round(totalReviewToMergeHours / count * 10) / 10,
      description: 'Time from first review to merge',
      color: '#3b82f6',
    },
    {
      name: 'Deploy Pipeline',
      hours: Math.round(totalMergeToDeployHours / count * 10) / 10,
      description: 'Time from merge to production deploy',
      color: '#8b5cf6',
    },
  ];

  const totalHours = stages.reduce((s, st) => s + st.hours, 0);
  stages.forEach(s => {
    s.percentage = totalHours > 0 ? Math.round(s.hours / totalHours * 100) : 0;
  });

  // Identify the bottleneck
  const bottleneck = stages.reduce((max, s) => s.percentage > max.percentage ? s : max, stages[0]);

  return { stages, totalHours: Math.round(totalHours * 10) / 10, bottleneck: bottleneck.name };
}

// ========== HEALTH SCORE CALCULATION ==========

function calculateHealthScore(metrics) {
  // Weighted composite score (0-100)
  // Based on benchmark thresholds for each metric
  let score = 0;

  // Cycle time score (25 points) — lower is better
  if (metrics.cycleTime <= 2) score += 25;
  else if (metrics.cycleTime <= 4) score += 20;
  else if (metrics.cycleTime <= 6) score += 12;
  else score += 5;

  // Lead time score (25 points) — lower is better
  if (metrics.leadTime <= 2) score += 25;
  else if (metrics.leadTime <= 3.5) score += 20;
  else if (metrics.leadTime <= 5) score += 12;
  else score += 5;

  // PR Throughput score (15 points) — higher is better
  if (metrics.prThroughput >= 4) score += 15;
  else if (metrics.prThroughput >= 2) score += 12;
  else if (metrics.prThroughput >= 1) score += 7;
  else score += 0;

  // Deploy Frequency score (15 points) — higher is better
  if (metrics.deployFrequency >= 4) score += 15;
  else if (metrics.deployFrequency >= 2) score += 12;
  else if (metrics.deployFrequency >= 1) score += 7;
  else score += 0;

  // Bug Rate score (20 points) — lower is better
  if (metrics.bugRate === 0) score += 20;
  else if (metrics.bugRate <= 0.1) score += 15;
  else if (metrics.bugRate <= 0.3) score += 10;
  else score += 3;

  return score;
}

// ========== INTERPRETATION ENGINE ==========

function getBenchmarkRating(metric, value) {
  const benchmarks = {
    cycleTime: { elite: 2, high: 4, medium: 6 },
    leadTime: { elite: 2, high: 3.5, medium: 5 },
    prThroughput: { elite: 4, high: 2, medium: 1 },
    deployFrequency: { elite: 4, high: 2, medium: 1 },
    bugRate: { elite: 0, high: 0.1, medium: 0.3 },
  };

  const b = benchmarks[metric];
  if (!b) return 'unknown';

  if (metric === 'cycleTime' || metric === 'leadTime' || metric === 'bugRate') {
    if (value <= b.elite) return 'elite';
    if (value <= b.high) return 'high';
    if (value <= b.medium) return 'medium';
    return 'needs-focus';
  } else {
    if (value >= b.elite) return 'elite';
    if (value >= b.high) return 'high';
    if (value >= b.medium) return 'medium';
    return 'needs-focus';
  }
}

function generateInterpretation(metrics, prevMetrics, developer, flowBreakdown) {
  const interpretations = [];
  const nextSteps = [];

  const cycleRating = getBenchmarkRating('cycleTime', metrics.cycleTime);
  const leadRating = getBenchmarkRating('leadTime', metrics.leadTime);
  const bugRating = getBenchmarkRating('bugRate', metrics.bugRate);

  let pattern = 'Healthy flow';

  // Pattern: High bug rate
  if (metrics.bugRate >= 0.5) {
    pattern = 'Quality watch';
    interpretations.push(
      `Your bug rate is ${(metrics.bugRate * 100).toFixed(0)}% this month — ${metrics.escapedBugs} escaped bug${metrics.escapedBugs > 1 ? 's' : ''} out of ${metrics.issuesDone} issues completed. This suggests some changes are reaching production without sufficient testing or review coverage.`
    );

    if (metrics.bugDetails.length > 0) {
      const causes = [...new Set(metrics.bugDetails.map(b => b.rootCause))].join(', ');
      interpretations.push(`Root causes identified: ${causes}. Understanding these patterns helps prevent similar issues.`);
    }

    nextSteps.push({
      title: 'Strengthen pre-merge quality checks',
      description: `Consider adding targeted test cases for ${metrics.bugDetails[0]?.rootCause || 'common'} scenarios before merging. Pair reviews on complex changes can catch issues that automated tests miss.`,
      priority: 'high',
      icon: 'shield',
    });
  }

  // Pattern: High lead time but normal cycle time
  if (metrics.leadTime > 3.5 && metrics.cycleTime <= 4.5) {
    if (pattern === 'Healthy flow') pattern = 'Pipeline bottleneck';
    interpretations.push(
      `Your cycle time (${metrics.cycleTime} days) shows efficient work completion, but lead time (${metrics.leadTime} days) is higher — there's a gap between finishing code and reaching production.`
    );

    // Use flow breakdown for specific insight
    if (flowBreakdown) {
      interpretations.push(
        `Pipeline analysis shows the biggest time sink is "${flowBreakdown.bottleneck}" (averaging ${flowBreakdown.stages.find(s => s.name === flowBreakdown.bottleneck)?.hours || '?'} hours per PR).`
      );
    }

    if (metrics.avgReviewWaitHours > 15) {
      nextSteps.push({
        title: 'Reduce review wait time',
        description: `Your PRs wait ${metrics.avgReviewWaitHours} hours for first review on average. Try requesting reviews earlier in the day, or pair-program to reduce back-and-forth.`,
        priority: 'high',
        icon: 'clock',
      });
    }

    nextSteps.push({
      title: 'Break PRs into smaller chunks',
      description: `Your PRs average ${metrics.avgLinesChanged} lines changed. Smaller PRs (under 300 lines) get reviewed 40% faster and have fewer defects. Try incremental delivery.`,
      priority: 'medium',
      icon: 'git-pull-request',
    });
  }

  // Pattern: High cycle time  
  if (metrics.cycleTime > 5) {
    if (pattern === 'Healthy flow') pattern = 'Needs review';
    interpretations.push(
      `Your cycle time of ${metrics.cycleTime} days is above the healthy range (≤4 days). Issues take longer from "In Progress" to "Done." This could indicate scope creep, blockers, or complex work needing better breakdown.`
    );

    nextSteps.push({
      title: 'Break down complex tickets',
      description: 'Split larger stories into smaller, independently deliverable pieces. This improves flow predictability and makes blockers visible earlier.',
      priority: 'medium',
      icon: 'scissors',
    });
  }

  // Pattern: Large PR size correlation
  if (metrics.avgLinesChanged > 500 && metrics.avgReviewRounds >= 2) {
    interpretations.push(
      `Your PRs average ${metrics.avgLinesChanged} lines with ${metrics.avgReviewRounds} review rounds. Large PRs correlate with longer review cycles and higher defect rates.`
    );
  }

  // Trend comparison
  if (prevMetrics) {
    const cycleChange = metrics.cycleTime - prevMetrics.cycleTime;
    const leadChange = metrics.leadTime - prevMetrics.leadTime;
    const bugChange = metrics.bugRate - prevMetrics.bugRate;

    if (cycleChange < -0.5) {
      interpretations.push(`Good news: cycle time improved by ${Math.abs(cycleChange).toFixed(1)} days vs. last month.`);
    } else if (cycleChange > 0.5) {
      interpretations.push(`Cycle time increased by ${cycleChange.toFixed(1)} days vs. last month — worth investigating if this trend continues.`);
    }

    if (bugChange > 0.2) {
      interpretations.push(`Bug rate increased from ${(prevMetrics.bugRate * 100).toFixed(0)}% to ${(metrics.bugRate * 100).toFixed(0)}%. This is a key area to watch.`);
    } else if (bugChange < -0.2) {
      interpretations.push(`Bug rate improved from ${(prevMetrics.bugRate * 100).toFixed(0)}% to ${(metrics.bugRate * 100).toFixed(0)}%. Great progress on quality!`);
    }
  }

  // Healthy flow
  if (pattern === 'Healthy flow') {
    interpretations.push(
      `You're in a healthy flow state. Consistent delivery (${metrics.prThroughput} PRs merged, ${metrics.deployFrequency} deployments) with good cycle time (${metrics.cycleTime} days) and ${metrics.bugRate === 0 ? 'zero escaped bugs' : 'minimal bugs'}. Keep this rhythm going.`
    );

    nextSteps.push({
      title: 'Maintain your momentum',
      description: 'Your delivery flow is strong. Consider mentoring a teammate or investing in documentation and tech debt to sustain long-term velocity.',
      priority: 'low',
      icon: 'rocket',
    });

    nextSteps.push({
      title: 'Optimize review turnaround',
      description: `Your review wait averages ${metrics.avgReviewWaitHours} hours. Even in a healthy flow, reducing this compounds into faster delivery over time.`,
      priority: 'low',
      icon: 'zap',
    });
  }

  return {
    pattern,
    interpretation: interpretations.join(' '),
    nextSteps: nextSteps.slice(0, 3),
    ratings: {
      cycleTime: cycleRating,
      leadTime: leadRating,
      prThroughput: getBenchmarkRating('prThroughput', metrics.prThroughput),
      deployFrequency: getBenchmarkRating('deployFrequency', metrics.deployFrequency),
      bugRate: bugRating,
    },
  };
}

// ========== API ROUTES ==========

// GET /api/developers
app.get('/api/developers', (req, res) => {
  res.json(developers);
});

// GET /api/developers/:id
app.get('/api/developers/:id', (req, res) => {
  const dev = developers.find(d => d.developer_id === req.params.id);
  if (!dev) return res.status(404).json({ error: 'Developer not found' });
  res.json(dev);
});

// GET /api/metrics/:devId — full metrics + interpretation + flow breakdown + health score
app.get('/api/metrics/:devId', (req, res) => {
  const { devId } = req.params;
  const month = req.query.month || '2026-04';
  
  const dev = developers.find(d => d.developer_id === devId);
  if (!dev) return res.status(404).json({ error: 'Developer not found' });

  const metrics = calculateMetrics(devId, month);
  const prevMonth = month === '2026-04' ? '2026-03' : null;
  const prevMetrics = prevMonth ? calculateMetrics(devId, prevMonth) : null;
  const flowBreakdown = calculateFlowBreakdown(devId, month);
  const healthScore = calculateHealthScore(metrics);
  const prevHealthScore = prevMetrics ? calculateHealthScore(prevMetrics) : null;
  const interpretation = generateInterpretation(metrics, prevMetrics, dev, flowBreakdown);

  res.json({
    developer: dev,
    month,
    metrics,
    prevMetrics,
    flowBreakdown,
    healthScore,
    prevHealthScore,
    ...interpretation,
  });
});

// GET /api/metrics/:devId/trend
app.get('/api/metrics/:devId/trend', (req, res) => {
  const { devId } = req.params;
  const months = ['2026-03', '2026-04'];

  const trend = months.map(month => ({
    month,
    ...calculateMetrics(devId, month),
    healthScore: calculateHealthScore(calculateMetrics(devId, month)),
  }));

  res.json(trend);
});

// GET /api/metrics/:devId/drilldown — detailed PR and issue data
app.get('/api/metrics/:devId/drilldown', (req, res) => {
  const { devId } = req.params;
  const month = req.query.month || '2026-04';

  const devIssues = issues.filter(i => i.developer_id === devId && i.month_done === month);
  const devPRs = pullRequests.filter(p => p.developer_id === devId && p.month_merged === month);
  const devDeploys = deployments.filter(d => d.developer_id === devId && d.month_deployed === month);
  const devBugs = bugs.filter(b => b.developer_id === devId && b.month_found === month);

  res.json({
    issues: devIssues.map(i => ({
      id: i.issue_id,
      type: i.issue_type,
      storyPoints: i.story_points,
      cycleTimeDays: i.cycle_time_days,
      status: i.status,
    })),
    pullRequests: devPRs.map(p => ({
      id: p.pr_id,
      issueId: p.issue_id,
      linesChanged: p.lines_changed,
      reviewWaitHours: p.review_wait_hours,
      mergeTimeHours: p.merge_time_hours,
      reviewRounds: p.review_rounds,
      status: p.status,
    })),
    deployments: devDeploys.map(d => ({
      id: d.deployment_id,
      prId: d.pr_id,
      leadTimeDays: d.lead_time_days,
      status: d.status,
      releaseType: d.release_type,
    })),
    bugs: devBugs.map(b => ({
      id: b.bug_id,
      severity: b.severity,
      rootCause: b.root_cause_bucket,
      linkedIssue: b.linked_issue_id,
      status: b.status,
      escapedToProd: b.escaped_to_prod,
    })),
  });
});

// GET /api/manager/:managerId
app.get('/api/manager/:managerId', (req, res) => {
  const { managerId } = req.params;
  const month = req.query.month || '2026-04';

  const teamDevs = developers.filter(d => d.manager_id === managerId);
  if (teamDevs.length === 0) return res.status(404).json({ error: 'Manager not found' });

  const manager = { id: managerId, name: teamDevs[0].manager_name, team: teamDevs[0].team_name };

  const devMetrics = teamDevs.map(dev => {
    const metrics = calculateMetrics(dev.developer_id, month);
    const prevMonth = month === '2026-04' ? '2026-03' : null;
    const prevMetrics = prevMonth ? calculateMetrics(dev.developer_id, prevMonth) : null;
    const interpretation = generateInterpretation(metrics, prevMetrics, dev, null);
    const healthScore = calculateHealthScore(metrics);
    return {
      developer: dev,
      metrics,
      pattern: interpretation.pattern,
      ratings: interpretation.ratings,
      healthScore,
    };
  });

  const teamMetrics = {
    avgLeadTime: Math.round(devMetrics.reduce((s, d) => s + d.metrics.leadTime, 0) / devMetrics.length * 100) / 100,
    avgCycleTime: Math.round(devMetrics.reduce((s, d) => s + d.metrics.cycleTime, 0) / devMetrics.length * 100) / 100,
    avgBugRate: Math.round(devMetrics.reduce((s, d) => s + d.metrics.bugRate, 0) / devMetrics.length * 100) / 100,
    totalPRs: devMetrics.reduce((s, d) => s + d.metrics.prThroughput, 0),
    totalDeploys: devMetrics.reduce((s, d) => s + d.metrics.deployFrequency, 0),
    teamSize: devMetrics.length,
    avgHealthScore: Math.round(devMetrics.reduce((s, d) => s + d.healthScore, 0) / devMetrics.length),
  };

  const hasQualityIssues = devMetrics.some(d => d.pattern === 'Quality watch');
  const hasBottlenecks = devMetrics.some(d => d.pattern === 'Pipeline bottleneck' || d.pattern === 'Needs review');
  let signal = 'Healthy flow';
  if (hasQualityIssues) signal = 'Watch quality';
  else if (hasBottlenecks) signal = 'Watch bottlenecks';

  res.json({ manager, month, teamMetrics, developers: devMetrics, signal });
});

// GET /api/managers
app.get('/api/managers', (req, res) => {
  const managerMap = {};
  developers.forEach(d => {
    if (!managerMap[d.manager_id]) {
      managerMap[d.manager_id] = {
        id: d.manager_id,
        name: d.manager_name,
        team: d.team_name,
        devCount: 0,
      };
    }
    managerMap[d.manager_id].devCount++;
  });
  res.json(Object.values(managerMap));
});

// Export app for Vercel serverless functions
export default app;

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`DevPulse API server running on http://localhost:${PORT}`);
  });
}
