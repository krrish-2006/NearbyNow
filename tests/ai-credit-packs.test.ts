import assert from "node:assert/strict";
import test from "node:test";

import {
  AI_CREDIT_PACKS,
  getAiCreditPack,
} from "../src/features/ai-credits/lib/credit-packs.ts";

test("ai credit packs are positive and sorted by credit quantity", () => {
  assert.ok(AI_CREDIT_PACKS.length >= 3);

  for (const pack of AI_CREDIT_PACKS) {
    assert.ok(pack.credits > 0);
    assert.ok(pack.amountPaise > 0);
  }

  assert.deepEqual(
    AI_CREDIT_PACKS.map((pack) => pack.credits),
    [...AI_CREDIT_PACKS.map((pack) => pack.credits)].sort((a, b) => a - b),
  );
});

test("finds only known ai credit packs", () => {
  assert.equal(getAiCreditPack("starter_5")?.credits, 5);
  assert.equal(getAiCreditPack("missing"), null);
});
