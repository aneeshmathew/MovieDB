import { test, expect } from "@playwright/test";
import { registerAndLogin, openMovieFromSearch } from "./fixtures";

test("adding and removing a favorite from a movie's detail page", async ({ page }) => {
  await registerAndLogin(page);
  await openMovieFromSearch(page);

  await page.getByRole("button", { name: "Add to favorites" }).click();
  await expect(page.getByRole("button", { name: "Remove from favorites" })).toBeVisible();

  // Shows up under the Favorites tab on the profile page.
  await page.getByRole("link", { name: "Your profile" }).click();
  await page.getByRole("tab", { name: "Favorites" }).click();
  await expect(page.getByRole("link", { name: /Inception/i }).first()).toBeVisible();

  // Removing it again clears it from Favorites too.
  await page.goBack();
  await page.getByRole("button", { name: "Remove from favorites" }).click();
  await expect(page.getByRole("button", { name: "Add to favorites" })).toBeVisible();
});
