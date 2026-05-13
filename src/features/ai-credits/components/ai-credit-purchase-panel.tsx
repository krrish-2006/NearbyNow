"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AI_CREDIT_PACKS,
  formatPaiseAsRupees,
} from "@/features/ai-credits/lib/credit-packs";

type RazorpayOrderResponse = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  credits: number;
  name: string;
  description: string;
  sellerName: string;
  sellerEmail: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: () => void;
};

type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);

      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function AiCreditPurchasePanel({
  balance,
}: {
  balance: number;
}) {
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);

  async function buyPack(packId: string) {
    setPendingPackId(packId);

    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded || !window.Razorpay) {
      toast.error("Could not load Razorpay checkout");
      setPendingPackId(null);

      return;
    }

    const response = await fetch("/api/ai-credits/razorpay-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        packId,
      }),
    });
    const order = (await response.json()) as
      | RazorpayOrderResponse
      | {
          error?: string;
        };

    if (!response.ok || !("orderId" in order)) {
      toast.error(
        "error" in order && order.error
          ? order.error
          : "Could not start payment",
      );
      setPendingPackId(null);

      return;
    }

    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      name: order.name,
      description: order.description,
      order_id: order.orderId,
      prefill: {
        name: order.sellerName,
        email: order.sellerEmail,
      },
      theme: {
        color: "#000000",
      },
      handler: () => {
        toast.success("Payment received. Credits will update shortly.");
        setPendingPackId(null);
        window.location.reload();
      },
    });

    checkout.open();
  }

  return (
    <div className="rounded-2xl border bg-neutral-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold">AI Image Credits</h3>
          <p className="text-sm text-neutral-600">
            1 credit = 1 AI image enhancement
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold">
          Balance: {balance}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {AI_CREDIT_PACKS.map((pack) => (
          <button
            key={pack.id}
            type="button"
            disabled={pendingPackId !== null}
            onClick={() => buyPack(pack.id)}
            className="rounded-xl border bg-white p-4 text-left transition hover:border-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="block text-sm font-semibold">{pack.label}</span>
            <span className="mt-1 block text-2xl font-black">
              {formatPaiseAsRupees(pack.amountPaise)}
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              {pendingPackId === pack.id ? "Opening checkout..." : "Buy credits"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
