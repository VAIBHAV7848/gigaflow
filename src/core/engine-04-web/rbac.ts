/**
 * ENGINE 04: Role-Based Workflow Dashboard (Web Technologies & Security)
 * Primary Student Owner: Vaibhav Chavanpatil (02FE24BCS013)
 * Module: Least-Privilege Role-Based Access Control (RBAC) Matrix
 * 
 * Requirements Supported: FR-07, FR-08, NFR-02, NFR-06
 * Principle: Enforces strict boundary permissions. Clients cannot arbitrate disputes;
 * Freelancers cannot approve their own milestone releases; Arbiters cannot modify project scopes.
 */

import { Role } from "@prisma/client";

export type ActionPermission =
  | "POST_JOB"
  | "SUBMIT_PROPOSAL"
  | "AWARD_CONTRACT"
  | "FUND_ESCROW"
  | "SUBMIT_DELIVERABLE"
  | "APPROVE_MILESTONE"
  | "OPEN_DISPUTE"
  | "RULE_DISPUTE"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_SYSTEM";

const ROLE_PERMISSIONS: Record<Role, ActionPermission[]> = {
  CLIENT: [
    "POST_JOB",
    "AWARD_CONTRACT",
    "FUND_ESCROW",
    "APPROVE_MILESTONE",
    "OPEN_DISPUTE",
  ],
  FREELANCER: [
    "SUBMIT_PROPOSAL",
    "SUBMIT_DELIVERABLE",
    "OPEN_DISPUTE",
  ],
  ARBITER: [
    "RULE_DISPUTE",
    "VIEW_AUDIT_LOGS",
  ],
  ADMIN: [
    "POST_JOB",
    "SUBMIT_PROPOSAL",
    "AWARD_CONTRACT",
    "FUND_ESCROW",
    "SUBMIT_DELIVERABLE",
    "APPROVE_MILESTONE",
    "OPEN_DISPUTE",
    "RULE_DISPUTE",
    "VIEW_AUDIT_LOGS",
    "MANAGE_SYSTEM",
  ],
};

export class RBACGuard {
  /**
   * Checks if a given role is authorized to perform an action.
   */
  static hasPermission(role: Role, action: ActionPermission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(action);
  }

  /**
   * Asserts permission or throws a standardized 403 Forbidden error.
   */
  static assertPermission(role: Role, action: ActionPermission): void {
    if (!this.hasPermission(role, action)) {
      throw new Error(`403 Forbidden: Role '${role}' lacks permission to perform action '${action}'.`);
    }
  }

  /**
   * Returns list of allowed dashboard navigation routes for a role.
   */
  static getAllowedRoutes(role: Role): string[] {
    switch (role) {
      case "CLIENT":
        return ["/dashboard", "/projects", "/contracts", "/disputes"];
      case "FREELANCER":
        return ["/dashboard", "/gigs", "/contracts", "/disputes"];
      case "ARBITER":
        return ["/dashboard", "/disputes", "/audit"];
      case "ADMIN":
        return ["/dashboard", "/projects", "/contracts", "/disputes", "/audit", "/engines"];
      default:
        return ["/dashboard"];
    }
  }
}
