import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Type definition for quiz data
 */
interface QuestionData {
  order: number;
  title: string;
  description: string;
  type: string;
  vulnerableCode?: string;
  codeLanguage?: string;
  choices?: string[];
  hint: string;
  explanation: string;
  correctCode?: string;
  correctChoice?: number;
  acceptableAnswers?: string[];
  points: number;
}

interface QuizData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  type: string;
  totalQuestions: number;
  estimatedTime: number;
  tags: string[];
  questions: QuestionData[];
}

/**
 * Sample quiz data for development and testing
 */
const SAMPLE_QUIZZES: QuizData[] = [
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
    ],
  },
  {
    title: 'Dependency Management Best Practices',
    description:
      'Learn how to safely manage dependencies in your CI/CD workflows.',
    category: 'best-practices',
    difficulty: 'intermediate',
    type: 'multiple-choice',
    totalQuestions: 2,
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
        correctChoice: 1,
        points: 10,
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
        correctChoice: 1,
        points: 10,
      },
    ],
  },
  {
    title: 'Workflow Security - Advanced',
    description: 'Advanced security concepts for GitHub Actions workflows.',
    category: 'security',
    difficulty: 'advanced',
    type: 'workflow-fix',
    totalQuestions: 1,
    estimatedTime: 15,
    tags: ['secrets', 'permissions', 'supply-chain'],
    questions: [
      {
        order: 1,
        title: 'Secure Third-Party Actions',
        description:
          'Secure this workflow that uses third-party actions without verification.',
        type: 'workflow-fix',
        vulnerableCode: `name: Deploy with Third Party
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions: write-all
    steps:
      - uses: actions/checkout@v3
      - uses: some-vendor/deploy-action@main
        with:
          api-key: \${{ secrets.API_KEY }}
          access-token: \${{ secrets.GITHUB_TOKEN }}`,
        codeLanguage: 'yaml',
        hint: 'Always pin to a specific commit hash for third-party actions. Use restricted permissions. Pass only necessary secrets.',
        explanation:
          'Using @main tag with third-party actions is dangerous - the action code can change at any time. Always pin to a specific commit hash. Additionally, restrict permissions and only pass the secrets that are absolutely necessary.',
        correctCode: `name: Deploy with Third Party
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v3
      - uses: some-vendor/deploy-action@a1b2c3d4e5f6
        with:
          api-key: \${{ secrets.API_KEY }}`,
        points: 15,
      },
    ],
  },
];

/**
 * Seed function to initialize quizzes in the database
 */
async function seedQuizzes() {
  console.log('🌱 Starting quiz seeding...');

  try {
    // Clear existing data (optional - comment out to preserve)
    console.log('🗑️  Clearing existing quiz data...');
    await prisma.userQuizAnswer.deleteMany({});
    await prisma.userQuizProgress.deleteMany({});
    await prisma.quizAnswer.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.quiz.deleteMany({});
    console.log('✓ Existing data cleared');

    // Create each quiz
    for (const quizData of SAMPLE_QUIZZES) {
      console.log(`\n📚 Creating quiz: "${quizData.title}"`);

      const quiz = await prisma.quiz.create({
        data: {
          title: quizData.title,
          description: quizData.description,
          category: quizData.category,
          difficulty: quizData.difficulty,
          type: quizData.type,
          totalQuestions: quizData.totalQuestions,
          estimatedTime: quizData.estimatedTime,
          tags: quizData.tags,
        },
      });

      console.log(`  ✓ Quiz created with ID: ${quiz.id}`);

      // Create questions for this quiz
      for (const questionData of quizData.questions) {
        const question = await prisma.quizQuestion.create({
          data: {
            quizId: quiz.id,
            order: questionData.order,
            title: questionData.title,
            description: questionData.description,
            type: questionData.type,
            vulnerableCode: questionData.vulnerableCode || null,
            codeLanguage: questionData.codeLanguage || null,
            choices: (questionData.choices || []) as any,
            hint: questionData.hint,
            explanation: questionData.explanation,
          },
        });

        console.log(
          `    ✓ Question ${questionData.order}: "${questionData.title}"`,
        );

        // Create answer for this question - type-safe property access
        let correctCode: string | null = null;
        let correctChoice: number | null = null;
        let acceptableAnswers: string[] = [];

        if (
          questionData.type === 'workflow-fix' &&
          'correctCode' in questionData
        ) {
          correctCode = (questionData as any).correctCode;
        } else if (
          questionData.type === 'multiple-choice' &&
          'correctChoice' in questionData
        ) {
          correctChoice = (questionData as any).correctChoice;
        } else if (
          questionData.type === 'short-answer' &&
          'acceptableAnswers' in questionData
        ) {
          acceptableAnswers = (questionData as any).acceptableAnswers || [];
        }

        const answer = await prisma.quizAnswer.create({
          data: {
            questionId: question.id,
            correctCode,
            correctChoice,
            acceptableAnswers: acceptableAnswers as any,
            points: questionData.points,
          },
        });

        console.log(
          `      ✓ Answer created with ${questionData.points} points`,
        );
      }
    }

    console.log(
      `\n✅ Successfully seeded ${SAMPLE_QUIZZES.length} quizzes with ${SAMPLE_QUIZZES.reduce((sum, q) => sum + q.questions.length, 0)} questions total!`,
    );
    console.log('\n📊 Summary:');
    console.log(`  - Security quizzes: 2`);
    console.log(`  - Best practices quizzes: 1`);
    console.log(`  - Beginner: 1, Intermediate: 1, Advanced: 1`);
  } catch (error) {
    console.error('❌ Error seeding quizzes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Run the seed function
 */
seedQuizzes()
  .then(() => {
    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
