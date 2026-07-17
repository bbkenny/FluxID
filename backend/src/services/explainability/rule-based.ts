import type { ScoreResult } from '../../types/scoring.types.js';
import type { Explanation } from './types.js';

// Deterministic text generation — same inputs always produce the same output.
// Used when the LLM layer is unavailable or opts out.
export function generateRuleBasedExplanation(result: ScoreResult): Explanation {
  const { metrics, score, risk } = result;

  const insights: string[] = [];
  const suggestions: string[] = [];

  if (metrics.transactionCount === 0) {
    return {
      insight: `No transaction history available for this wallet (${result.accountId.slice(0, 6)}...${result.accountId.slice(-4)}).`,
      suggestions: ['Make a few inbound and outbound transactions to build a liquidity profile.'],
      source: 'rule-based',
      generatedAt: new Date().toISOString(),
    };
  }

  if (metrics.inflowScore >= 70) {
    insights.push('consistent inflow patterns');
  } else if (metrics.inflowScore < 40) {
    insights.push('irregular income patterns');
    suggestions.push('Establish more consistent income sources.');
  }

  if (metrics.outflowScore >= 70) {
    insights.push('stable spending behavior');
  } else if (metrics.outflowScore < 40) {
    insights.push('volatile spending patterns');
    suggestions.push('Stabilize outflows for better financial health.');
  }

  if (metrics.flowStabilityScore >= 70) {
    insights.push('balanced inflow vs outflow');
  } else if (metrics.flowStabilityScore < 40) {
    insights.push('flow imbalance between in and out');
  }

  if (metrics.frequencyScore < 30) {
    suggestions.push('Increase transaction frequency to demonstrate active use.');
  }

  if (risk === 'Low' && suggestions.length === 0) {
    suggestions.push('Consider preserving a portion of incoming funds as a reserve.');
  }
  if (risk === 'High' && suggestions.length === 0) {
    suggestions.push('Focus on smaller, more frequent transactions to improve reliability.');
  }

  const insight =
    insights.length > 0
      ? `Score ${score} — wallet shows ${insights.join(', ')}.`
      : `Score ${score} — limited signal from current activity.`;

  return {
    insight,
    suggestions: suggestions.slice(0, 2),
    source: 'rule-based',
    generatedAt: new Date().toISOString(),
  };
}
