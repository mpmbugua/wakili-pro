import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPendingArticles() {
  const all = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      User: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  const pending = await prisma.article.findMany({
    where: { isPublished: false }
  });

  console.log('All Articles:');
  console.log(JSON.stringify(all, null, 2));
  console.log(`\nPending count: ${pending.length}`);
  
  await prisma.$disconnect();
}

checkPendingArticles();
