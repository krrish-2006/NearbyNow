import { createClient } from "@supabase/supabase-js";

const DEFAULT_EMBEDDING_MODEL = "intfloat/multilingual-e5-small";
const EXPECTED_EMBEDDING_DIMENSIONS = 384;

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function isNumberArray(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function averageVectors(vectors) {
  const dimensions = vectors[0]?.length;

  if (!dimensions) {
    return null;
  }

  const totals = Array.from({ length: dimensions }, () => 0);

  for (const vector of vectors) {
    vector.forEach((value, index) => {
      totals[index] += value;
    });
  }

  return totals.map((total) => total / vectors.length);
}

function normalizeEmbedding(embedding) {
  const magnitude = Math.sqrt(
    embedding.reduce((total, value) => total + value * value, 0),
  );

  return magnitude ? embedding.map((value) => value / magnitude) : null;
}

function parseEmbeddingResponse(value) {
  if (isNumberArray(value)) {
    return normalizeEmbedding(value);
  }

  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const first = value[0];

  if (isNumberArray(first)) {
    const vectors = value.filter(isNumberArray);

    return normalizeEmbedding(
      vectors.length === 1 ? vectors[0] : averageVectors(vectors) ?? [],
    );
  }

  if (Array.isArray(first)) {
    return parseEmbeddingResponse(first);
  }

  return null;
}

function toPgVectorLiteral(embedding) {
  return `[${embedding.map((value) => value.toFixed(8)).join(",")}]`;
}

function buildProductSearchText(product) {
  return [
    product.title,
    product.description,
    `price ${product.price}`,
    `₹${product.price}`,
  ]
    .filter((part) => Boolean(part?.trim()))
    .join("\n");
}

async function generateEmbedding(text) {
  const token = requiredEnv("HUGGINGFACE_API_KEY");
  const model = process.env.HUGGINGFACE_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `passage: ${text.slice(0, 4000)}`,
        options: {
          wait_for_model: true,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Hugging Face request failed: ${response.status}`);
  }

  const embedding = parseEmbeddingResponse(await response.json());

  if (embedding?.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
    throw new Error("Unexpected embedding dimensions");
  }

  return embedding;
}

const supabase = createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
);

const { data: products, error } = await supabase
  .from("products")
  .select("id,title,description,price")
  .order("created_at", { ascending: false });

if (error) {
  throw error;
}

let updatedCount = 0;

for (const product of products ?? []) {
  const embedding = await generateEmbedding(buildProductSearchText(product));

  const { error: updateError } = await supabase
    .from("products")
    .update({
      search_embedding: toPgVectorLiteral(embedding),
    })
    .eq("id", product.id);

  if (updateError) {
    throw updateError;
  }

  updatedCount += 1;
  console.log(`Updated ${updatedCount}: ${product.title}`);
}

console.log(`Backfilled ${updatedCount} product search embeddings.`);
