import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

async function readBuilt(relativePath) {
	try {
		return await readFile(resolve("dist", "client", relativePath), "utf8");
	} catch {
		return null;
	}
}

test("homepage exposes academic identity instead of Spectre demo copy", async () => {
	const html = await readBuilt("index.html");

	assert.ok(html, "expected built homepage HTML");
	assert.match(html, /Hengquan Guo/);
	assert.match(html, /ShanghaiTech University/);
	assert.match(html, /Selected Publications/);
	assert.match(html, /Reinforcement Learning/);
	assert.match(html, /LLM Alignment/);
	assert.doesNotMatch(html, /Latest Posts/);
	assert.doesNotMatch(html, /Work Experience/);
	assert.doesNotMatch(html, /Made in Germany/);
});

test("publications page exists and project placeholders are visible", async () => {
	const publicationsHtml = await readBuilt(resolve("publications", "index.html"));
	const homepageHtml = await readBuilt("index.html");

	assert.ok(publicationsHtml, "expected built publications index");
	assert.match(publicationsHtml, /Selected Publications|Publications/);
	assert.match(
		publicationsHtml,
		/Online convex optimization with hard constraints/i,
	);

	assert.ok(homepageHtml, "expected built homepage HTML");
	assert.match(homepageHtml, /Project Placeholder 1/);
	assert.match(homepageHtml, /Project Placeholder 2/);
	assert.match(homepageHtml, /Project Placeholder 3/);
});
