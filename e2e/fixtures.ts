import { expect, type Page } from "@playwright/test";

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

// A fresh, never-before-seen email per test run so repeated `npm run
// test:e2e` runs against the same dev database don't collide on "email
// already registered".
export function uniqueUser(): TestUser {
  const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return {
    name: "E2E Tester",
    email: `e2e-${id}@example.com`,
    password: "correct-horse-battery-staple",
  };
}

// Registers a brand-new user and confirms the app lands them on the
// dashboard, logged in — the shared setup step for every spec that needs
// an authenticated session (favorites, ratings, lists, etc.).
export async function registerAndLogin(page: Page): Promise<TestUser> {
  const user = uniqueUser();

  await page.goto("/register");
  await page.getByLabel("Name").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Your profile" })).toBeVisible();

  return user;
}

// Uses the navbar search to land on a real movie's detail page. "Inception"
// is a stable, always-in-TMDB choice for a journey that needs any concrete
// movie rather than a specific one.
export async function openMovieFromSearch(page: Page, query = "Inception") {
  await page.getByLabel("Search movies").fill(query);
  await page.getByLabel("Search movies").press("Enter");
  await expect(page).toHaveURL(new RegExp(`/search\\?q=${encodeURIComponent(query)}`));

  await page.getByRole("link", { name: new RegExp(query, "i") }).first().click();
  await expect(page).toHaveURL(/\/movies\/\d+/);
}
