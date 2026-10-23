/**
 * ENGINE 01: Escrow & State Scheduler (Operating Systems Principles)
 * Primary Student Owner: Vaishnavi Modekar (02FE24BCS060)
 * Module: Automated 7-Day Review Watchdog Scheduler (Timer Daemon)
 * 
 * Requirement Supported: FR-02, D-02
 * Purpose: Prevents developer payment starvation. If client does not approve or dispute
 * within the 7-calendar-day window, system triggers automatic approval and payout.
 */

export interface WatchdogEvaluation {
  milestoneId: string;
  submittedAt: Date;
  reviewDeadline: Date;
  hasExpired: boolean;
  remainingMs: number;
  formattedRemaining: string;
}

export class WatchdogScheduler {
  public static readonly DEFAULT_TIMEOUT_DAYS = 7;

  /**
   * Calculates the review deadline timestamp for a newly submitted deliverable.
   */
  static calculateDeadline(submissionDate: Date = new Date(), days: number = this.DEFAULT_TIMEOUT_DAYS): Date {
    const deadline = new Date(submissionDate.getTime());
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  }

  /**
   * Evaluates if an active review window has expired.
   */
  static evaluateTimeout(submissionDate: Date, reviewDeadline?: Date | null): WatchdogEvaluation {
    const now = new Date();
    const effectiveDeadline = reviewDeadline || this.calculateDeadline(submissionDate);
    const remainingMs = effectiveDeadline.getTime() - now.getTime();
    const hasExpired = remainingMs <= 0;

    let formattedRemaining = "Expired";
    if (!hasExpired) {
      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      formattedRemaining = `${days}d ${hours}h ${minutes}m`;
    }

    return {
      milestoneId: "",
      submittedAt: submissionDate,
      reviewDeadline: effectiveDeadline,
      hasExpired,
      remainingMs: Math.max(0, remainingMs),
      formattedRemaining,
    };
  }
}
