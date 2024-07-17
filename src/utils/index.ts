import { SortDirection } from "mongodb"
import { z } from "zod"

/**
 * Create a response object.
 */
export function res(message: string, error?: any) {
  return { message, error }
}

/**
 * Zod transform a filter query string to an array.
 */
export function transformFilterQuery(val: string | undefined) {
  if (!val) return
  return val.split(",")
}

/**
 * Zod refine function for filtering query.
 */
export function refineFilterQuery(val: string[] | undefined, allowedQueries: string[]) {
  return !val || val.every((query) => allowedQueries.includes(query))
}

/**
 * Zod transform a sort query string to a sort object.
 */
export function transformSortQuery(val: string | undefined) {
  if (!val) return
  return val.split(",").reduce<Record<string, SortDirection>>((acc, pair) => {
    const [key, value] = pair.split("_")
    acc[key] = value === "desc" ? -1 : 1
    return acc
  }, {})
}

/**
 * Zod refine function for sorting query.
 */
export function refineSortQuery(
  val: Record<string, SortDirection> | undefined,
  allowedQueries: string[]
) {
  return !val || Object.keys(val).every((key) => allowedQueries.includes(key))
}

/**
 * Create a query schema for filtering and sorting.
 * @param {string[]} allowedFilters Allowed filter queries.
 * @param {string[]} allowedSorts Allowed sort queries.
 * @param additionalProps Additional properties to include in the schema.
 * @returns A query schema.
 */
export function createQuerySchema(
  allowedFilters: string[],
  allowedSorts: string[],
  additionalProps = {}
) {
  return z
    .object({
      q: z.string().trim().optional(),
      filter: z
        .string()
        .optional()
        .transform(transformFilterQuery)
        .refine(
          (v) => refineFilterQuery(v, allowedFilters),
          `Allowed filter by: ${allowedFilters.join(", ")}.`
        ),
      sort: z
        .string()
        .optional()
        .transform(transformSortQuery)
        .refine(
          (v) => refineSortQuery(v, allowedSorts),
          `Allowed sort by: ${allowedSorts.join(", ")}.`
        ),
      ...additionalProps,
    })
    .refine((v) => (v.q && v.filter && v.filter.length > 0) || (!v.q && !v.filter), {
      message: "Query and filter must be provided together.",
      path: ["q", "filter"],
    })
}
