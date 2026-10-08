import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { beginSurfaceReveal, sampleSurfaceReveal } from "../src/components/atlas/surface-reveal.ts";

test("surface reveal is bounded, monotone, and finishes at the requested endpoint", () => {
  const reveal = beginSurfaceReveal(0, 1, 100);
  assert.equal(sampleSurfaceReveal(reveal, 50).value, 0);
  let previous = 0;
  for(let now = 100; now <= 900; now += 10) {
    const {value} = sampleSurfaceReveal(reveal, now);
    assert.ok(value >= previous && value <= 1);
    previous = value;
  }
  assert.deepEqual(sampleSurfaceReveal(reveal, 1000), {value:1,done:true});
});

test("reversing a surface reveal starts at its current visible value", () => {
  const forward = beginSurfaceReveal(0, 1, 0);
  const current = sampleSurfaceReveal(forward, 260).value;
  const reversed = beginSurfaceReveal(current, 0, 260);
  assert.equal(sampleSurfaceReveal(reversed, 260).value, current);
  assert.ok(sampleSurfaceReveal(reversed, 300).value < current);
  assert.deepEqual(sampleSurfaceReveal(reversed, 1000), {value:0,done:true});
});

test("the published homepage enables the refinements without a comparison shell", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const controller = await readFile(new URL("../src/components/atlas/controller.ts", import.meta.url), "utf8");
  const world = await readFile(new URL("../src/components/atlas/world.ts", import.meta.url), "utf8");
  assert.doesNotMatch(html, /data-finish-study|data-finish-reference|data-detail-prototype/);
  assert.match(controller, /dataset\.manuscriptDepth = "layered"/);
  assert.doesNotMatch(controller + world, /finishOptions|materialFinish|revealFinish/);
});

test("depth treatment retains the original formula count and supplies all three depth bands", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.equal((html.match(/data-ms-depth="/g) ?? []).length, 132);
  for(const depth of ["far", "mid", "near"]) assert.ok(html.includes('data-ms-depth="' + depth + '"'));
});

test("homepage formula styles retain animation and gate it by chapter, pause, and visibility", async () => {
  const css = await readFile(new URL("../src/components/atlas/atlas.css", import.meta.url), "utf8");
  const base = css.match(/(?:^|\})\s*(?:html\s+)?\.atlas-manuscript\s+\.ms-line\s*\{([^}]*)\}/)?.[1];
  assert.ok(base, "The homepage must define its manuscript motion policy");
  assert.doesNotMatch(base, /\banimation\s*:|\btransform\s*:|\bopacity\s*:/, "Do not replace the component's animation with a static field");
  assert.match(base, /animation-play-state:\s*paused/);
  assert.match(css, /html:is\(\[data-atlas-phase="journey"\],\s*\[data-atlas-phase="service"\]\)\s*\.atlas-manuscript\s*\.ms-line\s*\{\s*animation-play-state:\s*running/);
  assert.match(css, /\.atlas-experience:is\(\[data-motion="paused"\],\s*\[data-page-visible="false"\]\)\s*\.atlas-manuscript\s*\.ms-line\s*\{\s*animation-play-state:\s*paused/);
  assert.doesNotMatch(css, /\.ms-line:nth-child\(9n\s*\+\s*4\)/);
});

test("formula depth keeps distinct drift speeds and the component's reduced-motion fallback", async () => {
  const css = await readFile(new URL("../src/components/atlas/atlas.css", import.meta.url), "utf8");
  for (const [depth, tempo] of [["far", "1.8"], ["mid", "1.25"], ["near", "1.1"]]) {
    const rules = css.match(new RegExp(`\\.ms-line\\[data-ms-depth="${depth}"\\]\\s*\\{([^}]*)\\}`))?.[1];
    assert.ok(rules?.includes(`--ms-tempo: ${tempo};`));
    assert.match(rules, /--ms-x-(from|to):/);
  }
  assert.match(css, /\.atlas-manuscript\s+\.ms-line:nth-child\(3n\)\s*\{\s*display:\s*none/);
  const component = await readFile(new URL("../src/components/ManuscriptLayer.astro", import.meta.url), "utf8");
  assert.match(component, /animation:\s*ms-cycle[^;]+linear infinite/);
  assert.match(component, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.ms-line\s*\{\s*animation:\s*none/);
});
