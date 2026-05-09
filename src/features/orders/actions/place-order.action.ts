"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function placeOrderAction() {
  const supabase: any = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select(
      `
        id,
        quantity,
        product_id,
        products (
          id,
          title,
          price,
          shop_id
        )
      `,
    )
    .eq("user_id", user.id);

  console.log("CART ITEMS:", cartItems);

  console.log("CART ERROR:", cartError);

  if (!cartItems || cartItems.length === 0) {
    return;
  }

  const totalAmount = cartItems.reduce((total: number, item: any) => {
    return total + Number(item.products.price) * item.quantity;
  }, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      payment_method: "COD",
    })
    .select()
    .single();

  console.log("ORDER:", order);

  console.log("ORDER ERROR:", orderError);

  if (!order) {
    return;
  }

  const orderItems = cartItems.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.products.price,
  }));

  console.log("ORDER ITEMS:", orderItems);

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  console.log("ORDER ITEMS ERROR:", orderItemsError);

  if (orderItemsError) {
    return;
  }

  await supabase.from("cart_items").delete().eq("user_id", user.id);

  revalidatePath("/cart");

  redirect("/orders");
}
