import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isCobaltPhase, phases } from "../src/components/atlas/atlas-data.ts";
import { chapterCutFrame } from "../src/components/atlas/chapter-cut.ts";
import { layoutFieldTags } from "../src/components/atlas/field-tags.ts";
import { beginScanPulse, sampleScanPulse } from "../src/components/atlas/scan-pulse.ts";
import { scrambleText } from "../src/components/atlas/text-decode.ts";

const homepage = () => readFile(new URL("../dist/index.html", import.meta.url), "utf8");

test("a scan pulse waits for its delay, expands monotonically and ends at its radius", () => {
	const pulse = beginScanPulse(1000, { radius: 27, duration: 1900, conceals: true, delay: 650 });
	assert.deepEqual(sampleScanPulse(pulse, 1200), { radius: 0, edge: 0, done: false });
	let previous = 0;
	for (let now = 1650; now < 3550; now += 50) {
		const { radius, edge, done } = sampleScanPulse(pulse, now);
		assert.ok(radius >= previous && radius <= 27);
		assert.ok(edge >= 0 && edge <= 1);
		assert.equal(done, false);
		previous = radius;
	}
	assert.deepEqual(sampleScanPulse(pulse, 3550), { radius: 27, edge: 0, done: true });
});

test("field tags share one band above the summits and never overlap", () => {
	const anchors = [{ slot: 0, x: 795, y: 277 }, { slot: 1, x: 1075, y: 300 }, { slot: 2, x: 1181, y: 396 }];
	const tags = layoutFieldTags(anchors, 1440, 3);
	assert.equal(tags.length, 3);
	for (const [index, tag] of tags.entries()) {
		assert.equal(tag.band, 277 - 62);
		assert.ok(tag.band < anchors[index].y);
		if (index) assert.ok(tag.left >= tags[index - 1].left + tags[index - 1].width + 20);
		const [, from, to] = tag.leader.match(/M([\d.]+) [\d.]+H([\d.]+)$/).map(Number);
		assert.ok(from <= anchors[index].x && to >= anchors[index].x);
		assert.ok(from <= tag.left && to >= tag.left + tag.width);
	}
	assert.ok(tags[2].left + tags[2].width <= 1440 - 72);
	assert.ok(layoutFieldTags([{ slot: 0, x: 900, y: 160 }], 1440, 3)[0].band >= 150);
	assert.deepEqual(layoutFieldTags([], 1440, 3), []);
});

test("a chapter cut starts fully covered and finishes fully cleared in both directions", () => {
	for (const forward of [true, false]) {
		const start = chapterCutFrame(0, forward);
		const end = chapterCutFrame(1, forward);
		if (forward) {
			assert.ok(start.left >= 100 && start.right >= 100);
			assert.ok(end.left <= 0 && end.right <= 0);
		} else {
			assert.ok(start.left <= 0 && start.right <= 0);
			assert.ok(end.left >= 100 && end.right >= 100);
		}
		assert.match(start.clipPath, /^polygon\(/);
	}
	assert.equal(chapterCutFrame(-1, true).left, chapterCutFrame(0, true).left);
	assert.equal(chapterCutFrame(2, true).left, chapterCutFrame(1, true).left);
});

test("decoded text keeps its length and spaces and settles on the original", () => {
	const text = "FIELD 01 · RL & BANDITS";
	const scrambled = scrambleText(text, 0, 0, text.length, () => 0);
	assert.equal(scrambled.length, text.length);
	assert.deepEqual([...scrambled].map((c, i) => c === " " ? i : -1).filter(i => i >= 0),
		[...text].map((c, i) => c === " " ? i : -1).filter(i => i >= 0));
	assert.notEqual(scrambled, text);
	assert.equal(scrambleText(text, 1), text);
	assert.equal(scrambleText(text, 0.5, 0, text.length, () => 0).slice(0, 11), text.slice(0, 11));
});

test("cobalt chapters match the published phase order", () => {
	assert.deepEqual(phases, ["overview", "research", "journey", "awards", "service"]);
	assert.deepEqual(phases.filter(isCobaltPhase), ["overview", "research", "awards"]);
});

test("the homepage ships the survey layer with accessible, motion-safe hooks", async () => {
	const html = await homepage();
	const timecode = html.match(/<nav class="atlas-timecode"[^>]*>[\s\S]*?<\/nav>/)?.[0];
	assert.ok(timecode);
	assert.match(timecode, /aria-label="Chapter progress"/);
	for (const id of phases) assert.ok(timecode.includes(`data-chapter-link="${id}"`));
	assert.match(html, /class="chapter-cut"[^>]*data-chapter-cut[^>]*aria-hidden="true"/);
	assert.match(html, /class="opening-crosshair"[^>]*aria-hidden="true"/);
	assert.equal((html.match(/class="survey-frame"[^>]*aria-hidden="true"/g) ?? []).length, 2);
	assert.match(html, /data-reader-record/);
	const gate = html.match(/<script[^>]*data-atlas-intro-gate[^>]*>([\s\S]*?)<\/script>/)?.[1];
	assert.ok(gate);
	for (const condition of ["prefers-reduced-motion: reduce", "sessionStorage", "location.hash", "scrollY"])
		assert.ok(gate.includes(condition));
	assert.doesNotMatch(html, /class="opening-coordinate"|data-pv\b|pv-bar|\?variant=/);
});
