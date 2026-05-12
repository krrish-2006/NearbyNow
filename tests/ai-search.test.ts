import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  normalizeEmbedding,
  parseEmbeddingResponse,
  toPgVectorLiteral,
} from "../src/lib/ai/huggingface-embeddings.ts";
import {
  parseMarketplaceSearchQuery,
} from "../src/features/search/utils/marketplace-query.ts";
import {
  buildProductSearchText,
} from "../src/features/search/utils/product-search-text.ts";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260512143000_add_ai_product_search.sql",
  ),
  "utf8",
);

test("parses cheap multilingual price search intent", () => {
  assert.deepEqual(
    parseMarketplaceSearchQuery("bhai 5 kilo chawal sasta wala dikha"),
    {
      cleanedSearch: "bhai 5 kilo chawal sasta wala dikha",
      maxPrice: null,
      preferCheap: true,
    },
  );

  assert.deepEqual(parseMarketplaceSearchQuery("rice under 300"), {
    cleanedSearch: "rice under 300",
    maxPrice: 300,
    preferCheap: false,
  });
});

test("builds product text for embedding without leaking private data", () => {
  assert.equal(
    buildProductSearchText({
      title: "Rice 5kg",
      description: "Affordable grocery rice pack",
      price: 299,
    }),
    "Rice 5kg\nAffordable grocery rice pack\nprice 299\n₹299",
  );
});

test("normalizes and formats embeddings for pgvector", () => {
  assert.deepEqual(normalizeEmbedding([3, 4]), [0.6, 0.8]);
  assert.equal(toPgVectorLiteral([0.123456789, -1]), "[0.12345679,-1.00000000]");
});

test("parses token embedding responses by averaging token vectors", () => {
  assert.deepEqual(parseEmbeddingResponse([[1, 0], [0, 1]]), [
    0.7071067811865475,
    0.7071067811865475,
  ]);
});

test("ai search migration adds pgvector-backed marketplace search", () => {
  assert.match(migration, /create extension if not exists vector/i);
  assert.match(
    migration,
    /add column if not exists search_embedding extensions\.vector\(384\)/i,
  );
  assert.match(
    migration,
    /create or replace function public\.search_marketplace_products/i,
  );
  assert.match(migration, /products\.search_embedding <=> p_query_embedding::vector/i);
  assert.match(migration, /products\.is_active = true/i);
  assert.match(
    migration,
    /grant execute on function public\.search_marketplace_products/i,
  );
});
