import { CoreTool } from 'ai';
import { 
  fetchRepoParameters, 
  fetchRepoExecute, 
  fetchRepoDescription 
} from './tools/fetchRepo';
import { 
  analyzeStructureParameters, 
  analyzeStructureExecute, 
  analyzeStructureDescription 
} from './tools/analyzeStructure';
import { 
  generateReadmeParameters, 
  generateReadmeExecute, 
  generateReadmeDescription 
} from './tools/generateReadme';
import { 
  generateGitignoreParameters, 
  generateGitignoreExecute, 
  generateGitignoreDescription 
} from './tools/generateGitignore';
import { 
  generateLicenseParameters, 
  generateLicenseExecute, 
  generateLicenseDescription 
} from './tools/generateLicense';
import { 
  generateContributingParameters, 
  generateContributingExecute, 
  generateContributingDescription 
} from './tools/generateContributing';
import { 
  generateApiDocsParameters, 
  generateApiDocsExecute, 
  generateApiDocsDescription 
} from './tools/generateApiDocs';
import {
  createGithubIssuesParameters,
  createGithubIssuesExecute,
  createGithubIssuesDescription
} from './tools/createGithubIssues';
import {
  summarizeRepoParameters,
  summarizeRepoExecute,
  summarizeRepoDescription
} from './tools/summarizeRepo';

export const tools: Record<string, CoreTool> = {
  fetchRepo: {
    description: fetchRepoDescription,
    parameters: fetchRepoParameters,
    execute: fetchRepoExecute,
  },
  analyzeStructure: {
    description: analyzeStructureDescription,
    parameters: analyzeStructureParameters,
    execute: analyzeStructureExecute,
  },
  generateReadme: {
    description: generateReadmeDescription,
    parameters: generateReadmeParameters,
    execute: generateReadmeExecute,
  },
  generateGitignore: {
    description: generateGitignoreDescription,
    parameters: generateGitignoreParameters,
    execute: generateGitignoreExecute,
  },
  generateLicense: {
    description: generateLicenseDescription,
    parameters: generateLicenseParameters,
    execute: generateLicenseExecute,
  },
  generateContributing: {
    description: generateContributingDescription,
    parameters: generateContributingParameters,
    execute: generateContributingExecute,
  },
  generateApiDocs: {
    description: generateApiDocsDescription,
    parameters: generateApiDocsParameters,
    execute: generateApiDocsExecute,
  },
  createGithubIssues: {
    description: createGithubIssuesDescription,
    parameters: createGithubIssuesParameters,
    execute: createGithubIssuesExecute,
  },
  summarizeRepo: {
    description: summarizeRepoDescription,
    parameters: summarizeRepoParameters,
    execute: summarizeRepoExecute,
  },
};

export type ToolName = keyof typeof tools;
