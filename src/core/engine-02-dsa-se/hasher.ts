/**
 * ENGINE 02: Verification & Evidence Engine (DSA & Software Engineering)
 * Primary Student Owner: Darshan Kittur (02FE24BCS053)
 * Module: Cryptographic SHA-256 Checksumming
 * 
 * Requirements Supported: FR-03, NFR-03
 * Purpose: Computes deterministic cryptographic digests for code commits, deliverables,
 * specifications, and audit payload chains.
 */

import crypto from "crypto";

export class CryptographicHasher {
  /**
   * Generates a standard SHA-256 hex digest for arbitrary string or buffer data.
   */
  static sha256(data: string | Buffer): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Formats a canonical deliverable digest combining commit hash, content hash, and timestamp.
   */
  static deliverableDigest(commitSha: string, contentHash: string, timestamp: string): string {
    const payload = `${commitSha}:${contentHash}:${timestamp}`;
    return this.sha256(payload);
  }

  /**
   * Verifies if raw content matches an expected SHA-256 checksum.
   */
  static verifyDigest(data: string | Buffer, expectedHash: string): boolean {
    const actual = this.sha256(data);
    return actual.toLowerCase() === expectedHash.toLowerCase();
  }
}
