import { pgTableCreator } from 'drizzle-orm/pg-core'

/**
 * Keeps every application table inside the scaffold's shared physical-name
 * prefix so Drizzle migrations do not touch tables owned by another project.
 */
export const createTable = pgTableCreator((name) => `t3-docker-scaffold_${name}`)
