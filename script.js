const GH_USER = "subu53";

/**
 * Put your strongest recruiter-facing repos here.
 * These should match exact GitHub repo names.
 */
const FEATURED_REPOS = [
  "portfolio_v3",
  "portfolio_v2",
  "dataorg-financial-health-prediction",
  "portfolio_v1"
];

const state = {
  all: [],
  featured: [],
};

function $(id) {
  return document.getElementById(id);
}

function safeSetText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  } catch {
    return "—";
  }
}

function guessTag(repo) {
  const text = `${repo.name || ""} ${repo.description || ""}`.toLowerCase();

  if (
    text.includes("dashboard") ||
    text.includes("tableau") ||
    text.includes("power bi") ||
    text.includes("powerbi") ||
    text.includes("excel") ||
    text.includes("sql")
  ) {
    return "Analytics";
  }

  if (
    text.includes("forecast") ||
    text.includes("time series") ||
    text.includes("price")
  ) {
    return "Forecasting";
  }

  if (
    text.includes("credit") ||
    text.includes("loan") ||
    text.includes("risk")
  ) {
    return "Risk / Scoring";
  }

  if (
    text.includes("sentiment") ||
    text.includes("nlp") ||
    text.includes("bert") ||
    text.includes("transformer") ||
    text.includes("text")
  ) {
    return "NLP / AI";
  }

  if (
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("lung") ||
    text.includes("diagnostic")
  ) {
    return "Healthcare AI";
  }

  if (
    text.includes("recommend") ||
    text.includes("basket") ||
    text.includes("association")
  ) {
    return "Recommendation";
  }

  if (
    text.includes("portfolio") ||
    text.includes("website")
  ) {
    return "Portfolio";
  }

  return "Data Science / ML";
}

function repoCard(repo, { featured = false } = {}) {
  const description = repo.description
    ? escapeHtml(repo.description)
    : "Applied data project with reproducible code and practical problem-solving.";

  const tag = guessTag(repo);
  const language = repo.language || "Not specified";
  const updated = fmtDate(repo.updated_at);
  const stars = repo.stargazers_count ?? 0;

  return `
    <article class="rounded-2xl border ${
      featured ? "border-accent/20" : "border-primary/15"
    } bg-card-dark p-6 hover:-translate-y-1 transition-all duration-300">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          ${
            featured
              ? `<span class="inline-flex px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-wider mb-3">Featured</span>`
              : ""
          }
          <h3 class="text-xl font-bold text-slate-100 break-words">${escapeHtml(repo.name)}</h3>
        </div>
        <span class="shrink-0 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
          ★ ${stars}
        </span>
      </div>

      <p class="text-slate-400 text-sm leading-relaxed mb-5">
        ${description}
      </p>

      <div class="flex flex-wrap gap-2 mb-5">
        <span class="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">${escapeHtml(tag)}</span>
        <span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">${escapeHtml(language)}</span>
        <span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">Updated ${updated}</span>
      </div>

      <div class="flex flex-wrap gap-3">
        <a
          href="${repo.html_url}"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-all"
        >
          View Code
        </a>
        ${
          repo.homepage
            ? `
        <a
          href="${repo.homepage}"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all"
        >
          Live Demo
        </a>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderFeatured() {
  const container = $("dynamic-featured-projects");
  if (!container) return;

  if (!state.featured.length) {
    container.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-card-dark p-6 text-slate-400">
        No featured repositories found yet. Update FEATURED_REPOS in script.js.
      </div>
    `;
    safeSetText("featured-count", "0");
    return;
  }

  container.innerHTML = state.featured
    .map((repo) => repoCard(repo, { featured: true }))
    .join("");

  safeSetText("featured-count", String(state.featured.length));
}

function renderRepoGrid(limit = 6) {
  const container = $("github-project-grid");
  if (!container) return;

  const repos = [...state.all]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, limit);

  if (!repos.length) {
    container.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-card-dark p-6 text-slate-400">
        No repositories available right now.
      </div>
    `;
    return;
  }

  container.innerHTML = repos.map((repo) => repoCard(repo)).join("");
}

async function fetchAllRepos() {
  safeSetText("project-status", "Loading projects from GitHub...");

  const url = `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("GitHub API error");
  }

  const repos = await response.json();

  const clean = repos
    .filter((repo) => !repo.fork && !repo.archived)
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      homepage: repo.homepage
    }));

  state.all = clean;

  const featuredSet = new Set(FEATURED_REPOS);
  state.featured = FEATURED_REPOS
    .map((name) => clean.find((repo) => repo.name === name))
    .filter(Boolean);

  safeSetText("repo-count", String(clean.length));

  const mostRecent = [...clean].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  )[0];

  safeSetText(
    "last-updated",
    mostRecent ? `${mostRecent.name} (${fmtDate(mostRecent.updated_at)})` : "—"
  );

  renderFeatured();
  renderRepoGrid(6);
  safeSetText("project-status", "");
}

document.addEventListener("DOMContentLoaded", () => {
  safeSetText("featured-count", "0");

  fetchAllRepos().catch((error) => {
    console.error(error);
    safeSetText(
      "project-status",
      "Could not load GitHub repositories right now. This may be a temporary GitHub API rate limit."
    );
  });
});
