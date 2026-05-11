"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { placeDirectOrderAction } from "@/features/checkout/actions/place-direct-order-action";
import type { ActionResult } from "@/features/actions/action-result";

import Button from "@/components/ui/button";

interface BuyNowCheckoutFormProps {
  productId: string;
  quantity: number;
}

const initialState: ActionResult = {
  success: true,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full"
    >
      {pending ? "Placing Order..." : "Place Order"}
    </Button>
  );
}

export default function BuyNowCheckoutForm({
  productId,
  quantity,
}: BuyNowCheckoutFormProps) {
  const [state, formAction] = useActionState(
    placeDirectOrderAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="hidden"
        name="productId"
        value={productId}
      />

      <input
        type="hidden"
        name="quantity"
        value={quantity}
      />

      {!state.success && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
