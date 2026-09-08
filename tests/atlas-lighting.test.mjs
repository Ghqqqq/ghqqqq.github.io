import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";
import { bakeTerrainLighting } from "../src/components/atlas/terrain-lighting.ts";
import { canExploreScene, needsAmbientFrames } from "../src/components/atlas/render-policy.ts";

test("flat terrain remains evenly lit and baking is deterministic", () => {
	const grid = new Float32Array(21 * 21);
	const light = bakeTerrainLighting(grid, 21, 21, 10, 10);
	assert.equal(light.length, grid.length * 2);
	assert.ok(light.every(value => value === 1));
	assert.deepEqual(light, bakeTerrainLighting(grid, 21, 21, 10, 10));
});

test("raised terrain casts bounded soft shading without changing heights", () => {
	const grid = new Float32Array(41 * 41);
	for (let z = 0; z < 41; z++) for (let x = 0; x < 41; x++)
		grid[z * 41 + x] = 4 * Math.exp(-((x - 16) ** 2 + (z - 24) ** 2) / 25);
	const original = grid.slice();
	const light = bakeTerrainLighting(grid, 41, 41, 10, 10);
	assert.deepEqual(grid, original);
	assert.ok(light.every(value => Number.isFinite(value) && value >= 0.4 && value <= 1));
	assert.ok(light.some((value, index) => index % 2 === 1 && value < 0.9));
	assert.ok(light.some((value, index) => index % 2 === 0 && value < 0.98));
	assert.throws(() => bakeTerrainLighting(grid, 1, 41, 10, 10));
});

test("continuous drawing is confined to the visible research landscape", () => {
	for (const phase of ["overview", "research", "journey", "awards", "service"]) {
		const state = { phase, index: false, reading: null };
		assert.equal(needsAmbientFrames(state, false), ["overview", "research"].includes(phase));
		assert.equal(needsAmbientFrames(state, true), false);
		assert.equal(needsAmbientFrames({ ...state, index: true }, false), false);
		assert.equal(needsAmbientFrames({ ...state, reading: "paper" }, false), false);
	}
	assert.equal(canExploreScene({ phase: "research", index: false, reading: null }), true);
});

test("a lightweight responsive landscape is present before WebGL initializes", async () => {
	const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
	assert.equal((html.match(/class="atlas-poster"/g) ?? []).length, 2);
	assert.match(html, /poster-mobile\.[^"\s]+\.jpg/);
	assert.match(html, /poster-desktop\.[^"\s]+\.jpg/);
	assert.match(html, /loading="eager" fetchpriority="high"/);
	for (const name of ["desktop", "mobile"]) {
		const file = await stat(new URL(`../src/assets/atlas/poster-${name}.jpg`, import.meta.url));
		assert.ok(file.size < 100_000);
	}
});
