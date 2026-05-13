"use server";

import type { ActionResult } from "@/features/actions/action-result";
import { createClient } from "@/lib/supabase/server";
import { getShopBySellerId } from "@/repositories/shop.repository";

type EnhancedProductImageResult = {
  imageDataUrl: string;
  fileName: string;
};

const DEFAULT_KNOCKOUT_API_BASE_URL = "https://useknockout--api.modal.run";
const MAX_ENHANCEMENT_IMAGE_BYTES = 10 * 1024 * 1024;

function getKnockoutToken(): string | null {
  return process.env.KNOCKOUT_API_TOKEN ?? null;
}

function getKnockoutApiBaseUrl(): string {
  return (
    process.env.KNOCKOUT_API_BASE_URL ?? DEFAULT_KNOCKOUT_API_BASE_URL
  ).replace(/\/$/, "");
}

function getEnhancementError(status: number): string {
  if (status === 401) {
    return "AI enhancement is not configured correctly.";
  }

  if (status === 402) {
    return "AI enhancement free credits are finished for now.";
  }

  if (status === 413) {
    return "This image is too large for AI enhancement.";
  }

  if (status === 422) {
    return "AI could not clearly detect the product in this image.";
  }

  if (status === 429) {
    return "AI enhancement is busy. Please try again in a minute.";
  }

  return "AI enhancement failed. Please try another image.";
}

function getCreditError(errorMessage: string | undefined): string {
  if (errorMessage?.includes("insufficient_ai_credits")) {
    return "You need AI image credits before enhancing more images.";
  }

  return "Could not reserve an AI image credit.";
}

function getImageFileName(fileName: string | null): string {
  const baseName = fileName?.replace(/\.[^/.]+$/, "") || "product";

  return `${baseName}-ai-enhanced.png`;
}

async function getImageFromUrl(imageUrl: string): Promise<Blob | null> {
  const response = await fetch(imageUrl, {
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.startsWith("image/")) {
    return null;
  }

  return response.blob();
}

export async function enhanceProductImageAction(
  formData: FormData,
): Promise<ActionResult<EnhancedProductImageResult>> {
  const token = getKnockoutToken();

  if (!token) {
    return {
      success: false,
      error: "AI enhancement is not configured yet.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const sellerShop = await getShopBySellerId(supabase, user.id);

  if (!sellerShop) {
    return {
      success: false,
      error: "Seller shop not found",
    };
  }

  const file = formData.get("image");
  const imageUrl = formData.get("imageUrl");
  const imageBlob =
    file instanceof File && file.size > 0
      ? file
      : typeof imageUrl === "string" && imageUrl.length > 0
        ? await getImageFromUrl(imageUrl)
        : null;

  if (!imageBlob) {
    return {
      success: false,
      error: "Choose an image to enhance first.",
    };
  }

  if (imageBlob.size > MAX_ENHANCEMENT_IMAGE_BYTES) {
    return {
      success: false,
      error: "This image is too large for AI enhancement.",
    };
  }

  const { data: jobId, error: reserveError } = await supabase.rpc(
    "reserve_ai_enhancement_credit",
    {
      p_shop_id: sellerShop.id,
    },
  );

  if (reserveError || !jobId) {
    return {
      success: false,
      error: getCreditError(reserveError?.message),
    };
  }

  const requestBody = new FormData();
  requestBody.append(
    "file",
    imageBlob,
    getImageFileName(file instanceof File ? file.name : null),
  );
  requestBody.append("format", "png");
  requestBody.append("matting", "closed-form");

  const response = await fetch(`${getKnockoutApiBaseUrl()}/remove`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: requestBody,
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) {
    await supabase.rpc("refund_ai_enhancement_credit", {
      p_job_id: jobId,
      p_error_message: response
        ? getEnhancementError(response.status)
        : "AI enhancement failed.",
    });

    return {
      success: false,
      error: response
        ? getEnhancementError(response.status)
        : "AI enhancement failed.",
    };
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const { error: completeError } = await supabase.rpc(
    "complete_ai_enhancement_job",
    {
      p_job_id: jobId,
    },
  );

  if (completeError) {
    await supabase.rpc("refund_ai_enhancement_credit", {
      p_job_id: jobId,
      p_error_message: "Could not complete AI enhancement job.",
    });

    return {
      success: false,
      error: "Could not complete AI enhancement job.",
    };
  }

  return {
    success: true,
    data: {
      imageDataUrl: `data:${contentType};base64,${imageBuffer.toString("base64")}`,
      fileName: getImageFileName(file instanceof File ? file.name : null),
    },
  };
}
