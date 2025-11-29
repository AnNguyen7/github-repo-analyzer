import { z } from 'zod';

export const analyzeStructureParameters = z.object({
  files: z.array(z.string()).describe('List of file paths in the repository'),
  metadata: z.object({
    name: z.string(),
    description: z.string().nullable(),
    language: z.string().nullable(),
  }).describe('Repository metadata'),
  missingFiles: z.object({
    readme: z.boolean(),
    gitignore: z.boolean(),
    license: z.boolean(),
    contributing: z.boolean(),
  }).describe('Which standard files are missing'),
  keyFilesContent: z.record(z.string(), z.string()).describe('Content of key files'),
});

export async function analyzeStructureExecute({ 
  files, 
  metadata, 
  missingFiles, 
  keyFilesContent 
}: z.infer<typeof analyzeStructureParameters>) {
  const issues: string[] = [];
  let documentationScore = 100;
  let structureScore = 100;

  // Check missing files
  if (missingFiles.readme) {
    issues.push('❌ Missing README.md - No project documentation');
    documentationScore -= 30;
  } else {
    const readmeContent = keyFilesContent['README.md'] || keyFilesContent['readme.md'] || '';
    if (readmeContent && readmeContent.length < 500) {
      issues.push('⚠️ README.md is too short - Needs more documentation');
      documentationScore -= 15;
    }
  }

  if (missingFiles.gitignore) {
    issues.push('❌ Missing .gitignore - May have unnecessary files committed');
    structureScore -= 20;
  }

  if (missingFiles.license) {
    issues.push('⚠️ Missing LICENSE - Project licensing unclear');
    documentationScore -= 10;
  }

  if (missingFiles.contributing) {
    issues.push('💡 No CONTRIBUTING.md - Could help attract contributors');
    documentationScore -= 5;
  }

  // Check for common issues
  const hasNodeModules = files.some(f => f.includes('node_modules/'));
  if (hasNodeModules) {
    issues.push('🚨 node_modules committed to repository!');
    structureScore -= 30;
  }

  const hasEnvFile = files.some(f => f === '.env' || f.includes('.env.local'));
  if (hasEnvFile) {
    issues.push('🚨 Environment files may be committed - Security risk!');
    structureScore -= 25;
  }

  const hasBuildDir = files.some(f => 
    f.startsWith('dist/') || 
    f.startsWith('build/') || 
    f.startsWith('.next/')
  );
  if (hasBuildDir) {
    issues.push('⚠️ Build artifacts committed to repository');
    structureScore -= 15;
  }

  // Check folder structure
  const hasSourceFolder = files.some(f => 
    f.startsWith('src/') || 
    f.startsWith('lib/') || 
    f.startsWith('app/')
  );
  if (!hasSourceFolder && files.length > 10) {
    issues.push('💡 Consider organizing code into src/ or lib/ folders');
    structureScore -= 10;
  }

  // Check for tests
  const hasTests = files.some(f => 
    f.includes('test') || 
    f.includes('spec') || 
    f.includes('__tests__')
  );
  if (!hasTests) {
    issues.push('💡 No tests found - Consider adding test coverage');
    structureScore -= 10;
  }

  // Calculate overall score
  documentationScore = Math.max(0, documentationScore);
  structureScore = Math.max(0, structureScore);
  const overallScore = Math.round((documentationScore + structureScore) / 2);

  // Generate recommendations
  const recommendations: string[] = [];
  if (missingFiles.readme) recommendations.push('generateReadme');
  if (missingFiles.gitignore) recommendations.push('generateGitignore');
  if (missingFiles.license) recommendations.push('generateLicense');
  if (missingFiles.contributing) recommendations.push('generateContributing');

  return {
    success: true,
    scores: {
      overall: overallScore,
      documentation: documentationScore,
      structure: structureScore,
    },
    issues,
    recommendations,
    summary: `Repository health: ${overallScore}/100. Found ${issues.length} issues.`,
  };
}

export const analyzeStructureDescription = 'Analyze repository structure and provide health scores. Use after fetchRepo to evaluate the repository.';
