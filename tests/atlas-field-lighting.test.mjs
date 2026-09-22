import assert from "node:assert/strict";
import test from "node:test";
import { fields } from "../src/components/atlas/atlas-data.ts";
import { fieldQuietWeights, terrainFieldWeights } from "../src/components/atlas/field-lighting.ts";

test("field lighting forms a bounded partition and keeps each peak in its own region", () => {
	for (let x = -18; x <= 18; x += 0.7) for (let z = -14; z <= 14; z += 0.7) {
		const weights = terrainFieldWeights(x, z, fields);
		assert.ok(weights.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
		assert.ok(Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
		const next = terrainFieldWeights(x + 0.01, z, fields);
		assert.ok(weights.every((value, i) => Math.abs(value - next[i]) < 0.03));
	}
	fields.forEach((field, index) => assert.ok(terrainFieldWeights(field.x, field.z, fields)[index] > 0.999));
});

test("All restores neutral lighting and a selected direction only quiets the other regions", () => {
	assert.deepEqual(fieldQuietWeights(fields, null), [0, 0, 0]);
	assert.deepEqual(fieldQuietWeights(fields, "unknown"), [0, 0, 0]);
	assert.deepEqual(fieldQuietWeights(fields, "foundations"), [0, 1, 1]);
	assert.deepEqual(fieldQuietWeights(fields, "applications"), [1, 0, 1]);
	assert.deepEqual(fieldQuietWeights(fields, "agents"), [1, 1, 0]);
});

test("confirmed cross-field lineage keeps both endpoints fully legible", () => {
	assert.deepEqual(fieldQuietWeights(fields, "agents", ["agents", "foundations"]), [0, 1, 0]);
	assert.deepEqual(fieldQuietWeights(fields, null, ["agents"]), [0, 0, 0]);
});
