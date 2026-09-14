import { test, expect } from "@playwright/test";

test.describe("search", () => {
  test("searching for a well-known movie shows matching results", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search movies").fill("Inception");
    await page.getByLabel("Search movies").press("Enter");

    await expect(page).toHaveURL(/\/search\?q=Inception/);
    await expect(page.getByRole("heading", { name: /Search results for "Inception"/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Inception/i }).first()).toBeVisible();
  });

  test("a nonsense query shows the empty state instead of an error", async ({ page }) => {
    const gibberish = "zzxxqqvvnonexistentmovietitle123456";
    await page.goto(`/search?q=${gibberish}`);

    await expect(page.getByText(`No movies found for "${gibberish}".`)).toBeVisible();
  });

  test("visiting /search with no query prompts for one instead of erroring", async ({ page }) => {
    await page.goto("/search");

    await expect(
      page.getByText("Type something into the search bar above to look for a movie.")
    ).toBeVisible();
  });
});
