import { NextRequest, NextResponse } from 'next/server';
import { saveEvaluationDraft, submitEvaluation } from '@/services/evaluation';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['EVALUATOR', 'SUPER_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Evaluator access required' }, { status: 403 });
    }

    const body = await req.json();
    const { teamId, scores, comments, isDraft, status } = body;

    if (!teamId || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'teamId and scores array are required' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    if (isDraft || status === 'DRAFT') {
      const draft = await saveEvaluationDraft(user!.id, {
        teamId,
        scores,
        comments,
        ip,
        userAgent,
      });
      return NextResponse.json({ success: true, message: 'Draft saved successfully', evaluation: draft });
    } else {
      const evaluation = await submitEvaluation(user!.id, {
        teamId,
        scores,
        comments,
        ip,
        userAgent,
      });
      return NextResponse.json({ success: true, message: 'Evaluation finalized and submitted', evaluation }, { status: 201 });
    }
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Evaluation processing failed' }, { status });
  }
}
