import type { Phase } from "./atlas-data";

type SceneState = { phase: Phase; index: boolean; reading: string | null };

export const canExploreScene = (state: SceneState) =>
	(state.phase === "overview" || state.phase === "research") &&
	!state.index &&
	!state.reading;

export const needsAmbientFrames = (state: SceneState, paused: boolean) =>
	canExploreScene(state) && !paused;
