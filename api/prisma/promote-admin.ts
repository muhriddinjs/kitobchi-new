import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL as string),
});

async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.error('Usage: ts-node prisma/promote-admin.ts <phone>');
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { phone },
    data: { role: 'ADMIN' },
  });
  console.log(`Promoted ${user.phone} (${user.name}) to ADMIN.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
