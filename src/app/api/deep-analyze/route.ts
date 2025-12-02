import { NextRequest, NextResponse } from 'next/server';
import { summarizeRepoExecute } from '@/lib/tools/summarizeRepo';

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, files, metadata, keyFilesContent } = await req.json();

    if (!owner || !repo || !files || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🤖 Starting deep code analysis for ${owner}/${repo}...`);

    const result = await summarizeRepoExecute({
      owner,
      repo,
      files,
      metadata,
      keyFilesContent: keyFilesContent || {},
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to analyze repository' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
      filesAnalyzedCount: result.filesAnalyzedCount,
      projectType: result.projectType,
    });
  } catch (error: unknown) {
    console.error('Deep analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze repository';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
