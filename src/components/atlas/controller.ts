import {
	type FieldId,
	fieldForPaper,
	fields,
	type Paper,
	type Phase,
	resolveAtlasHash,
	resolveSurfaceMode,
	type SurfaceMode,
	selectedPapersForField,
} from "./atlas-data";
import { createReaderTransition, visibleTitle } from "./reader-transition";
import "./reader-transition.css";
import { type AtlasView, type AtlasWorld, createAtlasWorld } from "./world";

export function mountAtlasExperience() {
	const root = document.querySelector<HTMLElement>("[data-atlas-experience]");
	const data = document.querySelector<HTMLScriptElement>("#atlas-paper-data");
	const reader = document.querySelector<HTMLDialogElement>(
		"[data-atlas-reader]",
	);
	if (!root || !data || !reader) return;
	document.documentElement.dataset.manuscriptDepth = "layered";
	const catalog = root.querySelector<HTMLElement>("[data-selected-catalog]");
	const catalogList = root.querySelector<HTMLElement>(".catalog-list");
	const folio = reader.querySelector<HTMLElement>("[data-reader-folio]");
	if (!catalog || !catalogList || !folio) return;
	const surfaceButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-surface-mode]"),
	);
	const initialURL = new URL(location.href);
	if (
		["R", "A", "B", "C"].includes(initialURL.searchParams.get("variant") ?? "")
	) {
		initialURL.searchParams.delete("variant");
		history.replaceState(history.state, "", initialURL);
	}
	const papers = JSON.parse(data.textContent ?? "[]") as Paper[];
	const selected = papers.filter((p) => p.selected);
	const research = document.querySelector<HTMLElement>("#research")!;
	let world: AtlasWorld | null = null;
	let field: FieldId | null = null;
	let phase: Phase = "overview";
	let reading: Paper | null = null;
	let view: "map" | "index" = "map";
	let surface = resolveSurfaceMode(initialURL.searchParams.get("surface"));
	let disposed = false;
	let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const readerTransition = createReaderTransition(reader, () => !paused);
	let readerSource: HTMLElement | null = null;
	let returnFocus: HTMLElement | null = null;
	let readingFromApp = false;
	const readingPositions = new Map<string, number>();
	let readerOrigin: {
		camera: AtlasView | null;
		field: FieldId | null;
		view: "map" | "index";
		catalogScroll: number;
	} | null = null;
	let lineageFocus: string | null = null;
	let traceEpoch = 0;
	let traceAnimation: Animation | null = null;
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
	let folioFrame = 0;
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
			surface,
		});
	}
	function setSurfaceMode(next: SurfaceMode, updateURL = false) {
		surface = next;
		root!.dataset.surface = next;
		for (const button of surfaceButtons)
			button.setAttribute(
				"aria-pressed",
				String(button.dataset.surfaceMode === next),
			);
		if (updateURL) {
			const url = new URL(location.href);
			if (next === "relief") url.searchParams.delete("surface");
			else url.searchParams.set("surface", next);
			history.replaceState(history.state, "", url);
		}
		syncWorld();
	}
	function updateSurfaceAvailability() {
		for (const button of surfaceButtons) {
			button.disabled = root!.dataset.sceneReady !== "true";
			button.title =
				root!.dataset.sceneReady === "fallback"
					? "3D view unavailable"
					: button.dataset.surfaceMode === "relief"
						? "Satin relief"
						: "Contour study";
		}
	}
	const sceneObserver = new MutationObserver(updateSurfaceAvailability);
	sceneObserver.observe(root, {
		attributes: true,
		attributeFilter: ["data-scene-ready"],
	});
	function updateFolio() {
		folioFrame = 0;
		const extent = reader!.scrollHeight - reader!.clientHeight;
		const fraction = reader!.open
			? extent > 0
				? Math.max(0, Math.min(1, reader!.scrollTop / extent))
				: 1
			: 0;
		folio!.style.setProperty("--folio-position", String(fraction));
	}
	function queueFolio() {
		if (!disposed && reader!.open && !folioFrame)
			folioFrame = requestAnimationFrame(updateFolio);
	}
	const readerResizeObserver =
		typeof ResizeObserver === "undefined"
			? null
			: new ResizeObserver(queueFolio);
	listen(reader, "scroll", queueFolio, { passive: true });
	listen(reader, "load", queueFolio, { capture: true });
	void document.fonts.ready.then(queueFolio);
	function highlightTarget(target: EventTarget | null) {
		// Keep the hovered map title present until its old-frame capture completes.
		if (document.documentElement.dataset.readerTransitionStage === "capture")
			return;
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
			".catalog-paper,.paper-pin",
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
	function highlightLineage(target: EventTarget | null) {
		const relation =
			target instanceof Element
				? target.closest<HTMLElement>("[data-lineage-relation]")
				: null;
		const match = papers.find(
			(p) =>
				p.id === relation?.dataset.lineageTo &&
				p.lineage?.sourceId === relation?.dataset.lineageFrom,
		);
		const id = match?.id ?? null;
		if (id === lineageFocus) return;
		lineageFocus = id;
		for (const item of reader!.querySelectorAll<HTMLElement>(
			"[data-lineage-relation]",
		))
			item.toggleAttribute(
				"data-lineage-active",
				item.dataset.lineageTo === id,
			);
		world?.setState({ lineageFocus: id });
	}
	listen(reader, "pointerover", (event) => highlightLineage(event.target));
	listen(reader, "pointerout", (event) =>
		highlightLineage((event as PointerEvent).relatedTarget),
	);
	listen(reader, "focusin", (event) => highlightLineage(event.target));
	listen(reader, "focusout", (event) =>
		highlightLineage((event as FocusEvent).relatedTarget),
	);
	function cancelLineage() {
		traceEpoch++;
		traceAnimation?.cancel();
		traceAnimation = null;
		world?.cancelTrace();
		reader!.removeAttribute("data-tracing");
		reader!.removeAttribute("aria-busy");
		reader!.style.removeProperty("--lineage-progress");
		delete root!.dataset.lineageTravel;
		highlightLineage(null);
	}
	async function traceLineage(link: HTMLElement) {
		const destinationId = link.dataset.lineageLink;
		const current = reading;
		const destination = papers.find((p) => p.id === destinationId);
		if (
			!destinationId ||
			!current ||
			!destination ||
			(current.lineage?.sourceId !== destinationId &&
				destination.lineage?.sourceId !== current.id) ||
			reader!.hasAttribute("data-tracing")
		)
			return;
		if (
			!world ||
			matchMedia("(prefers-reduced-motion: reduce)").matches ||
			document.hidden
		) {
			openPaper(destinationId);
			return;
		}
		cancelLineage();
		const epoch = traceEpoch;
		reader!.setAttribute("data-tracing", "");
		reader!.setAttribute("aria-busy", "true");
		root!.dataset.lineageTravel = "true";
		highlightLineage(link);
		let completed = false;
		if (innerWidth <= 760) {
			const progress = link
				.closest("[data-lineage-relation]")!
				.querySelector<HTMLElement>("[data-lineage-progress]")!;
			traceAnimation = progress.animate(
				[{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
				{ duration: 280, easing: "ease-in-out", fill: "forwards" },
			);
			try {
				await traceAnimation.finished;
				completed = true;
			} catch {}
		} else {
			completed = await world.traceLineage(current.id, destinationId, (value) =>
				reader!.style.setProperty("--lineage-progress", String(value)),
			);
		}
		if (epoch !== traceEpoch || !reader!.open || reading?.id !== current.id)
			return;
		cancelLineage();
		if (completed || root!.dataset.sceneReady === "fallback")
			openPaper(destinationId);
	}
	listen(document, "visibilitychange", () => {
		root.dataset.pageVisible = String(!document.hidden);
		if (document.hidden) {
			cancelLineage();
			readerTransition.cancel();
		}
	});
	root.dataset.pageVisible = String(!document.hidden);
	listen(matchMedia("(prefers-reduced-motion: reduce)"), "change", (event) => {
		readerTransition.cancel();
		cancelLineage();
		paused = (event as MediaQueryListEvent).matches;
		syncMotionButton();
		world?.pause(paused);
	});
	function focusField(next: FieldId | null) {
		highlightTarget(null);
		const changed = field !== next;
		field = next;
		root!.dataset.field = next ?? "all";
		for (const item of catalog!.querySelectorAll<HTMLElement>(
			"[data-catalog-item]",
		))
			item.hidden = !!next && item.dataset.catalogField !== next;
		for (const button of catalog!.querySelectorAll<HTMLButtonElement>(
			"[data-field-filter]",
		))
			button.setAttribute(
				"aria-pressed",
				String(button.dataset.fieldFilter === (next ?? "all")),
			);
		catalog!.querySelector("[data-catalog-title]")!.textContent =
			fields.find((item) => item.id === next)?.short ?? "Selected work";
		catalog!.querySelector("[data-catalog-count]")!.textContent =
			`${selectedPapersForField(papers, next).length} works`;
		if (changed) catalogList!.scrollTop = 0;
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
			title.textContent = view === "index" ? "Publications" : "Research Atlas";
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
	function saveState(
		hash: string,
		replace = false,
		readerEntry = false,
		scrollPosition?: number,
	) {
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
			scroll: scrollPosition ?? destinationScroll,
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
		const selection = readerOrigin ?? { field, view };
		let items: Paper[];
		if (selection.view === "index") {
			const query = root!
				.querySelector<HTMLInputElement>("[data-paper-search]")!
				.value.trim()
				.toLowerCase();
			items = papers.filter((p) =>
				`${p.title} ${p.authors} ${p.year} ${p.venue}`
					.toLowerCase()
					.includes(query),
			);
		} else items = selectedPapersForField(papers, selection.field);
		// A lineage jump can leave the originating list while keeping its return context.
		if (reading && !items.some((paper) => paper.id === reading!.id)) {
			const direction = fieldForPaper(reading);
			if (direction) return selectedPapersForField(papers, direction);
		}
		return items;
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
		if (!reader!.open) {
			returnFocus = document.activeElement as HTMLElement;
			readerOrigin = readingFromApp
				? {
						camera: world?.captureView() ?? null,
						field,
						view,
						catalogScroll: catalogList!.scrollTop,
					}
				: null;
		}
		reading = paper;
		for (const article of reader!.querySelectorAll<HTMLElement>(
			"[data-reader-paper]",
		))
			article.hidden = article.dataset.readerPaper !== paper.id;
		if (!reader!.open) reader!.showModal();
		const group = fieldForPaper(paper);
		if (group) focusField(group);
		reader!.scrollTop = readingPositions.get(paper.id) ?? 0;
		reader!
			.querySelector<HTMLElement>(
				`[data-reader-paper="${CSS.escape(paper.id)}"] h2`,
			)
			?.focus({ preventScroll: true });
		root!.dataset.reading = paper.id;
		readerResizeObserver?.disconnect();
		const article = reader!.querySelector<HTMLElement>(
			`[data-reader-paper="${CSS.escape(paper.id)}"]`,
		);
		if (article) readerResizeObserver?.observe(article);
		queueFolio();
		updateReaderButtons();
		syncWorld();
	}
	function paperHeading() {
		return reader!.querySelector<HTMLElement>(
			"[data-reader-paper]:not([hidden]) > h2",
		);
	}
	function sourceTitle(link: HTMLElement | null) {
		if (!link) return null;
		if (link.hasAttribute("data-paper-pin"))
			return visibleTitle(
				root!.querySelector<HTMLElement>("[data-preview-title]"),
			);
		return visibleTitle(link.querySelector<HTMLElement>("strong, h3"));
	}
	function returnTitle(id: string) {
		if (readerSource?.dataset.readPaper === id) {
			const source = sourceTitle(readerSource);
			if (source) return source;
		}
		for (const link of root!.querySelectorAll<HTMLElement>(
			`a[data-read-paper="${CSS.escape(id)}"]`,
		)) {
			const source = sourceTitle(link);
			if (source) return source;
		}
		return null;
	}
	function openPaper(id: string, source: HTMLElement | null = null) {
		const paper = papers.find((p) => p.id === id);
		if (!paper) return;
		readerTransition.cancel(false);
		if (!reader!.open && source) {
			readerSource = source;
			readerTransition.run(`open:${id}`, "open", sourceTitle(source), () => {
				openPaperNow(paper);
				return paperHeading();
			});
		} else openPaperNow(paper);
	}
	function openPaperNow(paper: Paper) {
		cancelLineage();
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
		cancelLineage();
		rememberReadingPosition();
		const origin = reader!.open ? readerOrigin : null;
		if (reader!.open) reader!.close();
		delete reader!.dataset.readerShared;
		readerResizeObserver?.disconnect();
		cancelAnimationFrame(folioFrame);
		folioFrame = 0;
		folio!.style.setProperty("--folio-position", "0");
		readerOrigin = null;
		reading = null;
		delete root!.dataset.reading;
		if (origin) {
			setView(origin.view);
			focusField(origin.field);
			catalogList!.scrollTop = origin.catalogScroll;
		} else syncWorld();
		returnFocus?.focus({ preventScroll: true });
		return origin;
	}
	function rememberReadingPosition() {
		if (reading && reader!.open)
			readingPositions.set(reading.id, reader!.scrollTop);
	}
	function closeReader() {
		cancelLineage();
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
		const key = `close:${location.href}`;
		if (readerTransition.key === key) return;
		readerTransition.cancel(false);
		if (
			reader!.open &&
			reading &&
			!resolveAtlasHash(location.hash).startsWith("paper-")
		) {
			const id = reading.id;
			readerTransition.run(key, "close", paperHeading(), () => {
				navigateHashNow();
				return returnTitle(id);
			});
		} else navigateHashNow();
	}
	function navigateHashNow() {
		cancelLineage();
		setSurfaceMode(
			resolveSurfaceMode(new URLSearchParams(location.search).get("surface")),
		);
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
			readingFromApp = Boolean(history.state?.reader);
			const paper = papers.find((p) => p.id === hash.slice(6));
			if (paper) showPaper(paper);
			return;
		}
		const origin = hideReader();
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
		updatePhase();
		if (origin?.camera) world?.restoreView(origin.camera);
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
		const surfaceButton = target.closest<HTMLButtonElement>(
			"[data-surface-mode]",
		);
		if (surfaceButton && !surfaceButton.disabled) {
			event.preventDefault();
			setSurfaceMode(
				resolveSurfaceMode(surfaceButton.dataset.surfaceMode ?? null),
				true,
			);
			return;
		}
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
			if (paperLink.hasAttribute("data-lineage-link"))
				void traceLineage(paperLink);
			else openPaper(paperLink.dataset.readPaper!, paperLink);
			return;
		}
		const fieldLink = target.closest<HTMLElement>("[data-select-field]");
		if (fieldLink) {
			event.preventDefault();
			const next = fields.find((f) => f.id === fieldLink.dataset.selectField);
			if (next) {
				const inCatalog = !!fieldLink.closest("[data-selected-catalog]");
				setView("map");
				focusField(next.id);
				saveState(
					`#field-${next.id}`,
					false,
					false,
					inCatalog ? scrollY : undefined,
				);
				if (!inCatalog) goToResearch();
			}
			return;
		}
		if (target.closest("[data-map-overview]")) {
			focusField(null);
			saveState("#research", false, false, scrollY);
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
			if (paused) readerTransition.cancel();
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
	listen(window, "resize", () => {
		readerTransition.cancel();
		cancelLineage();
		updatePhase();
		queueFolio();
	});
	const themeObserver = new MutationObserver(syncWorld);
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});
	root.dataset.visualReady = "true";
	syncMotionButton();
	setSurfaceMode(surface);
	updateSurfaceAvailability();
	if (location.hash === "#index") {
		setView("index");
		goToResearch();
	} else navigateHash();
	updatePhase();
	createAtlasWorld(root, papers)
		.then((result) => {
			if (disposed) {
				result?.dispose();
				return;
			}
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
			disposed = true;
			readerTransition.cancel(false);
			cancelLineage();
			world?.dispose();
			themeObserver.disconnect();
			sceneObserver.disconnect();
			readerResizeObserver?.disconnect();
			cancelAnimationFrame(scrollFrame);
			cancelAnimationFrame(folioFrame);
			for (const dispose of disposers) dispose();
			if (reader.open) reader.close();
			delete root.dataset.reading;
		});
}
