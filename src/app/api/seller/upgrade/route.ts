import { NextResponse } from "next/server";
import { upgradeToSeller } from "@/features/seller/services/seller.service";

export async function POST() {
  try {
    await upgradeToSeller();

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    );
  }
}
