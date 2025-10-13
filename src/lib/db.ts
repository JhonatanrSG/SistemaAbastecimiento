/**
 * PrismaClient como SINGLETON
 * - Evita múltiples conexiones en hot-reload de Next.js en dev.
 * Patrón aplicado: Singleton.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'], // agrega 'query' si necesitas depurar SQL
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
