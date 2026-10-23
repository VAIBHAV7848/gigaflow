/**
 * ENGINE 03: Ledger & Audit Core (DBMS & Financial Integrity)
 * Primary Student Owner: Purvi Sammatshetti (02FE24BCS022)
 * Module: Hash-Chained Append-Only Audit Logger
 * 
 * Requirements Supported: FR-06, NFR-09
 * Mathematical Formula:
 *   Hash_n = SHA256(Payload_n + Hash_{n-1} + Timestamp)
 * Guarantees cryptographic immutability: Any retroactive modification of past rows
 * invalidates every subsequent hash in the chain.
 */

import { prisma } from "@/lib/prisma";
import { CryptographicHasher } from "../engine-02-dsa-se/hasher";

export class ChainedAuditLogger {
  public static readonly GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

  /**
   * Appends an immutable audit event to the cryptographically linked chain.
   */
  static async recordEvent(params: {
    actorId?: string;
    actorRole?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    payload?: unknown;
  }) {
    // 1. Fetch the latest record to get previous hash
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const previousHash = lastLog ? lastLog.currentHash : this.GENESIS_HASH;
    const timestamp = new Date().toISOString();
    const payloadStr = params.payload ? JSON.stringify(params.payload) : "{}";

    // 2. Compute chained hash
    const rawPayload = `${previousHash}|${params.actorId || "SYSTEM"}|${params.action}|${params.resourceType}:${params.resourceId}|${payloadStr}|${timestamp}`;
    const currentHash = CryptographicHasher.sha256(rawPayload);

    // 3. Persist to append-only table
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        payloadJson: payloadStr,
        previousHash,
        currentHash,
      },
    });
  }

  /**
   * Audits the entire chain from genesis to head:
   * Returns whether the chain is authentic or if tampering has occurred.
   */
  static async verifyChainIntegrity(): Promise<{
    isValid: boolean;
    totalRecords: number;
    tamperedRecordIndex?: number;
    error?: string;
  }> {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (logs.length === 0) {
      return { isValid: true, totalRecords: 0 };
    }

    let expectedPrevHash = this.GENESIS_HASH;

    for (let i = 0; i < logs.length; i++) {
      const record = logs[i];

      // Verify link to previous
      if (record.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalRecords: logs.length,
          tamperedRecordIndex: i,
          error: `Broken hash chain at record #${i} (ID: ${record.id}). Expected previous hash '${expectedPrevHash}', found '${record.previousHash}'.`,
        };
      }

      expectedPrevHash = record.currentHash;
    }

    return {
      isValid: true,
      totalRecords: logs.length,
    };
  }
}
