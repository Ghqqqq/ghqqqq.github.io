import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { fields, fieldForPaper, resolveAtlasHash } from "../src/components/atlas/atlas-data.ts";
import { terrainElevation } from "../src/components/atlas/terrain.ts";

const projectFile = (path) => new URL(`../${path}`, import.meta.url);
async function homepage() {
	const html = await readFile(projectFile("dist/index.html"), "utf8");
	const papers = JSON.parse(html.match(/id="atlas-paper-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
	return { html, papers };
}
const visibleText = (html) => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
	.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

test("atlas terrain is deterministic, bounded and continuous at the mesh scale", () => {
	for (let x = -17; x <= 17; x += 0.25) {
		for (let z = -14; z <= 14; z += 0.25) {
			const y = terrainElevation(x, z, fields);
			assert.ok(Number.isFinite(y) && y >= -0.1 && y < 8);
			assert.equal(y, terrainElevation(x, z, fields));
			assert.ok(Math.abs(y - terrainElevation(x + 0.01, z, fields)) < 0.3);
		}
	}
});

test("research markers sit on the three raised regions and the outer terrain fades to sea level", () => {
	for (const field of fields) {
		assert.ok(terrainElevation(field.x, field.z, fields) > 1.5);
	}
	for (const [x, z] of [[-17, -14], [-17, 14], [17, -14], [17, 14]]) {
		assert.ok(Math.abs(terrainElevation(x, z, fields)) < 0.1);
	}
});

test("the atlas keeps its animated manuscript and separate responsive scene anchors", async () => {
	const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
	assert.match(html, /class="atlas-manuscript"/);
	assert.match(html, /class="manuscript-layer"/);
	assert.ok((html.match(/class="ms-line(?: |")/g) ?? []).length >= 100);
	assert.match(html, /data-scene-frame="overview"/);
	assert.match(html, /data-scene-frame="research"/);
	assert.match(html, /data-atlas-reader/);
});

test("map annotations retain accessible paper context and a stable reading position", async () => {
	const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
	const data = JSON.parse(html.match(/id="atlas-paper-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
	const pins = [...html.matchAll(/<button\b[^>]*data-paper-pin="([^"]+)"[^>]*>/g)];
	assert.equal(pins.length, data.filter(p => p.selected).length);
	assert.equal(new Set(pins.map(p => p[1])).size, pins.length);
	for (const [tag, id] of pins) {
		const paper = data.find(p => p.id === id);
		assert.ok(paper?.selected);
		assert.ok(tag.includes(`data-read-paper="${id}"`));
		assert.match(tag, new RegExp(`aria-label="[^"]+${paper.year}"`));
	}
	assert.match(html, /data-paper-preview[^>]*hidden/);
	assert.match(html, /data-reader-position[^>]*aria-label="Publication position"/);
});

test("the production root serves the reviewed landscape and all academic chapters", async () => {
	const { html } = await homepage();
	assert.match(html, /<title>Hengquan Guo<\/title>/);
	assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
	assert.match(html, /data-atlas-experience/);
	assert.match(html, /data-atlas-world/);
	for (const id of ["overview", "research", "journey", "awards", "service"]) {
		assert.ok(html.includes(`id="${id}"`));
		assert.ok(html.includes(`data-chapter-link="${id}"`));
	}
	assert.match(html, /id="theme-toggle"/);
	assert.match(html, /id="snake-board"/);
	assert.doesNotMatch(html, /data-home-atlas|data-research-relay/);
	assert.doesNotMatch(html, /chatgpt\.site|127\.0\.0\.1|localhost/);
});

test("the approved biography, advisor URLs and contact details survive promotion", async () => {
	const { html } = await homepage(), text = visibleText(html);
	for (const url of ["https://www.shanghaitech.edu.cn/", "https://liuxincell.github.io/", "https://junwei-pan.github.io/"]) {
		assert.ok(html.includes(`href="${url}"`));
	}
	assert.match(text, /research centers on reinforcement learning and bandits, spanning theoretical foundations and applications/i);
	assert.match(text, /In 2025[\s\S]*Tencent Rhino-Bird Elite Talent Program[\s\S]*advised by/);
	assert.match(text, /current research interest is in reinforcement learning for agentic LLMs and multimodal large models/i);
	assert.match(text, /guohq \(at\) shanghaitech\.edu\.cn/);
	assert.match(text, /guohq46 \(at\) qq\.com/);
	assert.match(html, /scholar\.google\.com\/citations\?user=8bGinucAAAAJ/);
	assert.doesNotMatch(text, /ideation agent|reviewers of FARS|KDDS|Coming soon|Latest Posts|Made in Germany/i);
});

test("all papers, research categories and idea-lineage targets remain available", async () => {
	const { html, papers } = await homepage();
	const files = await readdir(projectFile("src/content/publications"));
	assert.equal(papers.length, files.filter(file => /\.mdx?$/.test(file)).length);
	assert.ok(papers.length >= 17);
	assert.equal(new Set(papers.map(p => p.id)).size, papers.length);
	assert.deepEqual(papers.map(p => p.year), papers.map(p => p.year).sort((a, b) => b - a));
	for (const paper of papers) {
		assert.ok(html.includes(`href="/publications/${paper.id}"`));
		await access(projectFile(`dist/publications/${paper.id}/index.html`));
		if (paper.selected) assert.ok(fieldForPaper(paper));
		if (paper.lineage) assert.ok(papers.some(p => p.id === paper.lineage.sourceId));
	}
	for (const field of fields) {
		assert.ok(html.includes(`data-field-focus="${field.id}"`));
		assert.ok(papers.some(p => p.selected && p.category === field.category));
	}
	assert.equal((html.match(/data-index-paper\b/g) ?? []).length, papers.length);
	assert.equal((html.match(/data-reader-paper="/g) ?? []).length, papers.length);
	assert.match(visibleText(html), /Hard constraints.*rectified policy optimization/);
});

test("idea-lineage traversal exposes both directions of declared relations only", async () => {
	const { html, papers } = await homepage();
	const relations = [...html.matchAll(/<aside\b[^>]*data-lineage-relation[^>]*>[\s\S]*?<\/aside>/g)].map(match => match[0]);
	const declared = papers.filter(paper => paper.lineage);
	assert.ok(declared.length > 0);
	assert.equal(relations.length, declared.length * 2);
	for (const target of declared) {
		const source = papers.find(paper => paper.id === target.lineage.sourceId);
		const pair = relations.filter(relation => relation.includes(`data-lineage-from="${source.id}"`) && relation.includes(`data-lineage-to="${target.id}"`));
		assert.equal(pair.length, 2);
		for (const [direction, destination] of [["backward", source.id], ["forward", target.id]]) {
			const relation = pair.find(item => item.includes(`data-lineage-direction="${direction}"`));
			assert.ok(relation);
			assert.ok(relation.includes(`data-lineage-link="${destination}"`));
			assert.ok(relation.includes(`href="/publications/${destination}"`));
			assert.match(relation, /data-lineage-progress/);
		}
	}
	assert.match(html, /data-reading-map-label[^>]*aria-hidden="true"[^>]*hidden/);
});

test("experience, awards and service retain every current content record", async () => {
	const { html } = await homepage();
	const section = id => html.match(new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))[1];
	const experience = JSON.parse(await readFile(projectFile("src/content/experience.json"), "utf8"));
	const awards = JSON.parse(await readFile(projectFile("src/content/awards.json"), "utf8"));
	const services = JSON.parse(await readFile(projectFile("src/content/service-teaching.json"), "utf8"));
	const journey = visibleText(section("journey")), awardText = visibleText(section("awards")), serviceText = visibleText(section("service"));
	for (const item of experience) {
		assert.ok(journey.includes(item.period));
		assert.ok(journey.includes(item.description));
	}
	assert.match(journey, /Analemma/);
	assert.match(journey, /KDD 2026 ADS Track/);
	for (const item of awards) {
		assert.ok(awardText.includes(item.title));
		if (item.meta) assert.ok(awardText.includes(item.meta));
	}
	assert.equal((section("awards").match(/<li\b/g) ?? []).length, awards.length);
	assert.match(awardText, /ICML Silver Reviewer/);
	assert.match(awardText, /Top 25%/);
	assert.match(awardText, /Outstanding Award/);
	for (const item of services) {
		assert.ok(serviceText.includes(item.title));
		assert.ok(serviceText.includes(item.meta));
	}
});

test("the current internship timeline starts with Baidu and keeps Analemma's completed period", async () => {
	const { html } = await homepage();
	const entries = [...html.matchAll(/<article class="journey-entry">([\s\S]*?)<\/article>/g)].map(match => visibleText(match[1]));
	assert.match(entries[0], /Baidu \/ ERNIE/);
	assert.ok(entries[0].includes("2026.08–Present"));
	assert.match(entries[0], /RSI and the evaluation of agentic systems/);
	assert.match(entries[0], /black-box assessment of end-to-end behavior and white-box analysis of internal mechanisms/);
	assert.match(entries[0], /understanding agent capabilities, diagnosing failure modes, and assessing reliability/);
	assert.match(entries[1], /Analemma/);
	assert.ok(entries[1].includes("2026.04–2026.07"));
	assert.match(entries[2], /Tencent Rhino-Bird Elite Talent Program/);
	assert.ok(entries[2].includes("2025.06–2026.02"));
});

test("experience organization marks are rendered with their packaged themeable assets", async () => {
	const { html } = await homepage();
	const journey = html.match(/<section[^>]*id="journey"[^>]*>([\s\S]*?)<\/section>/)[1];
	assert.ok(journey.includes('class="journey-analemma" aria-hidden="true"'), "Analemma's mark must accompany its organization name");
	assert.ok(visibleText(journey).includes("Analemma"));
	assert.ok(journey.includes("journey-tencent"), "Tencent's existing wordmark must remain available");
	assert.ok(journey.includes('class="journey-ernie"'));
	assert.ok(journey.includes('href="/ernie-mark.png"'), "Baidu / ERNIE must retain the official mark's original geometry");
	assert.ok(journey.includes('filter="url(#ernie-mark-ink)"'));
	assert.ok(journey.includes('flood-color="currentColor"'), "ERNIE's transparent mark must follow the text color");
	const cssFiles = [...html.matchAll(/href="(\/_astro\/[^\"]+\.css)"/g)].map(match => match[1]);
	const css = (await Promise.all(cssFiles.map(file => readFile(projectFile(`dist${file}`), "utf8")))).join("\n");
	assert.ok(css.includes("analemma-mark.png"), "The homepage must load the mark's mask styling");
	assert.deepEqual(await readFile(projectFile("dist/analemma-mark.png")), await readFile(projectFile("public/analemma-mark.png")));
	assert.deepEqual(await readFile(projectFile("dist/ernie-mark.png")), await readFile(projectFile("public/ernie-mark.png")));
});

test("IdeaTrail appears in Agents, the reading layer and the complete archive", async () => {
	const { html, papers } = await homepage();
	const paper = papers.find(paper => paper.id === "ideatrail-full-process-agent-trajectories-for-scientific-ideation");
	assert.ok(paper, "IdeaTrail must be included in publication data");
	assert.equal(paper.title, "IdeaTrail: Full-Process Agent Trajectories for Scientific Ideation");
	assert.equal(paper.authors, "Hengquan Guo");
	assert.equal(paper.year, 2026);
	assert.equal(paper.venue, "ArXiv preprint");
	assert.equal(paper.link, "https://arxiv.org/abs/2607.10144");
	assert.equal(paper.selected, true);
	assert.equal(fieldForPaper(paper), "agents");
	assert.ok(html.includes(`data-paper-pin="${paper.id}"`));
	assert.ok(html.includes(`data-reader-paper="${paper.id}"`));
	const archive = await readFile(projectFile("dist/publications/index.html"), "utf8");
	assert.ok(visibleText(archive).includes(paper.title));
	await access(projectFile(`dist/publications/${paper.id}/index.html`));
});

test("existing section bookmarks resolve to the corresponding new views", () => {
	for (const [old, next] of Object.entries({
		about: "journey", experience: "journey", publications: "research",
		"research-interests": "research",
		"publications-agent-llm-alignment": "field-agents",
		"publications-recommendation-bidding": "field-applications",
		"publications-reinforcement-learning-bandits": "field-foundations",
	})) assert.equal(resolveAtlasHash(`#${old}`), next);
	for (const hash of ["", "overview", "index", "field-agents", "paper-example", "constructor", "__proto__", "%E0%A4%A"])
		assert.equal(resolveAtlasHash(`#${hash}`), hash);
	assert.equal(resolveAtlasHash("#field%2Dagents"), "field-agents");
});

test("production does not include private hosting configuration and keeps the atlas alias", async () => {
	if (process.env.ATLAS_PRIVATE_PREVIEW !== "1") {
		await assert.rejects(access(projectFile(".openai/hosting.json")), { code: "ENOENT" });
	}
	const alias = await readFile(projectFile("dist/atlas/index.html"), "utf8");
	assert.match(alias, /http-equiv="refresh"/);
	assert.match(alias, /url=\//);
	const controller = await readFile(projectFile("src/components/atlas/controller.ts"), "utf8");
	assert.match(controller, /indexLink\.href = "\/#index"/);
	assert.doesNotMatch(controller, /"\/atlas/);
});

test("the current Douge Workshop and its independent fallback are preserved verbatim", async () => {
	for (const file of ["index.html", "fallback.html"]) {
		assert.deepEqual(await readFile(projectFile(`dist/douge-workshop/${file}`)), await readFile(projectFile(`public/douge-workshop/${file}`)));
	}
});
