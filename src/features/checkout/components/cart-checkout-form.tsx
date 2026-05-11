"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import Button from "@/components/ui/button";
import type { ActionResult } from "@/features/actions/action-result";
import { placeOrderAction } from "@/features/orders/actions/place-order.action";

const initialState: ActionResult = {
  success: true,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="mt-8 w-full py-4 text-lg">
      {pending ? "Placing Order..." : "Place COD Order"}
    </Button>
  );
}

export default function CartCheckoutForm() {
  const [state, formAction] = useActionState(placeOrderAction, initialState);

  return (
    <form action={formAction}>
      {!state.success && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
