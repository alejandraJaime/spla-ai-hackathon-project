/**
 * The §8 pass and the taxonomy helpers are the deterministic heart of the
 * feature; they stay callable from a unit test with no server, no request and
 * no database. A transport or persistence import here is the first step to a
 * rule that can only be exercised end-to-end.
 *
 * This asserts the module's *dependencies*, not its file layout — which
 * spec.md's testing decisions leave free to change without touching a test.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const MODULE_DIRECTORY = path.join(process.cwd(), 'src', 'lib', 'translation', 'hierarchy')

const FORBIDDEN_IMPORTS = [
  ['tRPC', /trpc/i],
  ['Next.js', /^(next|server-only)($|\/)/],
  ['the database', /drizzle|postgres|server\/db|\.repository|\.schema$/],
] as const

const sourceFiles = readdirSync(MODULE_DIRECTORY).filter((file) => file.endsWith('.ts'))

/** Every module specifier a file imports from, `import` and `export … from` alike. */
function importedModules(source: string): string[] {
  return [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map(
    ([, specifier]) => specifier!,
  )
}

describe('the hierarchy module', () => {
  const imported = sourceFiles.flatMap((file) =>
    importedModules(readFileSync(path.join(MODULE_DIRECTORY, file), 'utf8')),
  )

  it('imports something, so an empty scan cannot pass as purity', () => {
    expect(imported.length).toBeGreaterThan(0)
  })

  it.each(FORBIDDEN_IMPORTS)('has no knowledge of %s', (_subject, pattern) => {
    expect(imported.filter((module) => pattern.test(module))).toEqual([])
  })

  it('reaches outside the translation module for nothing but zod', () => {
    const external = imported.filter((module) => !module.startsWith('.'))

    expect([...new Set(external)]).toEqual(['zod'])
  })
})
