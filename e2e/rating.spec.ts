import { test, expect } from "@playwright/test";
import { registerAndLogin, openMovieFromSearch } from "./fixtures";

test("submitting and removing a star rating on a movie's detail page", async ({ page }) => {
  await registerAndLogin(page);
  await openMovieFromSearch(page);

  await page.getByRole("radio", { name: "4 stars" }).click();
  await expect(page.getByRole("radio", { name: "4 stars" })).toHaveAttribute(
    "aria-checked",
    "true"
  );
  await expect(page.getByRole("button", { name: "Remove rating" })).toBeVisible();

  // Reloading confirms the rating actually persisted server-side, not just
  // in local component state.
  await page.reload();
  await expect(page.getByRole("radio", { name: "4 stars" })).toHaveAttribute(
    "aria-checked",
    "true"
  );

  await page.getByRole("button", { name: "Remove rating" }).click();
  await expect(page.getByRole("button", { name: "Remove rating" })).toHaveCount(0);
});
