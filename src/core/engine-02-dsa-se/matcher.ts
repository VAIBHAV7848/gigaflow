/**
 * ENGINE 02: Verification & Evidence Engine (DSA & Software Engineering)
 * Primary Student Owner: Darshan Kittur (02FE24BCS053)
 * Module: Deterministic Heuristic Proposal Matcher
 * 
 * Requirement Supported: FR-11
 * Formula: Score = 0.5 * Jaccard(Skills) + 0.3 * BudgetFit + 0.2 * (Reputation / 5.0)
 */

export interface MatchCandidate {
  freelancerSkills: string[];
  bidAmount: number;
  reputationScore: number; // 0.0 to 5.0
}

export interface MatchRequirement {
  requiredSkills: string[];
  targetBudget: number;
}

export interface MatchResult {
  overallScore: number; // 0.0 to 100.0%
  jaccardSimilarity: number;
  budgetAlignment: number;
  reputationComponent: number;
}

export class ProposalMatcher {
  /**
   * Calculates Jaccard Similarity between two skill sets: |A ∩ B| / |A ∪ B|
   */
  static jaccard(setA: string[], setB: string[]): number {
    const a = new Set(setA.map((s) => s.trim().toLowerCase()));
    const b = new Set(setB.map((s) => s.trim().toLowerCase()));

    if (a.size === 0 && b.size === 0) return 1.0;
    if (a.size === 0 || b.size === 0) return 0.0;

    const intersection = new Set([...a].filter((x) => b.has(x)));
    const union = new Set([...a, ...b]);

    return intersection.size / union.size;
  }

  /**
   * Calculates budget alignment: Closer to 1.0 when bid is close to target budget.
   * If bid is <= budget, score is higher. Penalizes extreme bids.
   */
  static budgetFit(bid: number, target: number): number {
    if (target <= 0) return 1.0;
    const ratio = bid / target;
    // Optimal around 0.8 - 1.0 (slight discount to on-target)
    if (ratio >= 0.8 && ratio <= 1.0) return 1.0;
    if (ratio < 0.8) return Math.max(0.2, ratio / 0.8);
    // Above budget: linear penalty down to 2x budget
    if (ratio <= 2.0) return Math.max(0.1, 1.0 - (ratio - 1.0));
    return 0.05;
  }

  /**
   * Computes the deterministic heuristic matching score.
   */
  static computeMatchScore(candidate: MatchCandidate, req: MatchRequirement): MatchResult {
    const jaccardScore = this.jaccard(candidate.freelancerSkills, req.requiredSkills);
    const budgetScore = this.budgetFit(candidate.bidAmount, req.targetBudget);
    const repScore = Math.min(5.0, Math.max(0.0, candidate.reputationScore)) / 5.0;

    // Weighted synthesis per ADR-010:
    // 50% Skill overlap, 30% Budget fit, 20% Reputation
    const weighted = 0.5 * jaccardScore + 0.3 * budgetScore + 0.2 * repScore;
    const overallScore = Math.round(weighted * 1000) / 10; // e.g. 84.5%

    return {
      overallScore,
      jaccardSimilarity: Math.round(jaccardScore * 100),
      budgetAlignment: Math.round(budgetScore * 100),
      reputationComponent: Math.round(repScore * 100),
    };
  }
}
