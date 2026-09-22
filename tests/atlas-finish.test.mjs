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
