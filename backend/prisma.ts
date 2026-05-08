import {PrismaPg} from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";


const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString, ssl: {rejectUnauthorized: false} });
const prisma: InstanceType<typeof PrismaClient> = new PrismaClient({ adapter });
export { prisma };
