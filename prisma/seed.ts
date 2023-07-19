import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  await prisma.party.create({
    data: {
      endDate: new Date("2023-07-30T16:00:00"),
      host: {
        create: {
          firstName: "Atticus",
          lastName: "Howard",
          phone: "12025550171"
        }
      },
      location: {
        create: {
          address1: "195 Avenue A",
          city: "New York",
          crossStreets: "12th & Avenue A",
          instructions: "Buzz 1F",
          name: "Boris & Horton",
          state: "NY",
          zip: "10009"
        }
      },
      name: "Corgi Party",
      startDate: new Date("2023-07-30T12:00:00")
    }
  });
}

seed();
