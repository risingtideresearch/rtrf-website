#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import {
  homepageDefaults,
  homepageShots,
  storyDefaults,
  storyOverrides,
} from "./stills.config.mjs";

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(FRONTEND, "public");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const explicitBase = option("base", null);
const only = option("only", null);
const readyTimeout = Number(option("timeout", 180000));
const dryRun = flag("dry-run");
const headed = flag("headed");
const skipBuild = flag("skip-build");
const wantHomepage = !flag("stories-only");
const wantStories = !flag("homepage-only");

const log = (...m) => console.log(...m);

const since = (t) => {
  const s = (Date.now() - t) / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s`;
};

let base = null;

// Other dev servers may be occupying the usual ports, so identify this app by
// a file only it serves rather than trusting any 200.
async function isThisApp(candidate) {
  try {
    const res = await fetch(`${candidate}/models/export_manifest.json`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    return Boolean((await res.json()).export_info);
  } catch {
    return false;
  }
}

async function findFreePort(from = 3100, to = 3199) {
  for (let port = from; port <= to; port++) {
    const free = await new Promise((resolve) => {
      const probe = net.createServer();
      probe.once("error", () => resolve(false));
      probe.once("listening", () => probe.close(() => resolve(true)));
      probe.listen(port, "127.0.0.1");
    });
    if (free) return port;
  }
  throw new Error(`no free port in ${from}-${to}`);
}

function runToCompletion(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: FRONTEND,
      stdio: ["ignore", "pipe", "inherit"],
    });
    let tail = "";
    proc.stdout.on("data", (d) => {
      tail = (tail + d).slice(-4000);
    });
    proc.on("error", reject);
    proc.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`\`${command} ${args.join(" ")}\` exited ${code}\n${tail}`)),
    );
  });
}

async function serveOn(port, npmArgs, label) {
  const proc = spawn("npm", npmArgs, {
    cwd: FRONTEND,
    stdio: ["ignore", "pipe", "pipe"],
  });
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", (d) => process.stderr.write(d));

  const candidate = `http://localhost:${port}`;
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new Error(`${label} exited`);
    if (await isThisApp(candidate)) {
      base = candidate;
      log(`${label} ready at ${base}`);
      return proc;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  proc.kill();
  throw new Error(`${label} did not come up within 120s`);
}

/**
 * Stills always come from a production build — `next dev` renders these pages
 * several times slower and does not reliably survive a full run.
 */
async function startServer() {
  const port = await findFreePort();
  const hasBuild = existsSync(path.join(FRONTEND, ".next", "BUILD_ID"));
  if (skipBuild && !hasBuild) {
    log("--skip-build given but no build found — building anyway");
  }
  if (!skipBuild || !hasBuild) {
    log("building for production (npm run build)");
    const built = Date.now();
    await runToCompletion("npm", ["run", "build"]);
    log(`  built in ${since(built)}`);
  } else {
    log("reusing the existing build (--skip-build)");
  }
  log(`starting \`next start\` on ${port}`);
  return serveOn(port, ["run", "start", "--", "-p", String(port)], "server");
}

const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

async function discoverStories() {
  const res = await fetch(`${base}/stories`);
  if (!res.ok) throw new Error(`GET /stories -> ${res.status}`);
  const html = await res.text();

  const titles = new Map();
  const linked = /href="\/stories\/([A-Za-z0-9._-]+)"[^>]*>\s*<p>\s*<span>([^<]*)<\/span>/g;
  for (const m of html.matchAll(linked)) {
    if (!titles.has(m[1])) titles.set(m[1], decodeEntities(m[2]).trim());
  }
  for (const m of html.matchAll(/href="\/stories\/([A-Za-z0-9._-]+)"/g)) {
    if (!titles.has(m[1])) titles.set(m[1], null);
  }

  return [...titles.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, title]) => ({ slug: decodeURIComponent(slug), title }));
}

function shotUrl(shot) {
  const params = new URLSearchParams({
    capture: "1",
    w: String(shot.width),
    h: String(shot.height),
    dpr: String(shot.dpr),
  });
  if (shot.zoom && shot.zoom !== 1) params.set("zoom", String(shot.zoom));
  if (shot.cam) params.set("cam", shot.cam.join(","));
  if (shot.clip) {
    params.set("clip", shot.clip.join(","));
    params.set("axis", shot.axis ?? "x");
  }
  if (shot.search) params.set("search", shot.search);
  if (shot.minimal) params.set("minimal", "1");
  if (shot.transparent != null) {
    params.set("transparent", shot.transparent ? "1" : "0");
  }
  return `${base}/anatomy/${shot.slug}?${params}`;
}

function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function captureModel(page, shot) {
  const loading = Date.now();
  await page.goto(shotUrl(shot), { waitUntil: "domcontentloaded" });

  const heartbeat = setInterval(
    () => log(`      still loading models (${since(loading)})`),
    15000,
  );
  try {
    await page.waitForFunction(() => window.__anatomyReady === true, null, {
      timeout: readyTimeout,
    });
  } finally {
    clearInterval(heartbeat);
  }
  log(`      models loaded in ${since(loading)}, waiting for a stable frame`);

  const grab = () => page.evaluate(() => window.__anatomyCapture?.() ?? null);

  let previous = await grab();
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.waitForTimeout(350);
    const next = await grab();
    if (!next) throw new Error("capture hook returned nothing");
    if (next === previous) return next;
    previous = next;
  }
  log("    warning: render never stabilized, using last frame");
  return previous;
}

/** Resize and/or offset the render; shifts are fractions of the output size. */
function redraw(page, modelDataUrl, { width, height, shiftX = 0, shiftY = 0 }) {
  return page.evaluate(
    async ({ modelDataUrl, width, height, shiftX, shiftY }) => {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = modelDataUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, shiftX * width, shiftY * height, width, height);
      return canvas.toDataURL("image/png");
    },
    { modelDataUrl, width, height, shiftX, shiftY },
  );
}

async function composite(page, modelDataUrl, shot, frame) {
  await page.setViewportSize({
    width: Math.round(shot.width / shot.dpr) + 40,
    height: Math.round(shot.height / shot.dpr) + 40,
  });

  await page.evaluate(
    async ({ modelDataUrl, width, height, dpr, frame }) => {
      document.body.innerHTML = "";
      document.body.style.margin = "0";

      const stage = document.createElement("div");
      stage.id = "still";
      stage.className = "bg--grid";
      Object.assign(stage.style, {
        position: "relative",
        overflow: "hidden",
        width: `${width}px`,
        height: `${height}px`,
      });

      const pad = frame.padding * height;
      const modelBox = document.createElement("div");
      Object.assign(modelBox.style, {
        position: "absolute",
        top: `${pad + (frame.topSpace ?? 0) * height}px`,
        left: `${pad}px`,
        right: `${pad}px`,
        bottom: `${pad + (frame.bottomSpace ?? 0) * height}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${(frame.modelShiftX ?? 0) * width}px, ${(frame.modelShiftY ?? 0) * height}px)`,
      });

      const model = document.createElement("img");
      model.src = modelDataUrl;
      Object.assign(model.style, {
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
      });
      modelBox.appendChild(model);
      stage.appendChild(modelBox);

      document.body.appendChild(stage);

      const grid = frame.grid;
      const margin = grid * frame.marginCells;
      const markWidth = grid * frame.logoCells;

      /**
       * A wrapper sized to the artwork's ink rather than its viewBox: both SVGs
       * carry transparent padding, so only the ink box can be snapped to the
       * grid or given a background that hugs the mark.
       */
      const inkBox = async (src, widthPx) => {
        const holder = document.createElement("div");
        holder.style.cssText = "position:absolute;visibility:hidden";
        holder.innerHTML = await (await fetch(src)).text();
        document.body.appendChild(holder);

        const svg = holder.querySelector("svg");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        const view = svg.viewBox.baseVal;
        const ink = svg.getBBox();
        holder.remove();

        const scale = widthPx / ink.width;
        const box = document.createElement("div");
        Object.assign(box.style, {
          position: "relative",
          // sub-pixel rounding on the ink height was shaving the logo's
          // bottom rule, so let the mark draw past its box
          overflow: "visible",
          width: `${widthPx}px`,
          height: `${Math.ceil(ink.height * scale)}px`,
        });
        Object.assign(svg.style, {
          position: "absolute",
          width: `${view.width * scale}px`,
          height: `${view.height * scale}px`,
          left: `${-(ink.x - view.x) * scale}px`,
          top: `${-(ink.y - view.y) * scale}px`,
        });
        box.appendChild(svg);
        return box;
      };

      if (frame.showArticleTitle && frame.articleTitle) {
        const heading = document.createElement("div");
        heading.textContent = frame.articleTitle;
        Object.assign(heading.style, {
          position: "absolute",
          left: `${margin}px`,
          top: `${margin}px`,
          width: `${grid * frame.articleTitleCells}px`,
          fontSize: `${grid * frame.articleTitleSize}px`,
          // whole cells so wrapped titles keep the grid's rhythm
          lineHeight: `${grid * frame.articleTitleLeading}px`,
          color: "var(--black)",
        });
        stage.appendChild(heading);
      }

      // on white so the grid does not run through the marks
      const stack = document.createElement("div");
      Object.assign(stack.style, {
        position: "absolute",
        [frame.markSide ?? "left"]: `${margin}px`,
        // nudge is in output pixels, so it reads the same as the finished image
        bottom: `${margin - (frame.logoNudgeY ?? 0) / dpr}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${grid * frame.gapCells}px`,
        background: "#ffffff",
      });
      if (frame.wordmark) {
        stack.appendChild(await inkBox(frame.wordmark, markWidth));
      }
      stack.appendChild(await inkBox(frame.logo, markWidth));
      stage.appendChild(stack);
    },
    {
      modelDataUrl,
      width: Math.round(shot.width / shot.dpr),
      height: Math.round(shot.height / shot.dpr),
      dpr: shot.dpr,
      frame,
    },
  );

  await page.waitForFunction(() =>
    [...document.querySelectorAll("#still img")].every(
      (img) => img.complete && img.naturalWidth > 0,
    ),
  );

  return page.locator("#still").screenshot({ type: "png", omitBackground: false });
}

/**
 * Content hash of a generated file, or null if it has not been captured yet.
 * Without it the filenames never change, so Next's image optimiser keeps
 * serving cached bytes and social scrapers keep serving cached unfurls.
 */
async function version(file) {
  try {
    return createHash("sha1")
      .update(await readFile(file))
      .digest("hex")
      .slice(0, 8);
  } catch {
    return null;
  }
}

async function writeStoryManifest(slugs) {
  const stories = {};

  for (const slug of slugs) {
    const entry = {};
    for (const output of storyDefaults.outputs) {
      const file = path.join(PUBLIC, output.dir, `${slug}.png`);
      const v = await version(file);
      entry[output.dir] = {
        src: `/${output.dir}/${slug}.png${v ? `?v=${v}` : ""}`,
        width: Math.round(storyDefaults.width * (output.scale ?? 1)),
        height: Math.round(storyDefaults.height * (output.scale ?? 1)),
      };
    }
    stories[slug] = entry;
  }

  const manifestPath = path.join(PUBLIC, "stories-stills.json");
  await writeFile(manifestPath, `${JSON.stringify({ stories }, null, 2)}\n`);
  log(`wrote ${path.relative(FRONTEND, manifestPath)}`);
}

/**
 * Lists every configured tile, not just the ones this run rendered.
 */
async function writeHomepageManifest() {
  const [output] = homepageDefaults.outputs;
  const dir = path.join(PUBLIC, output.dir);

  const tiles = await Promise.all(
    homepageShots.map(async (shot) => {
      const file = `${output.prefix ?? ""}${shot.name}.png`;
      const v = await version(path.join(dir, file));
      if (!v) log(`  manifest: ${file} missing, leaving it unversioned`);
      return {
        name: shot.name,
        src: `/${output.dir}/${file}${v ? `?v=${v}` : ""}`,
        width: homepageDefaults.width,
        height: homepageDefaults.height,
        alt: `Solander 38 3D model, ${shot.alt ?? shot.name}`,
      };
    }),
  );

  const manifestPath = path.join(dir, "manifest.json");
  await mkdir(dir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({ tiles }, null, 2)}\n`);
  log(`wrote ${path.relative(FRONTEND, manifestPath)}`);
}

async function run() {
  const shots = [];

  if (wantHomepage) {
    for (const shot of homepageShots) {
      shots.push({ ...homepageDefaults, ...shot });
    }
  }

  const storySlugs = [];
  if (wantStories) {
    for (const { slug, title } of await discoverStories()) {
      storySlugs.push(slug);
      shots.push({
        ...storyDefaults,
        name: slug,
        slug,
        articleTitle: title,
        ...(storyOverrides[slug] ?? {}),
      });
    }
  }

  for (const shot of shots) {
    shot.outputs = shot.outputs.map((output) => ({
      ...output,
      scale: output.scale ?? 1,
      width: Math.round(shot.width * (output.scale ?? 1)),
      height: Math.round(shot.height * (output.scale ?? 1)),
      path: path.join(
        PUBLIC,
        output.dir,
        `${output.prefix ?? ""}${shot.name}.png`,
      ),
    }));
  }

  const selected = only
    ? shots.filter((s) => s.name.includes(only) || s.slug?.includes(only))
    : shots;

  if (!selected.length) {
    log("no shots matched");
    return;
  }

  const startedAt = Date.now();
  log(`${selected.length} shot(s)${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    for (const shot of selected) {
      log(`  ${shotUrl(shot)}`);
      for (const output of shot.outputs) {
        log(
          `      -> ${path.relative(FRONTEND, output.path)}  ${output.width}x${output.height}${output.frame ? " framed" : ""}`,
        );
      }
    }
    return;
  }

  const browser = await chromium.launch({
    headless: !headed,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });

  const failures = [];
  try {
    const context = await browser.newContext({ deviceScaleFactor: 1 });

    // A fresh page per shot: three.js does not release its WebGL context on
    // navigation, and the browser starts dropping contexts after ~16 shots.
    const withModelPage = async (shot, fn) => {
      const page = await context.newPage();
      await page.setViewportSize({
        width: Math.round(shot.width / shot.dpr),
        height: Math.round(shot.height / shot.dpr),
      });
      try {
        return await fn(page);
      } finally {
        await page.close();
      }
    };

    // Composites are screenshotted, so the context carries the scale factor.
    // Kept open and reused: each page loads the site once for its grid styling.
    const framerPages = new Map();
    const framerPage = async (dpr) => {
      if (!framerPages.has(dpr)) {
        const context = await browser.newContext({ deviceScaleFactor: dpr });
        const page = await context.newPage();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(base, { waitUntil: "load" });
        framerPages.set(dpr, page);
      }
      return framerPages.get(dpr);
    };

    let done = 0;
    for (const shot of selected) {
      const shotStarted = Date.now();
      log(`  [${++done}/${selected.length}] ${shot.name}`);
      try {
        let modelDataUrl;
        try {
          modelDataUrl = await withModelPage(shot, (p) => captureModel(p, shot));
        } catch (err) {
          log(`    retrying after: ${err.message.split("\n")[0]}`);
          modelDataUrl = await withModelPage(shot, (p) => captureModel(p, shot));
        }

        for (const output of shot.outputs) {
          const buffer = output.frame
            ? await composite(await framerPage(shot.dpr), modelDataUrl, shot, {
                ...output.frame,
                articleTitle: shot.articleTitle ?? null,
              })
            : Buffer.from(
                (output.scale !== 1 || output.shiftX || output.shiftY
                  ? await redraw(
                      await framerPage(shot.dpr),
                      modelDataUrl,
                      output,
                    )
                  : modelDataUrl
                ).split(",")[1],
                "base64",
              );

          const { width, height } = pngSize(buffer);
          if (width !== output.width || height !== output.height) {
            log(
              `    warning: got ${width}x${height}, expected ${output.width}x${output.height}`,
            );
          }

          await mkdir(path.dirname(output.path), { recursive: true });
          await writeFile(output.path, buffer);
          log(
            `    wrote ${path.relative(FRONTEND, output.path)}  ${width}x${height}, ${(buffer.length / 1024).toFixed(0)} KB`,
          );
        }
        log(`    done in ${since(shotStarted)}`);
      } catch (err) {
        log(`    FAILED: ${err.message}`);
        failures.push(shot.name);
      }
    }
  } finally {
    await browser.close();
  }

  if (wantHomepage) await writeHomepageManifest();
  if (wantStories) await writeStoryManifest(storySlugs);

  if (failures.length) {
    log(
      `\n${selected.length - failures.length}/${selected.length} written in ${since(startedAt)} — ${failures.length} failed: ${failures.join(", ")}`,
    );
    process.exitCode = 1;
  } else {
    log(`\nall ${selected.length} shots written in ${since(startedAt)}`);
  }
}

let server = null;
try {
  if (explicitBase) {
    base = explicitBase.replace(/\/$/, "");
    if (!(await isThisApp(base))) {
      throw new Error(`${base} is not serving this app`);
    }
  }
  if (!base) server = await startServer();
  log(`using ${base}`);
  await run();
} finally {
  server?.kill("SIGTERM");
}
