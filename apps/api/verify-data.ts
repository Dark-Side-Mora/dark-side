import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const modules = await prisma.courseModule.findMany({
    include: {
      quizzes: {
        include: {
          questions: true,
        },
      },
    },
  });

  console.log(`Found ${modules.length} modules.`);
  modules.forEach((m) => {
    console.log(`Module: ${m.title}`);
    m.quizzes.forEach((q) => {
      console.log(`  Quiz: ${q.name} (${q.questions.length} questions)`);
    });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
