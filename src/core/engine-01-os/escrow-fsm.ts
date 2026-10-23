/**
 * ENGINE 01: Escrow & State Scheduler (Operating Systems Principles)
 * Primary Student Owner: Vaishnavi Modekar (02FE24BCS060)
 * Module: Finite State Machine (FSM) & Milestone Lifecycle Scheduler
 * 
 * Requirements Supported: FR-01, FR-02, FR-12, NFR-05
 * Invariants:
 *  1. Non-linear or skipped transitions are rejected with 400 Bad Request.
 *  2. Milestone K+1 cannot be funded/started until Milestone K is approved or resolved.
 *  3. Duplicate fund locks are prevented atomically.
 */

export type MilestoneState =
  | "LOCKED"
  | "FUNDED"
  | "IN_DEVELOPMENT"
  | "SUBMITTED"
  | "APPROVED"
  | "DISPUTED"
  | "REFUNDED";

export interface StateTransitionResult {
  success: boolean;
  previousState: MilestoneState;
  newState: MilestoneState;
  error?: string;
}

// Strict state transition lookup matrix
const VALID_TRANSITIONS: Record<MilestoneState, MilestoneState[]> = {
  LOCKED: ["FUNDED"],
  FUNDED: ["IN_DEVELOPMENT", "REFUNDED"],
  IN_DEVELOPMENT: ["SUBMITTED", "DISPUTED"],
  SUBMITTED: ["APPROVED", "DISPUTED", "IN_DEVELOPMENT"], // IN_DEVELOPMENT for revisions
  APPROVED: [], // Terminal successful state
  DISPUTED: ["APPROVED", "REFUNDED"], // Resolution branches
  REFUNDED: [], // Terminal refund state
};

export class EscrowStateMachine {
  /**
   * Validates if a proposed state transition is legally permitted.
   */
  static canTransition(current: MilestoneState, target: MilestoneState): boolean {
    const allowed = VALID_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  /**
   * Enforces transition rules and returns descriptive telemetry.
   */
  static transition(current: MilestoneState, target: MilestoneState): StateTransitionResult {
    if (current === target) {
      return {
        success: false,
        previousState: current,
        newState: current,
        error: `Redundant state transition: Milestone is already in state '${current}'.`,
      };
    }

    if (!this.canTransition(current, target)) {
      return {
        success: false,
        previousState: current,
        newState: current,
        error: `Illegal state transition: Cannot transition milestone from '${current}' to '${target}'. Permitted: [${VALID_TRANSITIONS[current].join(", ")}].`,
      };
    }

    return {
      success: true,
      previousState: current,
      newState: target,
    };
  }

  /**
   * Checks sequential milestone dependency:
   * Milestone index K cannot start until prior milestones are resolved.
   */
  static validateSequentialExecution(
    milestoneIndex: number,
    allMilestones: { sequenceIndex: number; status: MilestoneState }[]
  ): { eligible: boolean; reason?: string } {
    const prior = allMilestones.filter((m) => m.sequenceIndex < milestoneIndex);
    
    for (const m of prior) {
      if (m.status !== "APPROVED" && m.status !== "REFUNDED") {
        return {
          eligible: false,
          reason: `Milestone sequence dependency violated: Prior Milestone #${m.sequenceIndex} is currently in '${m.status}' state and must resolve first.`,
        };
      }
    }

    return { eligible: true };
  }
}
