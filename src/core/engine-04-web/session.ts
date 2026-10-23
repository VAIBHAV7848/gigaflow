/**
 * ENGINE 04: Role-Based Workflow Dashboard (Web Technologies & Security)
 * Primary Student Owner: Vaibhav Chavanpatil (02FE24BCS013)
 * Module: Session Security & 1-Click Evaluation Persona Switcher
 * 
 * Requirement Supported: FR-07, NFR-02
 * Purpose: Provides secure JWT cookie management with a zero-friction evaluation switcher
 * for academic evaluators to switch between Client, Freelancer, Arbiter, and Admin in 1 click.
 */

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "gigaflow-escrow-secret-key-kle-tech-team-07-2026";
export const SESSION_COOKIE_NAME = "gigaflow_session_token";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export class SessionService {
  /**
   * Signs a secure session JWT valid for 7 days.
   */
  static signToken(payload: SessionPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  }

  /**
   * Verifies a session JWT and returns the decoded payload.
   */
  static verifyToken(token: string): SessionPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch {
      return null;
    }
  }

  /**
   * Extracts session from incoming request cookies (Server Component / Route Handler).
   */
  static async getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return this.verifyToken(token);
  }

  /**
   * Predefined evaluation personas for instant 1-click Gate review testing.
   */
  static readonly DEMO_PERSONAS: Record<Role, { email: string; name: string; role: Role; bio: string }> = {
    CLIENT: {
      email: "alice.client@gigaflow.dev",
      name: "Alice Montgomery (Client)",
      role: Role.CLIENT,
      bio: "Tech Product Lead hiring elite engineers for verified milestone contracts.",
    },
    FREELANCER: {
      email: "bob.developer@gigaflow.dev",
      name: "Bob Jenkins (Senior Full-Stack)",
      role: Role.FREELANCER,
      bio: "Full-Stack TypeScript & Next.js engineer with 5.0 reputation score.",
    },
    ARBITER: {
      email: "carol.arbiter@gigaflow.dev",
      name: "Carol Vance (Independent Arbiter)",
      role: Role.ARBITER,
      bio: "Impartial technical dispute mediator inspecting Merkle proofs and code diffs.",
    },
    ADMIN: {
      email: "dave.admin@gigaflow.dev",
      name: "Dave Chen (System Overseer)",
      role: Role.ADMIN,
      bio: "Platform administrator with access to the 4-Engine telemetry and ledger audits.",
    },
  };
}
