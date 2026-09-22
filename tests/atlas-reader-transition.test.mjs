import assert from "node:assert/strict";
import test from "node:test";
import { createReaderTransition } from "../src/components/atlas/reader-transition.ts";

function harness(t, allowed = true, supported = true) {
	const previous = globalThis.document;
	const pending = [];
	const html = { dataset: {} };
	const reader = { style: { viewTransitionName: "" }, dataset: {}, querySelector: () => null };
	globalThis.document = {
		documentElement: html,
		hidden: false,
		startViewTransition: supported ? (update) => {
			let ready, finish;
			const transition = {
				ready: new Promise(resolve => { ready = resolve; }),
				finished: new Promise(resolve => { finish = resolve; }),
				skipTransition: () => finish(),
			};
			pending.push({ update, ready, finish });
			return transition;
		} : undefined,
	};
	t.after(() => {
		if (previous === undefined) delete globalThis.document;
		else globalThis.document = previous;
	});
	return { motion: createReaderTransition(reader, () => allowed), pending, html, reader };
}

for (const [label, allowed, supported] of [["paused", false, true], ["unsupported", true, false]]) {
	test(`reader navigation remains synchronous when ${label}`, t => {
		const { motion, pending, html } = harness(t, allowed, supported);
		let updates = 0;
		motion.run("open:a", "open", null, () => { updates++; return null; });
		assert.equal(updates, 1);
		assert.equal(pending.length, 0);
		assert.equal(html.dataset.readerTransition, undefined);
	});
}

test("a superseded reader request cannot commit or clear the newer transition", async t => {
	const { motion, pending, html, reader } = harness(t);
	const updates = [];
	motion.run("open:a", "open", null, () => { updates.push("a"); return null; });
	motion.run("open:b", "open", null, () => { updates.push("b"); return null; });
	pending[0].update();
	pending[0].finish();
	await Promise.resolve();
	assert.equal(motion.key, "open:b");
	assert.equal(html.dataset.readerTransition, "open");
	pending[1].update();
	pending[1].ready();
	await Promise.resolve();
	assert.equal(html.dataset.readerTransitionStage, "animating");
	assert.deepEqual(updates, ["b"]);
	pending[1].finish();
	await Promise.resolve();
	assert.equal(motion.key, undefined);
	assert.equal(reader.style.viewTransitionName, "");
	assert.equal(html.dataset.readerTransition, undefined);
});

test("motion preference changes settle a pending navigation exactly once", async t => {
	const { motion, pending, html, reader } = harness(t);
	let updates = 0;
	motion.run("open:a", "open", null, () => { updates++; return null; });
	motion.cancel();
	pending[0].update();
	await Promise.resolve();
	assert.equal(updates, 1);
	assert.equal(motion.key, undefined);
	assert.equal(reader.style.viewTransitionName, "");
	assert.equal(html.dataset.readerTransition, undefined);
});

test("hidden documents skip reader animation without losing navigation", t => {
	const { motion, pending } = harness(t);
	document.hidden = true;
	let updates = 0;
	motion.run("close:a", "close", null, () => { updates++; return null; });
	assert.equal(updates, 1);
	assert.equal(pending.length, 0);
});
