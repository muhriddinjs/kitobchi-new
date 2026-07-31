import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL as string),
});

const CATEGORIES = [
  { nameUz: 'Badiiy adabiyot', nameRu: 'Художественная литература' },
  { nameUz: 'Ilmiy-ommabop', nameRu: 'Научно-популярная' },
  { nameUz: 'Darsliklar', nameRu: 'Учебники' },
  { nameUz: 'Bolalar kitoblari', nameRu: 'Детские книги' },
  { nameUz: 'Diniy adabiyot', nameRu: 'Религиозная литература' },
  { nameUz: 'Til oʻrganish', nameRu: 'Изучение языков' },
  { nameUz: 'Biznes va moliya', nameRu: 'Бизнес и финансы' },
];

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: category.nameUz },
      update: {},
      create: { id: category.nameUz, ...category },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
