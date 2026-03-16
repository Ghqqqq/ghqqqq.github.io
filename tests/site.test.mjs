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
	assert.match(html, /data-theme="dark"/);
	assert.match(html, /id="theme-toggle"/);
	assert.match(html, /ShanghaiTech University/);
	assert.match(html, /research-interest-heading-icon/);
	assert.match(
		html,
		/Research Interests[\s\S]*Agentic RL[\s\S]*MLLMs[\s\S]*Reinforcement Learning[\s\S]*LLM Alignment/,
	);
	assert.match(html, /Reinforcement Learning/);
	assert.match(html, /LLM Alignment/);
	assert.match(html, /Research Interests/);
	assert.match(html, /href="https:\/\/www\.shanghaitech\.edu\.cn\/"/);
	assert.match(html, /href="https:\/\/liuxincell\.github\.io\/"/);
	assert.match(html, /href="https:\/\/junwei-pan\.github\.io\/"/);
	assert.match(
		html,
		/research lies at the intersection of reinforcement learning and bandits/i,
	);
	assert.match(
		html,
		/Tencent Rhino-Bird Elite Talent Program, where I worked on the intersection of reinforcement learning and recommender systems under the guidance of/i,
	);
	assert.match(
		html,
		/agentic LLMs[\s\S]*multimodal large models[\s\S]*embodied intelligence/i,
	);
	assert.match(
		html,
		/About me[\s\S]*Experience[\s\S]*Awards[\s\S]*Academic Service(?:\s*&amp;\s*|\s*&\s*)Teaching[\s\S]*Selected Publications[\s\S]*Projects/,
	);
	assert.match(html, /guohq \(at\) shanghaitech\.edu\.cn/);
	assert.match(html, /guohq46 \(at\) qq\.com/);
	assert.match(
		html,
		/href="https:\/\/scholar\.google\.com\/citations\?user=8bGinucAAAAJ/,
	);
	assert.match(html, /National Scholarship for Doctoral Students/);
	assert.match(html, /Tencent Rhino-Bird Elite Talent Program/);
	assert.match(html, /RLChina 2022/);
	assert.match(html, /href="\/projects\/block"/);
	assert.match(html, /Research Intern/);
	assert.match(html, /2025\.06 - 2026\.02/);
	assert.match(
		html,
		/Experience[\s\S]*Studying reinforcement learning for recommendation and bidding\.[\s\S]*Outcomes:[\s\S]*Towards Safe and Optimal Online Bidding[\s\S]*ICLR 2026, accepted[\s\S]*GRB[\s\S]*submitted to KDD[\s\S]*Towards Temporal Interest Modeling[\s\S]*submitted to ICML/i,
	);
	assert.match(
		html,
		/Tencent CDG \(Tencent Rhino-Bird Elite Talent Program\)/,
	);
	assert.match(html, /Hengquan Guo[\s\S]*ShanghaiTech University[\s\S]*Google Scholar/);
	assert.doesNotMatch(html, /GitHub \(Coming soon\)/);
	assert.doesNotMatch(html, /CV \(Coming soon\)/);
	assert.doesNotMatch(html, /<h3[^>]*>\s*Links\s*<\/h3>/);
	assert.doesNotMatch(html, /mailto:/);
	assert.doesNotMatch(html, /tel:/);
	assert.doesNotMatch(html, /PhD Researcher/);
	assert.doesNotMatch(html, /Xiangtan University/);
	assert.doesNotMatch(html, /Latest Posts/);
	assert.doesNotMatch(html, /Work Experience/);
	assert.doesNotMatch(html, /Made in Germany/);
	assert.doesNotMatch(html, /Project Placeholder/);
});

test("publications route and homepage navigation expose full publications", async () => {
	const publicationsHtml = await readBuilt("publications/index.html");
	const homepageHtml = await readBuilt("index.html");
	const projectsHtml = await readBuilt("projects/index.html");
	const blockProjectHtml = await readBuilt("projects/block/index.html");

	assert.ok(publicationsHtml, "expected built publications index");
	assert.match(publicationsHtml, /Full Publications|Publications/);
	assert.match(publicationsHtml, /full-publications-list/);
	assert.doesNotMatch(publicationsHtml, /class="publication-cover"/);
	assert.match(
		publicationsHtml,
		/Triple-Optimistic Learning|Online convex optimization with hard constraints/i,
	);
	assert.match(
		publicationsHtml,
		/POBO: Safe and Optimal Resource Management for Cloud Microservices/,
	);
	assert.match(
		publicationsHtml,
		/SABO: Safe and Aggressive Bayesian Optimization for Automatic Legged Locomotion Controller Tuning/,
	);
	assert.match(publicationsHtml, /Submitted|Preprint|ArXiv|Journal/);

	assert.ok(homepageHtml, "expected built homepage HTML");
	assert.match(homepageHtml, /href="\/publications"/);
	assert.match(homepageHtml, />Full Publications</);
	assert.ok(projectsHtml, "expected built projects index");
	assert.match(projectsHtml, /BLOCK/);
	assert.doesNotMatch(projectsHtml, /Project Placeholder/);
	assert.ok(blockProjectHtml, "expected built BLOCK project page");
	assert.match(
		blockProjectHtml,
		/I[’']m iterating and working on generating Minecraft skins end-to-end\. If you are also interested, feel free to contact me\./,
	);
});

test("homepage groups selected publications by research area with real venue badges", async () => {
	const html = await readBuilt("index.html");

	assert.ok(html, "expected built homepage HTML");
	assert.match(
		html,
		/Agent \/ LLM Alignment[\s\S]*Recommendation(?:\s*&amp;\s*|\s*&\s*)Bidding[\s\S]*Reinforcement Learning(?:\s*&amp;\s*|\s*&\s*)Bandits/,
	);
	assert.match(
		html,
		/Enhancing Safety in Reinforcement Learning with Human Feedback via Rectified Policy Optimization/,
	);
	assert.match(
		html,
		/Towards Safe and Optimal Online Bidding: A Modular Look-ahead Lyapunov Framework/,
	);
	assert.match(
		html,
		/BLOCK: An Open-Source Bi-Stage MLLM Character-to-Skin Pipeline/,
	);
	assert.match(
		html,
		/Towards Temporal Interest Modeling in Recommendation via Reinforcement Learning/,
	);
	assert.match(
		html,
		/GRB: A Generative Reinforcement Bidding Framework for Multi-Channel Online Advertising/,
	);
	assert.match(html, /Hengquan Guo\*/);
	assert.match(html, /equal contribution/);
	assert.match(
		html,
		/Triple-Optimistic Learning for Stochastic Contextual Bandits with General Constraints/,
	);
	assert.match(html, /publication-badge[^>]*>\s*NeurIPS\s*</);
	assert.match(html, /publication-badge[^>]*>\s*ICLR\s*</);
	assert.match(html, /publication-badge[^>]*>\s*ICML\s*</);
	assert.match(html, /publication-badge[^>]*>\s*COLT\s*</);
});

test("homepage shell exposes the refreshed avatar and theme toggle", async () => {
	const html = await readBuilt("index.html");

	assert.ok(html, "expected built homepage HTML");
	assert.match(html, /profile-bird-original/);
	assert.match(html, /theme-toggle/);
	assert.match(html, /data-avatar-parallax/);
	assert.match(html, /href="\/favicon-bird\.png"/);
	assert.match(html, /rel="shortcut icon"/);
	assert.match(html, /awards-text-list/);
	assert.match(html, /awards-text-main/);
	assert.match(html, /service-text-list/);
	assert.match(html, /service-text-heading/);
	assert.match(html, /service-text-kind/);
	assert.doesNotMatch(html, /brand-bird-icon|brand-bird-mark/);
	assert.doesNotMatch(html, /darkThemeColor|lightThemeColor/);
	assert.doesNotMatch(html, /award-entry/);
});
