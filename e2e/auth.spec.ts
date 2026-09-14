import { test, expect } from "@playwright/test";
import { uniqueUser, registerAndLogin } from "./fixtures";

test.describe("register → login", () => {
  test("a new person can register, land on the dashboard logged in, log out, and log back in", async ({
    page,
  }) => {
    const user = await registerAndLogin(page);
    const firstName = user.name.split(" ")[0];
    await expect(page.getByText(firstName)).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText(firstName)).toBeVisible();
  });

  test("shows a generic error on wrong credentials, without confirming whether the email exists", async ({
    page,
  }) => {
    const ghost = uniqueUser();

    await page.goto("/login");
    await page.getByLabel("Email").fill(ghost.email);
    await page.getByLabel("Password").fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "Login failed. Please check your email and password and try again."
    );
  });
});
