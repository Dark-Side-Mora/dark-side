// Example seed data for learning platform
// This demonstrates the structure for creating quizzes

export const SAMPLE_QUIZZES = [
  {
    title: 'GitHub Actions Security Basics',
    description:
      'Learn how to secure your GitHub Actions workflows by identifying and fixing common vulnerabilities.',
    category: 'security',
    difficulty: 'beginner',
    type: 'workflow-fix',
    totalQuestions: 2,
    estimatedTime: 10,
    tags: ['secrets', 'permissions', 'github-actions'],
    questions: [
      {
        order: 1,
        title: 'Fix the Hardcoded Secret',
        description:
          'This workflow has a hardcoded API key. Fix it by using GitHub Secrets.',
        type: 'workflow-fix',
        vulnerableCode: `name: Deploy
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        env:
          API_KEY: "sk-1234567890abcdef"
        run: |
          curl -H "Authorization: Bearer $API_KEY" https://api.example.com/deploy`,
        codeLanguage: 'yaml',
        hint: 'Use GitHub Secrets instead of hardcoded values. Access secrets with ${{ secrets.SECRET_NAME }}',
        explanation:
          'Hardcoded secrets in workflows are a security risk because they can be exposed in logs or repository history. Always use GitHub Secrets for sensitive values.',
        answer: {
          correctCode: `name: Deploy
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        env:
          API_KEY: \${{ secrets.API_KEY }}
        run: |
          curl -H "Authorization: Bearer $API_KEY" https://api.example.com/deploy`,
          points: 10,
        },
      },
      {
        order: 2,
        title: 'Restrict Workflow Permissions',
        description:
          'This workflow runs with excessive permissions. Restrict them appropriately.',
        type: 'workflow-fix',
        vulnerableCode: `name: Build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions: write-all
    steps:
      - uses: actions/checkout@v3
      - run: npm install && npm run build`,
        codeLanguage: 'yaml',
        hint: 'Use the principle of least privilege. Only grant the permissions that are absolutely necessary.',
        explanation:
          'Using write-all permissions is dangerous. You should explicitly grant only the permissions needed for your workflow to prevent potential supply chain attacks.',
        answer: {
          correctCode: `name: Build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v3
      - run: npm install && npm run build`,
          points: 10,
        },
      },
    ],
  },
  {
    title: 'Dependency Management Best Practices',
    description:
      'Learn how to safely manage dependencies in your CI/CD workflows.',
    category: 'best-practices',
    difficulty: 'intermediate',
    type: 'multiple-choice',
    totalQuestions: 3,
    estimatedTime: 15,
    tags: ['dependencies', 'supply-chain', 'security'],
    questions: [
      {
        order: 1,
        title: 'What is the best practice for managing action versions?',
        description:
          'Choose the most secure approach for using GitHub Actions.',
        type: 'multiple-choice',
        choices: [
          'Always use the @main tag for latest features',
          'Pin to a specific commit hash like @abc123def',
          'Use major version tags like @v2',
          'Use release tags like @v2.1.0',
        ],
        hint: 'Consider both security and maintainability.',
        explanation:
          'While @v2 is better than @main, pinning to a specific commit hash (@abc123def) provides the best security by preventing unexpected changes. Tags like @v2.1.0 are a good balance between security and maintainability.',
        answer: {
          correctChoice: 1, // Index 1: "Pin to a specific commit hash"
          points: 10,
        },
      },
      {
        order: 2,
        title: 'How should you verify npm packages?',
        description:
          "What's the best way to ensure npm packages are legitimate?",
        type: 'multiple-choice',
        choices: [
          'Check the download count',
          'Verify package checksums and use npm audit',
          'Only use popular packages',
          'Trust the package author',
        ],
        hint: 'Think about supply chain security.',
        explanation:
          'Using npm audit and verifying package checksums helps detect compromised or malicious packages. Download count and author trust are not reliable indicators of security.',
        answer: {
          correctChoice: 1, // Index 1
          points: 10,
        },
      },
    ],
  },
];

// Instructions for database seeding
// Use Prisma Studio or create a seed script like:
//
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
//
// async function main() {
//   for (const quizData of SAMPLE_QUIZZES) {
//     const quiz = await prisma.quiz.create({
//       data: {
//         title: quizData.title,
//         description: quizData.description,
//         category: quizData.category,
//         difficulty: quizData.difficulty,
//         type: quizData.type,
//         totalQuestions: quizData.totalQuestions,
//         estimatedTime: quizData.estimatedTime,
//         tags: quizData.tags,
//         questions: {
//           create: quizData.questions.map((q) => ({
//             order: q.order,
//             title: q.title,
//             description: q.description,
//             type: q.type,
//             vulnerableCode: q.vulnerableCode,
//             codeLanguage: q.codeLanguage,
//             choices: q.choices,
//             hint: q.hint,
//             explanation: q.explanation,
//             answers: {
//               create: {
//                 correctCode: q.answer.correctCode,
//                 correctChoice: q.answer.correctChoice,
//                 acceptableAnswers: q.answer.acceptableAnswers || [],
//                 points: q.answer.points,
//               },
//             },
//           })),
//         },
//       },
//     });
//   }
// }
