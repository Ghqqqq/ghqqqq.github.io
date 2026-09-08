import {
	type FieldId,
	fieldForPaper,
	fields,
	type Paper,
	type Phase,
} from "./atlas-data";
import { canExploreScene, needsAmbientFrames } from "./render-policy";
import { terrainElevation } from "./terrain";
import { bakeTerrainLighting } from "./terrain-lighting";

export type WorldState = {
	phase: Phase;
	field: FieldId | null;
	reading: string | null;
	index: boolean;
	light: boolean;
	hovered: FieldId | null;
	previewPaper: string | null;
};
export type AtlasWorld = {
	setState: (next: Partial<WorldState>) => void;
	reset: () => void;
	pause: (value: boolean) => void;
	dispose: () => void;
};

const elevation = (x: number, z: number) => terrainElevation(x, z, fields);

export async function createAtlasWorld(
	root: HTMLElement,
	papers: Paper[],
): Promise<AtlasWorld | null> {
	const host = root.querySelector<HTMLElement>("[data-atlas-world]");
	if (!host) return null;
	const THREE = await import("three");
	let renderer: InstanceType<typeof THREE.WebGLRenderer>;
	try {
		renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false,
			powerPreference: "low-power",
		});
	} catch {
		root.dataset.sceneReady = "fallback";
		return null;
	}
	renderer.setPixelRatio(
		Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.65),
	);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	host.append(renderer.domElement);
	renderer.domElement.setAttribute("aria-hidden", "true");
	const scene = new THREE.Scene();
	const background = new THREE.Color(0x1735d6);
	scene.background = background;
	scene.fog = new THREE.FogExp2(background, 0.032);
	const camera = new THREE.PerspectiveCamera(
		38,
		innerWidth / innerHeight,
		0.1,
		140,
	);
	const segments = innerWidth < 700 ? 180 : 280;
	const depthSegments = Math.round((segments * 28) / 34);
	const terrainGeometry = new THREE.PlaneGeometry(
		34,
		28,
		segments,
		depthSegments,
	);
	terrainGeometry.rotateX(-Math.PI / 2);
	const positions = terrainGeometry.getAttribute("position");
	const heights = new Float32Array(positions.count);
	for (let i = 0; i < positions.count; i++) {
		heights[i] = elevation(positions.getX(i), positions.getZ(i));
		positions.setY(i, heights[i]);
	}
	terrainGeometry.setAttribute(
		"terrainLight",
		new THREE.Float32BufferAttribute(
			bakeTerrainLighting(heights, segments + 1, depthSegments + 1, 34, 28),
			2,
		),
	);
	terrainGeometry.computeVertexNormals();
	const terrainMaterial = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: true,
		uniforms: {
			base: { value: new THREE.Color(0x345bed) },
			valley: { value: new THREE.Color(0x112987) },
			summit: { value: new THREE.Color(0xc0e2f0) },
			fogColor: { value: background },
			strength: { value: 1 },
			clock: { value: 0 },
			focus: { value: new THREE.Vector2(0, 0) },
			focusStrength: { value: 0 },
		},
		vertexShader: `
			attribute vec2 terrainLight; varying vec2 bakedLight;
			varying vec3 terrainNormal; varying vec3 terrainPosition;
			varying float distanceToCamera;
			void main() {
				bakedLight = terrainLight;
				terrainNormal = normalize(mat3(modelMatrix) * normal);
				terrainPosition = (modelMatrix * vec4(position, 1.0)).xyz;
				vec4 v = modelViewMatrix * vec4(position, 1.0);
				distanceToCamera = -v.z;
				gl_Position = projectionMatrix * v;
			}`,
		fragmentShader: `
			varying vec2 bakedLight;
			uniform vec3 base; uniform vec3 valley; uniform vec3 summit;
			uniform vec3 fogColor; uniform float strength; uniform float clock;
			uniform vec2 focus; uniform float focusStrength;
			varying vec3 terrainNormal; varying vec3 terrainPosition;
			varying float distanceToCamera;
			float contour(float height, float interval) {
				float level = height / interval;
				float distance = abs(fract(level + 0.5) - 0.5);
				float width = max(fwidth(level), 0.001);
				return (1.0 - smoothstep(0.2, 1.0, distance / width)) * min(1.0, 0.13 / width);
			}
			void main() {
				vec3 n = normalize(terrainNormal);
				vec3 viewDirection = normalize(cameraPosition - terrainPosition);
				vec3 lightDirection = normalize(vec3(-0.65 + sin(clock * 0.12) * 0.18, 0.9, 0.6));
				float diffuse = max(0.0, dot(n, lightDirection));
				float halfLight = max(0.0, dot(n, normalize(lightDirection + viewDirection)));
				float satin = pow(halfLight, 26.0) * 0.085 + pow(halfLight, 100.0) * 0.34;
				float altitude = smoothstep(0.1, 5.2, terrainPosition.y);
				vec3 mineral = mix(valley, base, smoothstep(0.0, 1.8, terrainPosition.y));
				mineral = mix(mineral, summit, altitude * altitude * altitude * 0.38);
				vec3 color = mineral * (0.3 * bakedLight.x + diffuse * 0.92 * bakedLight.y);
				color *= mix(0.8, 1.0, bakedLight.x);
				color += summit * satin * (0.4 + 0.6 * bakedLight.y);
				float rim = pow(1.0 - max(0.0, dot(n, viewDirection)), 3.0);
				color += summit * rim * 0.043 * smoothstep(0.2, 2.0, terrainPosition.y);
				float edgeLight = pow(max(0.0, dot(n, normalize(vec3(0.8,0.45,-0.6)))),2.0) * rim;
				color += summit * edgeLight * 0.09;
				float nearDetail = 1.0 - smoothstep(25.0, 52.0, distanceToCamera);
				float lines = max(contour(terrainPosition.y, 0.14) * mix(0.025, 0.065, nearDetail), contour(terrainPosition.y, 0.7) * mix(0.12, 0.22, nearDetail));
				color = mix(color, summit, lines * smoothstep(0.15, 0.5, terrainPosition.y));
				float localFocus = exp(-dot(terrainPosition.xz - focus, terrainPosition.xz - focus) / 16.0);
				color += summit * localFocus * focusStrength * 0.085;
				float fog = exp(-max(0.0, distanceToCamera - 22.0) * 0.02);
				color = mix(fogColor, color, fog);
				float alpha = smoothstep(0.0, 0.5, terrainPosition.y) * strength;
				gl_FragColor = vec4(color, alpha);
				#include <colorspace_fragment>
			}`,
	});
	const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
	scene.add(terrain);

	const grid = new THREE.GridHelper(52, 26, 0x7896ff, 0x7896ff);
	grid.position.y = -0.1;
	const gridMaterial = grid.material as InstanceType<
		typeof THREE.LineBasicMaterial
	>;
	gridMaterial.transparent = true;
	gridMaterial.opacity = 0.085;
	scene.add(grid);
	const markerMaterial = new THREE.MeshBasicMaterial({
		color: 0xf5ff65,
		fog: false,
	});
	const inactiveMaterial = new THREE.MeshBasicMaterial({
		color: 0xdae3ff,
		fog: false,
	});
	const routes: {
		field: FieldId;
		curve: InstanceType<typeof THREE.CatmullRomCurve3>;
		material: InstanceType<typeof THREE.MeshBasicMaterial>;
		stream: InstanceType<typeof THREE.ShaderMaterial>;
		marker: InstanceType<typeof THREE.Mesh>;
	}[] = [];
	const origin = new THREE.Vector3(0, elevation(0, 7) + 0.06, 7);
	const originMark = new THREE.Mesh(
		new THREE.CylinderGeometry(0.15, 0.15, 0.07, 24),
		markerMaterial,
	);
	originMark.position.copy(origin);
	scene.add(originMark);
	for (const field of fields) {
		const points = [];
		for (let i = 0; i <= 120; i++) {
			const t = i / 120;
			const x =
				field.x * t +
				Math.sin(t * Math.PI) *
					(field.id === "applications"
						? 2
						: field.id === "foundations"
							? -1.2
							: 1.4);
			const z = 7 + (field.z - 7) * t;
			points.push(new THREE.Vector3(x, elevation(x, z) + 0.065, z));
		}
		const curve = new THREE.CatmullRomCurve3(points);
		const material = new THREE.MeshBasicMaterial({
			color: 0xf5ff65,
			fog: false,
			transparent: true,
			opacity: 0.82,
		});
		scene.add(
			new THREE.Mesh(
				new THREE.TubeGeometry(curve, 200, 0.018, 5, false),
				material,
			),
		);
		const stream = new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			uniforms: {
				clock: { value: 0 },
				seed: { value: routes.length * 0.3 },
				strength: { value: 1 },
				color: { value: new THREE.Color(0xf5ff9b) },
			},
			vertexShader: `varying float pathPosition; void main(){ pathPosition=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
			fragmentShader: `uniform float clock; uniform float seed; uniform float strength; uniform vec3 color; varying float pathPosition; void main(){ float tail=pow(1.0-fract(pathPosition-clock*0.035-seed),22.0); gl_FragColor=vec4(color,tail*strength);\n#include <colorspace_fragment>\n}`,
		});
		scene.add(
			new THREE.Mesh(
				new THREE.TubeGeometry(curve, 120, 0.047, 6, false),
				stream,
			),
		);
		const marker = new THREE.Mesh(
			new THREE.SphereGeometry(0.06, 12, 8),
			markerMaterial,
		);
		scene.add(marker);
		routes.push({ field: field.id, curve, material, marker, stream });
		const summit = new THREE.Mesh(
			new THREE.CylinderGeometry(0.11, 0.11, 0.04, 20),
			markerMaterial,
		);
		summit.position.set(field.x, elevation(field.x, field.z) + 0.06, field.z);
		scene.add(summit);
	}
	const selected = papers.filter((paper) => paper.selected);
	const paperPositions = new Map<string, InstanceType<typeof THREE.Vector3>>();
	const paperMarkers = new Map<string, InstanceType<typeof THREE.Mesh>>();
	for (const field of fields) {
		const items = selected.filter((p) => fieldForPaper(p) === field.id);
		items.forEach((paper, index) => {
			const angle = 0.5 + index * 1.65;
			const radius = 1.5 + (index % 2) * 0.8;
			const x = field.x + Math.cos(angle) * radius,
				z = field.z + Math.sin(angle) * radius;
			const point = new THREE.Vector3(x, elevation(x, z) + 0.09, z);
			paperPositions.set(paper.id, point);
			const mark = new THREE.Mesh(
				new THREE.SphereGeometry(0.05, 12, 8),
				inactiveMaterial,
			);
			mark.position.copy(point);
			scene.add(mark);
			paperMarkers.set(paper.id, mark);
		});
	}
	const lineageGroup = new THREE.Group();
	for (const paper of selected) {
		const start = paperPositions.get(paper.lineage?.sourceId ?? ""),
			end = paperPositions.get(paper.id);
		if (!start || !end) continue;
		const middle = start.clone().lerp(end, 0.5);
		middle.y += 2.8;
		const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
		lineageGroup.add(
			new THREE.Mesh(
				new THREE.TubeGeometry(curve, 80, 0.023, 5, false),
				markerMaterial,
			),
		);
	}
	lineageGroup.visible = false;
	scene.add(lineageGroup);
	const fieldLabels = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-field-pin]"),
	);
	const paperLabels = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-paper-pin]"),
	);
	const paperPreview = root.querySelector<HTMLElement>("[data-paper-preview]")!;
	const state: WorldState = {
		phase: "overview",
		field: null,
		reading: null,
		index: false,
		light: false,
		hovered: null,
		previewPaper: null,
	};
	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	let paused = reduced.matches,
		raf = 0,
		last = 0,
		time = 0,
		disposed = false;
	let drag = 0,
		targetDrag = 0,
		dragStart = 0,
		downX = 0,
		dragging = false;
	let capturedPointer: number | null = null;
	const pointer = { x: 0, y: 0 };
	const easedPointer = { x: 0, y: 0 };
	const eye = new THREE.Vector3(19, 17, 24),
		look = new THREE.Vector3(0, 0, 0);
	const targetEye = eye.clone(),
		targetLook = look.clone();
	let offsetX = -0.19,
		offsetY = 0,
		targetOffsetX = offsetX,
		targetOffsetY = 0;
	const targetColor = new THREE.Color(0x1735d6);
	const listeners: (() => void)[] = [];
	function listen(
		target: EventTarget,
		type: string,
		handler: EventListener,
		options?: AddEventListenerOptions,
	) {
		target.addEventListener(type, handler, options);
		listeners.push(() => target.removeEventListener(type, handler, options));
	}
	const sceneFrames = {
		overview: root.querySelector<HTMLElement>('[data-scene-frame="overview"]')!,
		research: root.querySelector<HTMLElement>('[data-scene-frame="research"]')!,
	};
	let sceneCenterY = innerHeight * 0.5;
	function composeCamera() {
		if (state.phase !== "overview" && state.phase !== "research") return;
		const box = sceneFrames[state.phase].getBoundingClientRect();
		const mobile = innerWidth <= 760;
		const reader = document.querySelector<HTMLElement>("[data-atlas-reader]");
		const readingWidth =
			innerWidth - (reader?.offsetWidth ?? Math.min(760, innerWidth * 0.57));
		const width = state.reading ? readingWidth * 0.92 : box.width;
		const height = state.reading
			? innerHeight * 0.75
			: Math.min(box.height, innerHeight * 0.79);
		const centerX = state.reading ? readingWidth / 2 : box.left + box.width / 2;
		sceneCenterY =
			mobile && !state.reading ? box.top + box.height / 2 : innerHeight * 0.49;
		targetOffsetX = 0.5 - centerX / innerWidth;
		targetOffsetY = 0.5 - sceneCenterY / innerHeight;
		const direction = targetEye.clone().sub(targetLook).normalize();
		const right = new THREE.Vector3()
			.crossVectors(new THREE.Vector3(0, 1, 0), direction)
			.normalize();
		const up = new THREE.Vector3().crossVectors(direction, right).normalize();
		const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
		const tanX = ((tan * Math.max(200, width)) / innerHeight) * 0.9;
		const tanY = ((tan * Math.max(180, height)) / innerHeight) * 0.84;
		const focused = fields.find((f) => f.id === state.field);
		const subjects =
			focused && state.phase === "research" && !state.index
				? [focused]
				: fields;
		let distance = 0;
		const includePoint = (point: InstanceType<typeof THREE.Vector3>) => {
			const relative = point.sub(targetLook);
			const near = relative.dot(direction);
			distance = Math.max(
				distance,
				near + Math.abs(relative.dot(right)) / tanX,
				near + Math.abs(relative.dot(up)) / tanY,
			);
		};
		for (const subject of subjects) {
			includePoint(
				new THREE.Vector3(
					subject.x,
					elevation(subject.x, subject.z) + 1.5,
					subject.z,
				),
			);
			for (let i = 0; i < 8; i++) {
				const angle = (i * Math.PI) / 4;
				const x = subject.x + Math.cos(angle) * 3.5;
				const z = subject.z + Math.sin(angle) * 3.7;
				includePoint(new THREE.Vector3(x, elevation(x, z), z));
			}
		}
		if (!focused) includePoint(origin.clone());
		targetEye
			.copy(targetLook)
			.addScaledVector(direction, Math.max(15, distance));
	}
	function goals() {
		const field = fields.find((f) => f.id === state.field);
		const mobile = innerWidth <= 760;
		if (state.phase === "overview") {
			targetEye.set(14, 13, 24);
			targetLook.set(0, 1.2, 0.4);
			targetOffsetX = -0.21;
			targetOffsetY = 0.02;
		} else if (state.phase === "research" && field && !state.index) {
			targetLook.set(field.x, elevation(field.x, field.z) * 0.6, field.z);
			targetEye.set(field.x + 8, 9, field.z + 14);
			targetOffsetX = -0.2;
			targetOffsetY = 0;
		} else if (state.phase === "research") {
			targetEye.set(12, 16, 24);
			targetLook.set(0, 1.3, -0.7);
			targetOffsetX = -0.2;
			targetOffsetY = 0.03;
		} else if (state.phase === "journey") {
			targetEye.set(7, 27, 16);
			targetLook.set(0, 0, 2);
			targetOffsetX = -0.2;
			targetOffsetY = 0;
		} else if (state.phase === "awards") {
			targetEye.set(-13, 24, 17);
			targetLook.set(0, 0, 0);
			targetOffsetX = -0.12;
			targetOffsetY = 0;
		} else {
			targetEye.set(0, 30, 15);
			targetLook.set(0, 0, 0);
			targetOffsetX = -0.25;
			targetOffsetY = 0;
		}
		if (state.reading) {
			targetOffsetX = 0.25;
			targetEye.y += 2;
		}
		if (mobile) {
			targetOffsetX = 0;
			targetOffsetY = state.phase === "overview" ? -0.17 : 0.02;
			targetEye.y += 4;
		}
		composeCamera();
		const blue =
			state.phase === "overview" ||
			state.phase === "research" ||
			state.phase === "awards";
		targetColor.set(blue ? 0x1735d6 : state.light ? 0xf1ece2 : 0x111116);
		const highlighted = fields.find(
			(f) => f.id === (state.hovered ?? state.field),
		);
		if (highlighted)
			terrainMaterial.uniforms.focus.value.set(highlighted.x, highlighted.z);
		lineageGroup.visible =
			state.phase === "research" && !!state.field && state.field === "agents";
		for (const [id, mesh] of paperMarkers) {
			const paper = selected.find((p) => p.id === id)!;
			mesh.material =
				state.reading === id || state.previewPaper === id
					? markerMaterial
					: inactiveMaterial;
			mesh.visible =
				state.phase === "research" &&
				(!state.field || fieldForPaper(paper) === state.field);
		}
		invalidate();
	}
	function projectLabels() {
		let previewVisible = false;
		const occupied: {
			left: number;
			top: number;
			right: number;
			bottom: number;
		}[] = [];
		const active =
			(state.phase === "overview" || state.phase === "research") &&
			!state.reading &&
			!state.index &&
			innerWidth > 760;
		for (const label of fieldLabels) {
			const field = fields.find((f) => f.id === label.dataset.fieldPin)!;
			const point = new THREE.Vector3(
				field.x,
				elevation(field.x, field.z) + 0.8,
				field.z,
			).project(camera);
			const x = (point.x * 0.5 + 0.5) * innerWidth;
			let y = (-point.y * 0.5 + 0.5) * innerHeight;
			label.hidden =
				!active ||
				!!state.field ||
				point.z > 1 ||
				x < innerWidth * 0.46 ||
				x > innerWidth - 70 ||
				y < 100 ||
				y > innerHeight - 100;
			if (!label.hidden) {
				const width = label.offsetWidth,
					height = label.offsetHeight;
				const left = x - width / 2,
					right = x + width / 2;
				for (const previous of occupied) {
					if (
						left < previous.right + 12 &&
						right > previous.left - 12 &&
						y > previous.top - 12 &&
						y - height < previous.bottom + 12
					)
						y = previous.bottom + height + 12;
				}
				occupied.push({ left, right, top: y - height, bottom: y });
			}
			label.style.left = `${x}px`;
			label.style.top = `${y}px`;
		}
		for (const label of paperLabels) {
			const paper = selected.find((p) => p.id === label.dataset.paperPin)!;
			const point = paperPositions.get(paper.id)!.clone().project(camera);
			const x = (point.x * 0.5 + 0.5) * innerWidth,
				y = (-point.y * 0.5 + 0.5) * innerHeight;
			label.hidden =
				!active ||
				state.phase !== "research" ||
				!state.field ||
				fieldForPaper(paper) !== state.field ||
				x < innerWidth * 0.44 ||
				x > innerWidth - 40 ||
				y < 100 ||
				y > innerHeight - 75 ||
				point.z > 1;
			label.style.left = `${x}px`;
			label.style.top = `${y}px`;
			if (!label.hidden && state.previewPaper === paper.id) {
				previewVisible = true;
				paperPreview.hidden = false;
				const width = paperPreview.offsetWidth,
					height = paperPreview.offsetHeight;
				let left = x + 26;
				if (left + width > innerWidth - 40) left = x - width - 26;
				left = Math.max(
					innerWidth * 0.43,
					Math.min(innerWidth - width - 32, left),
				);
				const top = Math.max(
					80,
					Math.min(innerHeight - height - 80, y - height / 2),
				);
				paperPreview.style.left = `${left}px`;
				paperPreview.style.top = `${top}px`;
			}
		}
		paperPreview.hidden = !previewVisible;
	}
	let lastInspection = 0;
	let hasRendered = false;
	let nextFrameAt = 0;
	let renderCount = 0;
	const inspect = new URLSearchParams(location.search).has("inspect");
	function frame(now: number) {
		if (disposed) return;
		raf = 0;
		if (now < nextFrameAt) {
			raf = requestAnimationFrame(frame);
			return;
		}
		const dt = Math.max(0, Math.min((now - last) / 1000 || 1 / 60, 0.05));
		last = now;
		const ambientMotion = needsAmbientFrames(state, paused);
		if (ambientMotion) time += dt;
		if (
			innerWidth <= 760 &&
			!state.reading &&
			(state.phase === "overview" || state.phase === "research")
		) {
			const box = sceneFrames[state.phase].getBoundingClientRect();
			sceneCenterY = box.top + box.height / 2;
			targetOffsetY = 0.5 - sceneCenterY / innerHeight;
		}
		const blend = !hasRendered || reduced.matches ? 1 : 1 - Math.exp(-dt * 4.2);
		const inputBlend =
			!hasRendered || reduced.matches ? 1 : 1 - Math.exp(-dt * 11);
		const pointerX = ambientMotion ? pointer.x : 0;
		const pointerY = ambientMotion ? pointer.y : 0;
		drag = THREE.MathUtils.lerp(drag, targetDrag, inputBlend);
		easedPointer.x = THREE.MathUtils.lerp(easedPointer.x, pointerX, inputBlend);
		easedPointer.y = THREE.MathUtils.lerp(easedPointer.y, pointerY, inputBlend);
		eye.lerp(targetEye, blend);
		look.lerp(targetLook, blend);
		offsetX = THREE.MathUtils.lerp(offsetX, targetOffsetX, blend);
		offsetY = THREE.MathUtils.lerp(offsetY, targetOffsetY, blend);
		const relative = eye.clone().sub(look);
		relative.applyAxisAngle(
			new THREE.Vector3(0, 1, 0),
			drag + easedPointer.x * 0.035,
		);
		camera.position.copy(look).add(relative);
		camera.position.y += easedPointer.y * 0.2;
		camera.lookAt(look);
		camera.setViewOffset(
			innerWidth,
			innerHeight,
			innerWidth * offsetX,
			innerHeight * offsetY,
			innerWidth,
			innerHeight,
		);
		background.lerp(targetColor, blend);
		scene.fog!.color.copy(background);
		const blue =
			state.phase === "overview" ||
			state.phase === "research" ||
			state.phase === "awards";
		terrainMaterial.uniforms.strength.value = THREE.MathUtils.lerp(
			terrainMaterial.uniforms.strength.value,
			blue ? 1 : 0,
			blend,
		);
		terrainMaterial.uniforms.clock.value = time;
		terrainMaterial.uniforms.focusStrength.value = THREE.MathUtils.lerp(
			terrainMaterial.uniforms.focusStrength.value,
			state.hovered || state.field ? 1 : 0,
			blend,
		);
		gridMaterial.opacity = blue ? 0.085 : 0;
		originMark.visible = blue;
		markerMaterial.visible = blue;
		routes.forEach((route, index) => {
			const active = state.hovered ?? state.field;
			route.material.opacity = blue
				? !active || active === route.field
					? 0.55
					: 0.12
				: 0;
			route.stream.uniforms.clock.value = time;
			route.stream.uniforms.strength.value =
				blue && !state.index
					? !active || active === route.field
						? 1
						: 0.18
					: 0;
			route.marker.position.copy(
				route.curve.getPointAt((time * 0.035 + index * 0.3) % 1),
			);
			route.marker.visible = blue && !state.index;
		});
		let markersSettling = false;
		for (const [id, marker] of paperMarkers) {
			const size = state.previewPaper === id || state.reading === id ? 1.9 : 1;
			marker.scale.setScalar(
				THREE.MathUtils.lerp(marker.scale.x, size, inputBlend),
			);
			markersSettling ||= Math.abs(marker.scale.x - size) > 0.003;
		}
		renderer.render(scene, camera);
		renderCount++;
		if (inspect) root.dataset.renderCount = String(renderCount);
		hasRendered = true;
		projectLabels();
		if (lastInspection === 0 || now - lastInspection > 900) {
			lastInspection = now;
			root.dataset.camera = JSON.stringify(
				camera.position.toArray().map((n) => Math.round(n * 100) / 100),
			);
			if (inspect) {
				const gl = renderer.getContext(),
					pixels = new Uint8Array(
						gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
					);
				gl.readPixels(
					0,
					0,
					gl.drawingBufferWidth,
					gl.drawingBufferHeight,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					pixels,
				);
				const colors = new Set<number>();
				let hash = 0,
					yellow = 0;
				for (let i = 0; i < pixels.length; i += 64) {
					colors.add((pixels[i] << 16) + (pixels[i + 1] << 8) + pixels[i + 2]);
					hash =
						(Math.imul(hash, 31) +
							pixels[i] +
							pixels[i + 1] * 3 +
							pixels[i + 2] * 7) >>>
						0;
					if (pixels[i] > 130 && pixels[i + 1] > 140 && pixels[i + 2] < 160)
						yellow++;
				}
				root.dataset.pixelCheck = JSON.stringify({
					colors: colors.size,
					hash,
					yellow,
				});
			}
		}
		root.dataset.sceneReady = "true";
		const settling =
			markersSettling ||
			Math.abs(drag - targetDrag) > 0.0001 ||
			Math.abs(easedPointer.x - pointerX) > 0.0001 ||
			Math.abs(easedPointer.y - pointerY) > 0.0001 ||
			Math.abs(
				terrainMaterial.uniforms.focusStrength.value -
					(state.hovered || state.field ? 1 : 0),
			) > 0.003 ||
			eye.distanceToSquared(targetEye) > 0.0001 ||
			look.distanceToSquared(targetLook) > 0.0001 ||
			Math.abs(offsetX - targetOffsetX) > 0.0001 ||
			Math.abs(offsetY - targetOffsetY) > 0.0001 ||
			Math.abs(background.r - targetColor.r) +
				Math.abs(background.g - targetColor.g) +
				Math.abs(background.b - targetColor.b) >
				0.001;
		root.dataset.sceneActivity = settling
			? "settling"
			: ambientMotion
				? "ambient"
				: "rest";
		if (!document.hidden && (ambientMotion || settling)) {
			nextFrameAt = now + (settling ? 0 : 1000 / 30 - 0.5);
			raf = requestAnimationFrame(frame);
		}
	}
	function invalidate() {
		nextFrameAt = 0;
		if (!raf && !document.hidden && !disposed) {
			last = performance.now();
			raf = requestAnimationFrame(frame);
		}
	}
	function resize() {
		renderer.setSize(innerWidth, innerHeight);
		renderer.setPixelRatio(
			Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.65),
		);
		camera.aspect = innerWidth / innerHeight;
		camera.updateProjectionMatrix();
		goals();
	}
	listen(window, "resize", resize);
	void document.fonts.ready.then(() => {
		if (!disposed) resize();
	});
	listen(
		window,
		"scroll",
		() => {
			if (innerWidth <= 760 && canExploreScene(state)) invalidate();
		},
		{ passive: true },
	);
	listen(document, "visibilitychange", () => {
		if (document.hidden) {
			cancelAnimationFrame(raf);
			raf = 0;
		} else invalidate();
	});
	listen(root, "pointermove", ((event: PointerEvent) => {
		if (
			event.pointerType === "touch" ||
			!canExploreScene(state) ||
			(paused && !dragging)
		)
			return;
		if (!reduced.matches) {
			pointer.x = event.clientX / innerWidth - 0.5;
			pointer.y = event.clientY / innerHeight - 0.5;
		}
		if (dragging)
			targetDrag = Math.max(
				-0.35,
				Math.min(0.35, dragStart + (event.clientX - downX) * 0.002),
			);
		invalidate();
	}) as EventListener);
	listen(root, "pointerdown", ((event: PointerEvent) => {
		if (
			state.phase !== "research" ||
			state.index ||
			innerWidth <= 760 ||
			event.button !== 0 ||
			event.pointerType === "touch" ||
			!(event.target as Element).closest(".research-map-space")
		)
			return;
		dragging = true;
		downX = event.clientX;
		dragStart = targetDrag;
		capturedPointer = event.pointerId;
		root.setPointerCapture(event.pointerId);
		root.dataset.dragging = "true";
	}) as EventListener);
	function endDrag() {
		dragging = false;
		delete root.dataset.dragging;
		const id = capturedPointer;
		capturedPointer = null;
		if (id !== null && root.hasPointerCapture(id))
			root.releasePointerCapture(id);
	}
	listen(window, "pointerup", endDrag);
	listen(window, "pointercancel", endDrag);
	listen(root, "lostpointercapture", endDrag);
	listen(root, "pointerleave", () => {
		if (!dragging) {
			pointer.x = 0;
			pointer.y = 0;
			invalidate();
		}
	});
	listen(window, "blur", () => {
		endDrag();
		pointer.x = 0;
		pointer.y = 0;
		invalidate();
	});
	listen(reduced, "change", () => {
		paused = reduced.matches;
		invalidate();
	});
	listen(renderer.domElement, "webglcontextlost", (event) => {
		event.preventDefault();
		cancelAnimationFrame(raf);
		raf = 0;
		root.dataset.sceneReady = "fallback";
	});
	listen(renderer.domElement, "webglcontextrestored", () => {
		hasRendered = false;
		resize();
	});
	resize();
	goals();
	return {
		setState(next) {
			if (
				(next.phase !== undefined && next.phase !== state.phase) ||
				(next.field !== undefined && next.field !== state.field) ||
				(next.reading !== undefined && next.reading !== state.reading)
			) {
				targetDrag = 0;
				pointer.x = 0;
				pointer.y = 0;
				endDrag();
			}
			Object.assign(state, next);
			goals();
		},
		reset() {
			targetDrag = 0;
			pointer.x = 0;
			pointer.y = 0;
			goals();
		},
		pause(value) {
			paused = value;
			invalidate();
		},
		dispose() {
			disposed = true;
			cancelAnimationFrame(raf);
			for (const remove of listeners) remove();
			scene.traverse((object) => {
				if ("geometry" in object)
					(
						object.geometry as InstanceType<typeof THREE.BufferGeometry>
					).dispose();
				if ("material" in object) {
					const materials = Array.isArray(object.material)
						? object.material
						: [object.material];
					for (const material of materials) material.dispose();
				}
			});
			renderer.dispose();
			renderer.domElement.remove();
		},
	};
}
