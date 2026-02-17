import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const SAMPLE_COURSE_MODULES = [
  {
    title: 'CI/CD Best Practices',
    status: 'Available',
    length: '15 mins',
    icon: '🎯',
    order: 1,
  },
  {
    title: 'Securing Your Pipeline',
    status: 'Paused',
    length: '25 mins',
    icon: '🛡️',
    order: 2,
  },
  {
    title: 'Optimizing Build Times',
    status: 'Coming Soon',
    length: '20 mins',
    icon: '⚡',
    order: 3,
  },
  {
    title: 'Monitoring & Observability',
    status: 'Coming Soon',
    length: '30 mins',
    icon: '📊',
    order: 4,
  },
];

const SAMPLE_QUIZZES = [
  // 2 quizzes per module, 4-5 questions per quiz
  // Module 1
  {
    name: 'CI/CD Fundamentals',
    description: 'Test your knowledge of basic CI/CD concepts.',
    difficulty: 'beginner',
    courseModuleOrder: 1,
    questions: [
      {
        type: 'multiple-choice',
        question: 'What does CI stand for?',
        choices: [
          'Continuous Integration',
          'Code Inspection',
          'Continuous Improvement',
          'Critical Infrastructure',
        ],
        correctIndex: 0,
        points: 10,
        hint: 'It is about integrating code changes frequently.',
      },
      {
        type: 'multiple-choice',
        question: 'Which tool is commonly used for CI/CD pipelines?',
        choices: ['Photoshop', 'Jenkins', 'Excel', 'Slack'],
        correctIndex: 1,
        points: 10,
        hint: 'It is an open-source automation server.',
      },
      {
        type: 'workflow-fix',
        question:
          'Select the best way to store secrets in a GitHub Actions workflow.',
        choices: [
          'Hardcode the secret in YAML',
          'Store in GitHub Secrets and reference with ${{ secrets.KEY }}',
          'Commit to a .env file in the repo',
          'Email the secret to the team',
        ],
        correctIndex: 1,
        points: 15,
        workflowCode: `name: Example Workflow{NEWLINE}on: [push]{NEWLINE}jobs:{NEWLINE}{TAB}build:{NEWLINE}{TAB}{TAB}runs-on: ubuntu-latest{NEWLINE}{TAB}{TAB}steps:{NEWLINE}{TAB}{TAB}{TAB}- name: Use secret{NEWLINE}{TAB}{TAB}{TAB}run: echo \${{ secrets.API_KEY }}`,
        hint: 'Never hardcode secrets.',
      },
      {
        type: 'multiple-choice',
        question: 'What is the main benefit of automated testing in CI/CD?',
        choices: [
          'Faster deployments',
          'Manual error checking',
          'Longer release cycles',
          'More paperwork',
        ],
        correctIndex: 0,
        points: 10,
        hint: 'Think about speed and reliability.',
      },
    ],
  },
  {
    name: 'CI/CD Advanced',
    description: 'Advanced questions on CI/CD best practices.',
    difficulty: 'intermediate',
    courseModuleOrder: 1,
    questions: [
      {
        type: 'multiple-choice',
        question: 'What is a pipeline stage?',
        choices: [
          'A step in a pipeline',
          'A type of test',
          'A deployment environment',
          'A code branch',
        ],
        correctIndex: 0,
        points: 10,
        hint: 'Pipelines are made of these.',
      },
      {
        type: 'workflow-fix',
        question: 'How should workflow permissions be set?',
        choices: [
          'Use write-all permissions',
          'Grant only the permissions needed for the job',
          'Use default permissions',
          'Grant admin permissions to all jobs',
        ],
        correctIndex: 1,
        points: 15,
        workflowCode: `name: Principle of Least Privilege{NEWLINE}on: [push]{NEWLINE}permissions:{NEWLINE}{TAB}contents: read{NEWLINE}jobs:{NEWLINE}{TAB}build:{NEWLINE}{TAB}{TAB}runs-on: ubuntu-latest{NEWLINE}{TAB}{TAB}steps:{NEWLINE}{TAB}{TAB}{TAB}- name: Checkout{NEWLINE}{TAB}{TAB}{TAB}uses: actions/checkout@v3`,
        hint: 'Principle of least privilege.',
      },
      {
        type: 'multiple-choice',
        question: 'Which of these is NOT a CI/CD tool?',
        choices: ['GitHub Actions', 'Travis CI', 'Docker', 'Jenkins'],
        correctIndex: 2,
        points: 10,
        hint: 'One is a container platform.',
      },
      {
        type: 'multiple-choice',
        question: 'What is the purpose of a build artifact?',
        choices: [
          'To store build outputs',
          'To run tests',
          'To write documentation',
          'To manage secrets',
        ],
        correctIndex: 0,
        points: 10,
        hint: 'Artifacts are outputs.',
      },
      {
        type: 'multiple-choice',
        question: 'What is the first step in a typical CI pipeline?',
        choices: [
          'Deploy to production',
          'Run tests',
          'Checkout code',
          'Send notifications',
        ],
        correctIndex: 2,
        points: 10,
        hint: 'You need the code first!',
      },
    ],
  },
  // Module 2
  {
    name: 'Pipeline Security',
    description: 'Security best practices for pipelines.',
    difficulty: 'intermediate',
    courseModuleOrder: 2,
    questions: [
      {
        type: 'multiple-choice',
        question: 'What is the risk of hardcoding secrets?',
        choices: [
          'No risk',
          'Secrets can be leaked',
          'Faster builds',
          'Better performance',
        ],
        correctIndex: 1,
        points: 10,
        hint: 'Think about exposure.',
      },
      {
        type: 'workflow-fix',
        question: 'How should you verify npm packages?',
        choices: [
          'Check the download count',
          'Verify package checksums and use npm audit',
          'Only use popular packages',
          'Trust the package author',
        ],
        correctIndex: 1,
        points: 15,
        workflowCode: `name: Verify NPM Packages{NEWLINE}on: [push]{NEWLINE}jobs:{NEWLINE}{TAB}audit:{NEWLINE}{TAB}{TAB}runs-on: ubuntu-latest{NEWLINE}{TAB}{TAB}steps:{NEWLINE}{TAB}{TAB}{TAB}- uses: actions/checkout@v3{NEWLINE}{TAB}{TAB}{TAB}- name: Install dependencies{NEWLINE}{TAB}{TAB}{TAB}{TAB}run: npm ci{NEWLINE}{TAB}{TAB}{TAB}- name: Audit packages{NEWLINE}{TAB}{TAB}{TAB}{TAB}run: npm audit --audit-level=high`,
        hint: 'Supply chain security.',
      },
      {
        type: 'multiple-choice',
        question: 'What is the best practice for managing action versions?',
        choices: [
          'Always use the @main tag',
          'Pin to a specific commit hash',
          'Use major version tags',
          'Use release tags',
        ],
        correctIndex: 1,
        points: 10,
        hint: 'Security and predictability.',
      },
      {
        type: 'multiple-choice',
        question: 'What is a common attack on CI/CD pipelines?',
        choices: ['SQL injection', 'Pipeline poisoning', 'Phishing', 'DDoS'],
        correctIndex: 1,
        points: 10,
        hint: 'Think about supply chain.',
      },
    ],
  },
  {
    name: 'Pipeline Monitoring',
    description: 'Monitoring and observability in CI/CD.',
    difficulty: 'advanced',
    courseModuleOrder: 2,
    questions: [
      {
        type: 'multiple-choice',
        question: 'What is observability?',
        choices: [
          'Ability to observe system state',
          'A type of test',
          'A deployment tool',
          'A code review process',
        ],
        correctIndex: 0,
        points: 10,
        hint: 'It is about visibility.',
      },
      {
        type: 'multiple-choice',
        question: 'Which tool is used for monitoring pipelines?',
        choices: ['Grafana', 'Jest', 'Webpack', 'Figma'],
        correctIndex: 0,
        points: 10,
        hint: 'It is a dashboard tool.',
      },
      {
        type: 'workflow-fix',
        question: 'How can you detect failed builds quickly?',
        choices: [
          'Manual log review',
          'Automated alerts',
          'Wait for user report',
          'Ignore failures',
        ],
        correctIndex: 1,
        points: 15,
        workflowCode: `name: Detect Failed Builds{NEWLINE}on: [push]{NEWLINE}jobs:{NEWLINE}{TAB}build:{NEWLINE}{TAB}{TAB}runs-on: ubuntu-latest{NEWLINE}{TAB}{TAB}steps:{NEWLINE}{TAB}{TAB}{TAB}- uses: actions/checkout@v3{NEWLINE}{TAB}{TAB}{TAB}- name: Build{NEWLINE}{TAB}{TAB}{TAB}{TAB}run: npm run build{NEWLINE}{TAB}{TAB}{TAB}- name: Notify on Failure{NEWLINE}{TAB}{TAB}{TAB}{TAB}if: failure(){NEWLINE}{TAB}{TAB}{TAB}{TAB}uses: some/alert-action@v1`,
        hint: 'Automation is key.',
      },
      {
        type: 'multiple-choice',
        question: 'What metric is most useful for pipeline health?',
        choices: [
          'Build duration',
          'Number of developers',
          'Code comments',
          'UI color',
        ],
        correctIndex: 0,
        points: 10,
        hint: 'Think about speed.',
      },
    ],
  },
  // Module 3
  {
    name: 'Caching Strategies',
    description: 'Learn how to use caching to speed up your builds.',
    difficulty: 'intermediate',
    courseModuleOrder: 3,
    questions: [
      {
        type: 'multiple-choice',
        question:
          'What is the most effective way to speed up dependency installation?',
        choices: [
          'Cache the node_modules directory',
          'Download dependencies every time',
          'Commit node_modules to git',
          'Use a slower network connection',
        ],
        correctIndex: 0,
        points: 10,
      },
      {
        type: 'multiple-choice',
        question: 'Which tool helps in caching build artifacts in monorepos?',
        choices: ['Turborepo', 'Webpack', 'Babel', 'ESLint'],
        correctIndex: 0,
        points: 10,
      },
    ],
  },
  // Module 4
  {
    name: 'Observability Basics',
    description: 'Understand the pillars of observability.',
    difficulty: 'beginner',
    courseModuleOrder: 4,
    questions: [
      {
        type: 'multiple-choice',
        question: 'Which of the following is NOT a pillar of observability?',
        choices: ['Logs', 'Metrics', 'Traces', 'Documentation'],
        correctIndex: 3,
        points: 10,
      },
      {
        type: 'multiple-choice',
        question: 'What does MTTR stand for?',
        choices: [
          'Mean Time To Recovery',
          'Maximum Time To Respond',
          'Minimum Time To React',
          'Mean Time To Retreat',
        ],
        correctIndex: 0,
        points: 10,
      },
    ],
  },
];

/**
 * Seed function to initialize quizzes in the database
 */

async function seedLearningData() {
  console.log('🌱 Starting learning data seeding...');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing quiz and module data...');
    await prisma.userQuizProgress.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.courseModule.deleteMany({});
    console.log('✓ Existing data cleared');

    // Seed course modules
    const moduleIdMap: Record<number, number> = {};
    for (const mod of SAMPLE_COURSE_MODULES) {
      const created = await prisma.courseModule.create({
        data: {
          title: mod.title,
          status: mod.status,
          length: mod.length,
          icon: mod.icon,
          order: mod.order,
        },
      });
      moduleIdMap[mod.order] = created.id;
      console.log(`✓ Course module seeded: ${mod.title}`);
    }

    // Seed quizzes and questions
    for (const quiz of SAMPLE_QUIZZES) {
      const createdQuiz = await prisma.quiz.create({
        data: {
          name: quiz.name,
          description: quiz.description,
          difficulty: quiz.difficulty,
          courseModuleId: moduleIdMap[quiz.courseModuleOrder],
        },
      });
      console.log(`  ✓ Quiz seeded: ${quiz.name}`);
      for (const q of quiz.questions) {
        await prisma.quizQuestion.create({
          data: {
            quizId: createdQuiz.id,
            type: q.type,
            question: q.question,
            choices: q.choices,
            correctIndex: q.correctIndex,
            points: q.points,
            workflowCode: q.workflowCode || null,
            hint: q.hint || null,
          },
        });
        console.log(`    ✓ Question: ${q.question}`);
      }
    }

    console.log(`{NEWLINE}✅ Successfully seeded quizzes and questions!`);
  } catch (error) {
    console.error('❌ Error seeding learning data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Run the seed function
 */
seedLearningData()
  .then(() => {
    console.log('{NEWLINE}🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
