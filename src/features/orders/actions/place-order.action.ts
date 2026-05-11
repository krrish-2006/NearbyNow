"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function placeOrderAction() {
  const supabase = await createClient();

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
          shop_id,
          stock_quantity,
          is_active
        )
      `,
    )
    .eq("user_id", user.id);

  if (cartError || !cartItems || cartItems.length === 0) {
    return;
  }

  const hasUnavailableItem = cartItems.some((item) => {
    return (
      !item.products.is_active ||
      item.quantity > (item.products.stock_quantity ?? 0)
    );
  });

  if (hasUnavailableItem) {
    revalidatePath("/cart");

    return;
  }

  const totalAmount = cartItems.reduce((total, item) => {
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

  if (orderError || !order) {
    return;
  }

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.products.price,
  }));

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (orderItemsError) {
    return;
  }

  for (const item of cartItems) {
    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock_quantity: item.products.stock_quantity - item.quantity,
      })
      .eq("id", item.products.id)
      .eq("stock_quantity", item.products.stock_quantity);

    if (stockError) {
      return;
    }
  }

  await supabase.from("cart_items").delete().eq("user_id", user.id);

  revalidatePath("/cart");
  revalidatePath("/");
  revalidatePath("/products");

  for (const item of cartItems) {
    revalidatePath(`/products/${item.products.id}`);
  }

  redirect("/orders");
}
