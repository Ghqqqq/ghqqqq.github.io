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

test("homepage renders the academic CV structure and omits excluded personal data", async () => {
	const html = await readBuilt("index.html");

	assert.ok(html, "expected built homepage HTML");
	assert.match(html, /Hengquan Guo/);
	assert.match(html, /ShanghaiTech University/);
	assert.match(html, /Reinforcement Learning/);
	assert.match(html, /LLM Alignment/);
	assert.match(html, /About me/);
	assert.match(html, /Selected Publications/);
	assert.match(html, /Awards/);
	assert.match(html, /Experience/);
	assert.match(html, /Academic Service(?:\s*&amp;\s*|\s*&\s*)Teaching/);
	assert.match(html, /guohq \(at\) shanghaitech\.edu\.cn/);
	assert.match(
		html,
		/href="https:\/\/scholar\.google\.com\/citations\?user=8bGinucAAAAJ/,
	);
	assert.match(html, /National Scholarship,? 2025/);
	assert.match(html, /Project Placeholder 1/);
	assert.match(html, /Project Placeholder 2/);
	assert.match(html, /Project Placeholder 3/);
	assert.doesNotMatch(html, /mailto:/);
	assert.doesNotMatch(html, /tel:/);
	assert.doesNotMatch(html, /Xiangtan University/);
	assert.doesNotMatch(html, /Latest Posts/);
	assert.doesNotMatch(html, /Work Experience/);
	assert.doesNotMatch(html, /Made in Germany/);
});

test("publications route and homepage navigation expose full publications", async () => {
	const publicationsHtml = await readBuilt("publications/index.html");
	const homepageHtml = await readBuilt("index.html");

	assert.ok(publicationsHtml, "expected built publications index");
	assert.match(publicationsHtml, /Full Publications|Publications/);
	assert.match(
		publicationsHtml,
		/Triple-Optimistic Learning|Online convex optimization with hard constraints/i,
	);

	assert.ok(homepageHtml, "expected built homepage HTML");
	assert.match(homepageHtml, /href="\/publications"/);
	assert.match(homepageHtml, />Full Publications</);
});
