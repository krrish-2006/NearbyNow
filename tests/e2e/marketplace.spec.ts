import {
  expect,
  test,
} from "@playwright/test";

test("public marketplace shell renders", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("404 (Not Found)")
    ) {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "NearbyNow",
    }),
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Search nearby products..."),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Cart" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("buyer protected pages redirect anonymous visitors to login", async ({
  page,
}) => {
  await page.goto("/orders");

  await expect(page).toHaveURL(/\/login$/);
});

test("seller portal redirects anonymous visitors to login", async ({ page }) => {
  await page.goto("/seller/orders");

  await expect(page).toHaveURL(/\/login$/);
});
