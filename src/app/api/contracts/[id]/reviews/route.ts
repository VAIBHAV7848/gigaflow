import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: contractId } = await params;
    const { rating, feedback } = await req.json();

    const starRating = parseInt(rating);
    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5 stars." }, { status: 400 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Determine reviewee (if current user is client, reviewee is freelancer, and vice versa)
    const revieweeId = session.userId === contract.clientId ? contract.freelancerId : contract.clientId;

    const review = await prisma.review.create({
      data: {
        contractId,
        reviewerId: session.userId,
        revieweeId,
        rating: starRating,
        feedback: feedback || "Completed successfully.",
      },
    });

    // Recalculate dynamic reputation score for the reviewee
    const allReviews = await prisma.review.findMany({
      where: { revieweeId },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const newReputation = Math.round(avgRating * 10) / 10;

    await prisma.profile.update({
      where: { userId: revieweeId },
      data: { reputationScore: newReputation },
    });

    await ChainedAuditLogger.recordEvent({
      actorId: session.userId,
      actorRole: session.role,
      action: "REVIEW_SUBMITTED",
      resourceType: "Review",
      resourceId: review.id,
      payload: { contractId, rating: starRating, revieweeId, newReputation },
    });

    return NextResponse.json({ success: true, review, newReputation });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
