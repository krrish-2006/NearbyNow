const MIN_SEMANTIC_SIMILARITY = 0.82;
const MAX_SIMILARITY_DRIFT_FROM_BEST = 0.025;

export type SemanticSearchResult = {
  similarity: number | null;
};

export function filterRelevantSemanticResults<T extends SemanticSearchResult>(
  results: T[],
): T[] {
  const finiteScores = results
    .map((result) => result.similarity)
    .filter((score): score is number => Number.isFinite(score));

  if (finiteScores.length === 0) {
    return [];
  }

  const bestSimilarity = Math.max(...finiteScores);
  const cutoff = Math.max(
    MIN_SEMANTIC_SIMILARITY,
    bestSimilarity - MAX_SIMILARITY_DRIFT_FROM_BEST,
  );

  return results.filter(
    (result) =>
      typeof result.similarity === "number" && result.similarity >= cutoff,
  );
}
