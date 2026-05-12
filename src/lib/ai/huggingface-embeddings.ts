const DEFAULT_EMBEDDING_MODEL = "intfloat/multilingual-e5-small";
const EXPECTED_EMBEDDING_DIMENSIONS = 384;

export type EmbeddingMode = "query" | "passage";

function getHuggingFaceToken(): string | null {
  return (
    process.env.HUGGINGFACE_API_KEY ??
    process.env.HF_TOKEN ??
    null
  );
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function averageVectors(vectors: number[][]): number[] | null {
  if (vectors.length === 0) {
    return null;
  }

  const dimensions = vectors[0]?.length;

  if (!dimensions) {
    return null;
  }

  const totals = Array.from({ length: dimensions }, () => 0);
  let vectorCount = 0;

  for (const vector of vectors) {
    if (vector.length !== dimensions) {
      continue;
    }

    vector.forEach((value, index) => {
      totals[index] += value;
    });

    vectorCount += 1;
  }

  if (vectorCount === 0) {
    return null;
  }

  return totals.map((total) => total / vectorCount);
}

export function normalizeEmbedding(embedding: number[]): number[] | null {
  const magnitude = Math.sqrt(
    embedding.reduce((total, value) => total + value * value, 0),
  );

  if (!magnitude) {
    return null;
  }

  return embedding.map((value) => value / magnitude);
}

export function parseEmbeddingResponse(value: unknown): number[] | null {
  if (isNumberArray(value)) {
    return normalizeEmbedding(value);
  }

  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const first = value[0];

  if (isNumberArray(first)) {
    const vectors = value.filter(isNumberArray);

    if (vectors.length === 1) {
      return normalizeEmbedding(vectors[0]);
    }

    return normalizeEmbedding(averageVectors(vectors) ?? []);
  }

  if (Array.isArray(first)) {
    return parseEmbeddingResponse(first);
  }

  return null;
}

export function toPgVectorLiteral(embedding: number[]): string {
  return `[${embedding.map((value) => value.toFixed(8)).join(",")}]`;
}

export async function generateTextEmbedding(
  text: string,
  mode: EmbeddingMode,
): Promise<number[] | null> {
  const token = getHuggingFaceToken();
  const trimmedText = text.trim();

  if (!token || !trimmedText) {
    return null;
  }

  const model =
    process.env.HUGGINGFACE_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `${mode}: ${trimmedText.slice(0, 4000)}`,
        options: {
          wait_for_model: true,
        },
      }),
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const payload: unknown = await response.json();
  const embedding = parseEmbeddingResponse(payload);

  if (embedding?.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
    return null;
  }

  return embedding;
}
