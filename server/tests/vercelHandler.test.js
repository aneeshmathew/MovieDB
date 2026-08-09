import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// api/index.js requires ../src/config/db and ../src/app at module load
// time and caches the built app in its own module-scope variable. To
// control what those return per test (without a real Mongo/Apollo
// instance), we swap Node's require cache for those two dependencies
// before each fresh require of api/index.js — the same require-cache
// technique already used in tmdb-and-cache.test.js, since these are
// CommonJS modules that plain vi.doMock doesn't intercept.
const DB_PATH = require.resolve("../src/config/db");
const APP_PATH = require.resolve("../src/app");
const HANDLER_PATH = require.resolve("../api/index");

function stubModule(path, exportsValue) {
  require.cache[path] = { id: path, filename: path, loaded: true, exports: exportsValue };
}

function freshHandler({ connectDB, createApp }) {
  delete require.cache[HANDLER_PATH];
  stubModule(DB_PATH, connectDB);
  stubModule(APP_PATH, createApp);
  return require("../api/index");
}

describe("Vercel serverless handler (api/index.js)", () => {
  afterEach(() => {
    delete require.cache[HANDLER_PATH];
    delete require.cache[DB_PATH];
    delete require.cache[APP_PATH];
  });

  it("builds the app once and reuses it across multiple invocations (warm-lambda caching)", async () => {
    const connectDB = vi.fn().mockResolvedValue(undefined);
    const fakeApp = vi.fn((req, res) => res.end("ok"));
    const createApp = vi.fn().mockResolvedValue(fakeApp);

    const handler = freshHandler({ connectDB, createApp });

    const res1 = { end: vi.fn() };
    const res2 = { end: vi.fn() };
    await handler({}, res1);
    await handler({}, res2);

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(createApp).toHaveBeenCalledTimes(1);
    expect(fakeApp).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failed build — the next invocation retries from scratch", async () => {
    const connectDB = vi.fn().mockRejectedValueOnce(new Error("Mongo unreachable")).mockResolvedValue(undefined);
    const fakeApp = vi.fn((req, res) => res.end("ok"));
    const createApp = vi.fn().mockResolvedValue(fakeApp);

    const handler = freshHandler({ connectDB, createApp });

    const failingRes = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() };
    await handler({}, failingRes);
    expect(failingRes.statusCode).toBe(500);
    expect(failingRes.end).toHaveBeenCalledWith(expect.stringContaining("Internal server error"));

    const okRes = { end: vi.fn() };
    await handler({}, okRes);
    expect(okRes.end).toHaveBeenCalledWith("ok");
    expect(connectDB).toHaveBeenCalledTimes(2);
  });
});
