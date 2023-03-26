import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const newLink = await prisma.link.create({
    data: {
      description: "Fullstack tutorial for GraphQL",
      url: "www.howtographql.com",
    }
  })
  const allLinks = await prisma.link.findMany()
  console.log(allLinks)
}

async function run() {
  try {
    main()
  } catch (e) {
    throw e
  } finally {
    await prisma.$disconnect();
  }
}

run()
