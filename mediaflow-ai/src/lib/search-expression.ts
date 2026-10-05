import type { DashboardFilters } from "@/types/media";

// Cloudinary's "pending" moderation status is what the dashboard calls "review".
const MODERATION_CONTEXT = { approved: "approved", rejected: "rejected", review: "pending" } as const;

/** Keeps letters, digits, underscore and hyphen so user input can never alter the expression syntax. */
export function sanitizeTerms(input: string): string[] {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}_-]/gu, "").replace(/^-+/, ""))
    .filter(Boolean)
    .slice(0, 5);
}

export function buildSearchExpression(filters: DashboardFilters, appTag: string): string {
  const clauses = [`tags=${appTag}`];
  if (filters.type !== "all") clauses.push(`resource_type=${filters.type}`);
  if (filters.moderation !== "all") {
    clauses.push(`context.moderation=${MODERATION_CONTEXT[filters.moderation]}`);
  }
  for (const term of sanitizeTerms(filters.search)) {
    clauses.push(`(tags:${term}* OR public_id:${term}* OR filename:${term}*)`);
  }
  return clauses.join(" AND ");
}