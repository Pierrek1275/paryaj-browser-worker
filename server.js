import express from "express";
import { chromium } from "playwright";

const app = express();

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const WORKER_TOKEN = process.env.WORKER_TOKEN;

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "paryaj-browser-worker"
  });
});

app.post("/render", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";

    if (!WORKER_TOKEN || auth !== `Bearer ${WORKER_TOKEN}`) {
      return res.status(401).json({
        error: "UNAUTHORIZED"
      });
    }

    const { url } = req.body || {};

    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({
        error: "INVALID_URL"
      });
    }

    const browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(8000);

    const html = await page.content();

    await browser.close();

    return res.json({
      html
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "RENDER_FAILED",
      message: error?.message || "Unknown error"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Browser worker listening on port ${PORT}`);
});
