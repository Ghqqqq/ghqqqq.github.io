import {
	type FieldId,
	fieldForPaper,
	fields,
	type Paper,
	type Phase,
	resolveAtlasHash,
} from "./atlas-data";
import { type AtlasWorld, createAtlasWorld } from "./world";

export function mountAtlasExperience() {
	const root = document.querySelector<HTMLElement>("[data-atlas-experience]");
	const data = document.querySelector<HTMLScriptElement>("#atlas-paper-data");
	const reader = document.querySelector<HTMLDialogElement>(
		"[data-atlas-reader]",
	);
	if (!root || !data || !reader) return;
	const papers = JSON.parse(data.textContent ?? "[]") as Paper[];
	const selected = papers.filter((p) => p.selected);
	const research = document.querySelector<HTMLElement>("#research")!;
	let world: AtlasWorld | null = null;
	let field: FieldId | null = null;
	let phase: Phase = "overview";
	let reading: Paper | null = null;
	let view: "map" | "index" = "map";
	let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
	let returnFocus: HTMLElement | null = null;
	let readingFromApp = false;
	const readingPositions = new Map<string, number>();
	let previewPaper: string | null = null;
	let previewField: FieldId | null = null;
	function syncMotionButton() {
		root!.dataset.motion = paused ? "paused" : "running";
		const button = root!.querySelector<HTMLButtonElement>(
			"[data-toggle-motion]",
		)!;
		button.setAttribute("aria-pressed", String(paused));
		button.title = paused ? "Resume scene motion" : "Pause scene motion";
		button.setAttribute("aria-label", button.title);
		button
			.querySelector("[data-pause-icon]")!
			.toggleAttribute("hidden", paused);
		button
			.querySelector("[data-play-icon]")!
			.toggleAttribute("hidden", !paused);
	}
	let scrollFrame = 0;
	const disposers: (() => void)[] = [];
	const headingLink = document.querySelector<HTMLAnchorElement>(
		'.site-nav a[href="/"]',
	);
	if (headingLink) headingLink.href = "/";
	const indexLink = document.querySelector<HTMLAnchorElement>(
		'.site-nav a[href="/publications"]',
	);
	if (indexLink) {
		indexLink.href = "/#index";
		indexLink.dataset.openAtlasIndex = "";
	}
	function listen(
		target: EventTarget,
		type: string,
		listener: EventListener,
		options?: AddEventListenerOptions,
	) {
		target.addEventListener(type, listener, options);
		disposers.push(() => target.removeEventListener(type, listener, options));
	}
	function syncWorld() {
		world?.setState({
			phase,
			field: phase === "research" || reading ? field : null,
			reading: reading?.id ?? null,
			index: phase === "research" && view === "index",
			light: document.documentElement.dataset.theme === "light",
		});
	}
	function highlightTarget(target: EventTarget | null) {
		const choice =
			target instanceof Element
				? target.closest<HTMLElement>("[data-select-field]")
				: null;
		const next = choice?.dataset.selectField;
		const fieldId = fields.some((f) => f.id === next)
			? (next as FieldId)
			: null;
		const paperLink =
			target instanceof Element
				? target.closest<HTMLElement>("[data-read-paper]")
				: null;
		const paper =
			!reading && selected.find((p) => p.id === paperLink?.dataset.readPaper);
		const paperId = paper ? paper.id : null;
		if (paperId === previewPaper && fieldId === previewField) return;
		previewPaper = paperId;
		previewField = fieldId;
		if (paperId) root!.dataset.previewPaper = paperId;
		else delete root!.dataset.previewPaper;
		for (const link of root!.querySelectorAll<HTMLElement>(
			".field-paper,.paper-pin",
		))
			link.toggleAttribute(
				"data-previewed",
				!!paperId && link.dataset.readPaper === paperId,
			);
		if (paper) {
			root!.querySelector<HTMLElement>("[data-preview-meta]")!.textContent =
				`${paper.year} / ${paper.venueShort ?? paper.venue}`;
			root!.querySelector<HTMLElement>("[data-preview-title]")!.textContent =
				paper.title;
		}
		world?.setState({ hovered: fieldId, previewPaper: paperId });
	}
	listen(root, "pointerover", (event) => {
		if ((event as PointerEvent).pointerType !== "touch")
			highlightTarget(event.target);
	});
	listen(root, "pointerout", (event) => {
		const focused = document.activeElement;
		highlightTarget(
			focused instanceof Element && focused.matches(":focus-visible")
				? focused
				: (event as PointerEvent).relatedTarget,
		);
	});
	listen(root, "focusin", (event) => highlightTarget(event.target));
	listen(root, "focusout", (event) =>
		highlightTarget((event as FocusEvent).relatedTarget),
	);
	listen(document, "visibilitychange", () => {
		root.dataset.pageVisible = String(!document.hidden);
	});
	root.dataset.pageVisible = String(!document.hidden);
	listen(matchMedia("(prefers-reduced-motion: reduce)"), "change", (event) => {
		paused = (event as MediaQueryListEvent).matches;
		syncMotionButton();
		world?.pause(paused);
	});
	function focusField(next: FieldId | null) {
		highlightTarget(null);
		field = next;
		root!.dataset.field = next ?? "all";
		root!.querySelector<HTMLElement>("[data-research-overview]")!.hidden =
			!!next;
		for (const panel of root!.querySelectorAll<HTMLElement>(
			"[data-field-focus]",
		))
			panel.hidden = panel.dataset.fieldFocus !== next;
		const caption = root!.querySelector<HTMLElement>("[data-map-caption]");
		if (caption)
			caption.textContent =
				fields.find((f) => f.id === next)?.label ??
				"Reinforcement Learning & Bandits";
		syncWorld();
		updateResearchHeading();
	}
	function updateResearchHeading() {
		const title = root!.querySelector<HTMLElement>(".research-heading h2");
		if (title)
			title.innerHTML =
				view === "index"
					? "Publications"
					: field
						? "Research Atlas"
						: "The research<br /><em>landscape.</em>";
	}
	function setView(next: "map" | "index") {
		highlightTarget(null);
		view = next;
		root!.dataset.view = next;
		for (const button of root!.querySelectorAll<HTMLButtonElement>(
			"[data-view-button]",
		))
			button.setAttribute(
				"aria-pressed",
				String(button.dataset.viewButton === next),
			);
		syncWorld();
		updateResearchHeading();
	}
	function saveState(hash: string, replace = false, readerEntry = false) {
		if (!replace && history.state?.atlas && !reading)
			history.replaceState({ ...history.state, scroll: scrollY }, "");
		const sectionId =
			hash.startsWith("#field-") || hash === "#index"
				? "research"
				: hash.slice(1);
		const destination = !readerEntry
			? document.getElementById(sectionId)
			: null;
		const destinationScroll = destination
			? Math.max(0, destination.getBoundingClientRect().top + scrollY - 56)
			: scrollY;
		const state = {
			atlas: true,
			field,
			view,
			reader: readerEntry,
			scroll: destinationScroll,
		};
		if (replace)
			history.replaceState(
				state,
				"",
				`${location.pathname}${location.search}${hash}`,
			);
		else
			history.pushState(
				state,
				"",
				`${location.pathname}${location.search}${hash}`,
			);
	}
	function goToResearch() {
		research.scrollIntoView({
			behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
				? "auto"
				: "smooth",
			block: "start",
		});
	}
	function scope() {
		if (view === "index") {
			const query = root!
				.querySelector<HTMLInputElement>("[data-paper-search]")!
				.value.trim()
				.toLowerCase();
			return papers.filter((p) =>
				`${p.title} ${p.authors} ${p.year} ${p.venue}`
					.toLowerCase()
					.includes(query),
			);
		}
		const group = fields.find((f) => f.id === field);
		return selected.filter((p) => !group || p.category === group.category);
	}
	function updateReaderButtons() {
		const items = scope(),
			index = items.findIndex((p) => p.id === reading?.id);
		(
			reader!.querySelector("[data-reader-prev]") as HTMLButtonElement
		).disabled = index <= 0;
		(
			reader!.querySelector("[data-reader-next]") as HTMLButtonElement
		).disabled = index < 0 || index >= items.length - 1;
		reader!.querySelector<HTMLElement>("[data-reader-position]")!.textContent =
			index >= 0 ? `${index + 1} / ${items.length}` : "";
		for (const [selector, item, fallback] of [
			["[data-reader-prev]", items[index - 1], "Previous paper"],
			["[data-reader-next]", items[index + 1], "Next paper"],
		] as const) {
			const button = reader!.querySelector<HTMLButtonElement>(selector)!;
			button.title = item ? `${fallback}: ${item.title}` : fallback;
		}
	}
	function showPaper(paper: Paper) {
		rememberReadingPosition();
		highlightTarget(null);
		if (!reader!.open) returnFocus = document.activeElement as HTMLElement;
		reading = paper;
		const group = fieldForPaper(paper);
		if (group) focusField(group);
		for (const article of reader!.querySelectorAll<HTMLElement>(
			"[data-reader-paper]",
		))
			article.hidden = article.dataset.readerPaper !== paper.id;
		if (!reader!.open) reader!.showModal();
		reader!.scrollTop = readingPositions.get(paper.id) ?? 0;
		reader!
			.querySelector<HTMLElement>(
				`[data-reader-paper="${CSS.escape(paper.id)}"] h2`,
			)
			?.focus({ preventScroll: true });
		root!.dataset.reading = paper.id;
		updateReaderButtons();
		syncWorld();
	}
	function openPaper(id: string) {
		const paper = papers.find((p) => p.id === id);
		if (!paper) return;
		const replacing = reader!.open;
		if (!replacing)
			history.replaceState(
				{ atlas: true, field, view, reader: false, scroll: scrollY },
				"",
			);
		readingFromApp = true;
		saveState(`#paper-${paper.id}`, replacing, true);
		showPaper(paper);
	}
	function hideReader() {
		rememberReadingPosition();
		if (reader!.open) reader!.close();
		reading = null;
		delete root!.dataset.reading;
		syncWorld();
		returnFocus?.focus({ preventScroll: true });
	}
	function rememberReadingPosition() {
		if (reading && reader!.open)
			readingPositions.set(reading.id, reader!.scrollTop);
	}
	function closeReader() {
		if (readingFromApp && history.state?.reader) {
			history.back();
			return;
		}
		hideReader();
		saveState(field ? `#field-${field}` : "#research", true);
		readingFromApp = false;
		goToResearch();
	}
	function navigateHash() {
		const hash = resolveAtlasHash(location.hash);
		const legacy = location.hash && location.hash !== `#${hash}`;
		if (legacy) {
			history.replaceState(
				null,
				"",
				`${location.pathname}${location.search}#${hash}`,
			);
			const section = hash.startsWith("field-") ? "research" : hash;
			document
				.getElementById(section)
				?.scrollIntoView({ behavior: "instant", block: "start" });
		}
		if (hash.startsWith("paper-")) {
			const paper = papers.find((p) => p.id === hash.slice(6));
			if (paper) showPaper(paper);
			return;
		}
		hideReader();
		readingFromApp = false;
		if (history.state?.view) setView(history.state.view);
		if (hash === "index") {
			setView("index");
			if (!history.state?.atlas) goToResearch();
		} else if (hash === "overview" || !hash) {
			setView("map");
			focusField(null);
		} else if (hash.startsWith("field-")) {
			setView("map");
			const next = fields.find((f) => f.id === hash.slice(6));
			if (next) focusField(next.id);
			if (!history.state?.atlas) goToResearch();
		} else if (history.state?.atlas) focusField(history.state.field ?? null);
		if (history.state?.atlas && typeof history.state.scroll === "number")
			window.scrollTo({ top: history.state.scroll, behavior: "instant" });
	}
	listen(document, "click", ((event: MouseEvent) => {
		if (
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey ||
			event.button !== 0
		)
			return;
		const target = event.target as Element;
		if (target.closest("[data-open-atlas-index]")) {
			event.preventDefault();
			const toggle =
				document.querySelector<HTMLButtonElement>(".mobile-nav-toggle");
			if (toggle?.getAttribute("aria-expanded") === "true") {
				toggle.focus({ preventScroll: true });
				toggle.click();
			}
			setView("index");
			saveState("#index");
			goToResearch();
			return;
		}
		const paperLink = target.closest<HTMLElement>("[data-read-paper]");
		if (paperLink) {
			event.preventDefault();
			openPaper(paperLink.dataset.readPaper!);
			return;
		}
		const fieldLink = target.closest<HTMLElement>("[data-select-field]");
		if (fieldLink) {
			event.preventDefault();
			const next = fields.find((f) => f.id === fieldLink.dataset.selectField);
			if (next) {
				setView("map");
				focusField(next.id);
				saveState(`#field-${next.id}`);
				goToResearch();
			}
			return;
		}
		if (target.closest("[data-map-overview]")) {
			focusField(null);
			saveState("#research");
			world?.reset();
			return;
		}
		const viewButton = target.closest<HTMLElement>("[data-view-button]");
		if (viewButton) {
			setView(viewButton.dataset.viewButton as "map" | "index");
			saveState(
				view === "index" ? "#index" : field ? `#field-${field}` : "#research",
			);
			return;
		}
		const chapter = target.closest<HTMLElement>("[data-chapter-link]");
		if (chapter) {
			event.preventDefault();
			const id = chapter.dataset.chapterLink!;
			if (id === "overview") {
				setView("map");
				focusField(null);
			}
			saveState(`#${id}`);
			document.getElementById(id)?.scrollIntoView({
				behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
					? "auto"
					: "smooth",
			});
			return;
		}
		if (target.closest("[data-reader-close]")) {
			closeReader();
			return;
		}
		if (target.closest("[data-reader-prev],[data-reader-next]")) {
			const items = scope(),
				index = items.findIndex((p) => p.id === reading?.id);
			const next =
				items[index + (target.closest("[data-reader-next]") ? 1 : -1)];
			if (next) openPaper(next.id);
			return;
		}
		if (target.closest("[data-reset-camera]")) {
			world?.reset();
			return;
		}
		const pause = target.closest<HTMLButtonElement>("[data-toggle-motion]");
		if (pause) {
			paused = !paused;
			world?.pause(paused);
			syncMotionButton();
		}
	}) as EventListener);
	listen(reader, "cancel", (event) => {
		event.preventDefault();
		closeReader();
	});
	listen(reader, "click", (event) => {
		if (event.target === reader) {
			const rect = reader.getBoundingClientRect();
			const mouse = event as MouseEvent;
			if (mouse.clientX < rect.left || mouse.clientX > rect.right)
				closeReader();
		}
	});
	listen(window, "popstate", navigateHash);
	listen(window, "hashchange", navigateHash);
	const search = root.querySelector<HTMLInputElement>("[data-paper-search]")!;
	listen(search, "input", () => {
		const value = search.value.trim().toLowerCase();
		let matches = 0;
		for (const link of root.querySelectorAll<HTMLElement>(
			"[data-index-paper]",
		)) {
			const show = link.dataset.searchText!.includes(value);
			link.hidden = !show;
			if (show) matches++;
		}
		root.querySelector<HTMLElement>("[data-search-empty]")!.hidden =
			matches > 0;
	});
	const sections = Array.from(
		root.querySelectorAll<HTMLElement>("[data-atlas-section]"),
	);
	function updatePhase() {
		scrollFrame = 0;
		let active = sections[0];
		for (const section of sections)
			if (section.getBoundingClientRect().top < innerHeight * 0.4)
				active = section;
		const next = active.dataset.atlasSection as Phase;
		if (next !== phase) {
			highlightTarget(null);
			phase = next;
			syncWorld();
		}
		document.documentElement.dataset.atlasPhase = phase;
		document.documentElement.dataset.homeHero = [
			"overview",
			"research",
			"awards",
		].includes(phase)
			? "visible"
			: "passed";
		for (const link of root!.querySelectorAll("[data-chapter-link]")) {
			if (link.getAttribute("data-chapter-link") === phase)
				link.setAttribute("aria-current", "location");
			else link.removeAttribute("aria-current");
		}
	}
	listen(
		window,
		"scroll",
		() => {
			if (!scrollFrame) scrollFrame = requestAnimationFrame(updatePhase);
		},
		{ passive: true },
	);
	listen(window, "resize", updatePhase);
	const themeObserver = new MutationObserver(syncWorld);
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});
	root.dataset.visualReady = "true";
	syncMotionButton();
	if (location.hash === "#index") {
		setView("index");
		goToResearch();
	} else navigateHash();
	updatePhase();
	createAtlasWorld(root, papers)
		.then((result) => {
			world = result;
			syncWorld();
			world?.pause(paused);
		})
		.catch((error) => {
			root.dataset.sceneReady = "fallback";
			console.warn("Atlas scene unavailable", error);
		});
	if (import.meta.hot)
		import.meta.hot.dispose(() => {
			world?.dispose();
			themeObserver.disconnect();
			cancelAnimationFrame(scrollFrame);
			for (const dispose of disposers) dispose();
			if (reader.open) reader.close();
			delete root.dataset.reading;
		});
}
