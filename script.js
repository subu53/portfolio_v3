const GH_USER = "subu53";

/**
 * Pin “featured” repos here (exact repo names).
 * Put your BEST recruiter projects here.
 */
const FEATURED_REPOS = [
  "portfolio_v3",
  "portfolio_v2",
  "dataorg-financial-health-prediction",
  "portfolio_v1"
];

const state = {
  all: [],
  visible: [],
  featured: [],
};

const $ = (id) => document.getElementById(id);

function escapeHtml(s){
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function fmtDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }catch{
    return "—";
  }
}

function repoCard(repo, { featured=false } = {}){
  const desc = repo.description ? escapeHtml(repo.description) : "Data / ML project with reproducible code and results.";
  const lang = repo.language || "—";
  const stars = repo.stargazers_count ?? 0;
  const forks = repo.forks_count ?? 0;
  const updated = fmtDate(repo.updated_at);

  // “Topic-like” label derived from name/description (simple heuristic)
  const tag = guessTag(repo);

  return `
    <div class="proj">
      <div class="projTop">
        <div>
          ${featured ? `<span class="featuredTag">★ Featured</span>` : ``}
          <h4>${escapeHtml(repo.name)}</h4>
        </div>
        <span class="badge">${stars} ★</span>
      </div>

      <p>${desc}</p>

      <div class="meta">
        <span class="badge">Tag: ${escapeHtml(tag)}</span>
        <span class="badge">Lang: ${escapeHtml(lang)}</span>
        <span class="badge">Forks: ${forks}</span>
        <span class="badge">Updated: ${updated}</span>
      </div>

      <div class="actions">
        <a href="${repo.html_url}" target="_blank" rel="noreferrer">View Code</a>
        ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noreferrer">Live</a>` : ""}
      </div>
    </div>
  `;
}

function guessTag(repo){
  const text = `${repo.name || ""} ${repo.description || ""}`.toLowerCase();

  if (text.includes("dashboard") || text.includes("tableau") || text.includes("powerbi") || text.includes("bi")) return "Analytics / Dashboard";
  if (text.includes("forecast") || text.includes("time series") || text.includes("ts")) return "Forecasting";
  if (text.includes("credit") || text.includes("loan") || text.includes("risk")) return "Credit Scoring";
  if (text.includes("sentiment") || text.includes("nlp") || text.includes("bert") || text.includes("text")) return "NLP / Sentiment";
  if (text.includes("price") || text.includes("pricing") || text.includes("revenue")) return "Pricing / Revenue";
  if (text.includes("recommend") || text.includes("basket") || text.includes("association")) return "Recommendation / Basket";
  if (text.includes("health") || text.includes("medical") || text.includes("lung") || text.includes("dicom")) return "Healthcare AI";
  return "Data Science / ML";
}

function renderFeatured(){
  const container = $("featured-container");
  const status = $("featured-status");
  container.innerHTML = "";

  if (!state.featured.length){
    status.textContent = "No featured repos found yet. Add repo names in FEATURED_REPOS inside script.js.";
    return;
  }

  status.textContent = "";
  container.innerHTML = state.featured.map(r => repoCard(r, { featured:true })).join("");
  $("featured-count").textContent = String(state.featured.length);
}

function renderAll(){
  const container = $("project-container");
  const status = $("project-status");

  container.innerHTML = "";
  if (!state.visible.length){
    status.textContent = "No matching projects. Try a different search or filter.";
    return;
  }

  status.textContent = "";
  container.innerHTML = state.visible.map(r => repoCard(r)).join("");
}

function populateLanguageFilter(repos){
  const langs = new Set();
  repos.forEach(r => { if (r.language) langs.add(r.language); });

  const langSelect = $("langSelect");
  const current = langSelect.value;

  const sorted = Array.from(langs).sort((a,b) => a.localeCompare(b));
  langSelect.innerHTML = `<option value="all">Language: All</option>` + sorted.map(l => (
    `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`
  )).join("");

  // restore if possible
  if ([...langSelect.options].some(o => o.value === current)) {
    langSelect.value = current;
  }
}

function applyFilters(){
  const q = ($("projectSearch").value || "").toLowerCase().trim();
  const sort = $("sortSelect").value;
  const lang = $("langSelect").value;

  let repos = [...state.all];

  // language filter
  if (lang !== "all"){
    repos = repos.filter(r => (r.language || "") === lang);
  }

  // search filter
  if (q){
    repos = repos.filter(r =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.language || "").toLowerCase().includes(q)
    );
  }

  // sorting
  if (sort === "stars"){
    repos.sort((a,b) => (b.stargazers_count||0) - (a.stargazers_count||0));
  } else if (sort === "name"){
    repos.sort((a,b) => (a.name||"").localeCompare(b.name||""));
  } else {
    repos.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  state.visible = repos;
  renderAll();
}

async function fetchAllRepos(){
  $("project-status").textContent = "Loading projects from GitHub…";

  const url = `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("GitHub API error");

  const repos = await res.json();

  // clean: remove forks + archived
  const clean = repos
    .filter(r => !r.fork && !r.archived)
    .map(r => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      updated_at: r.updated_at,
      html_url: r.html_url,
      homepage: r.homepage
    }));

  // stats
  $("repo-count").textContent = String(clean.length);
  const mostRecent = clean.slice().sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
  $("last-updated").textContent = mostRecent ? `${mostRecent.name} (${fmtDate(mostRecent.updated_at)})` : "—";

  state.all = clean;

  // featured selection
  const featuredSet = new Set(FEATURED_REPOS);
  state.featured = clean.filter(r => featuredSet.has(r.name));

  // default visible: show all sorted by updated
  state.visible = clean.slice().sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));

  populateLanguageFilter(state.all);
  renderFeatured();
  applyFilters();

  $("project-status").textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
  $("year").textContent = String(new Date().getFullYear());

  $("projectSearch").addEventListener("input", applyFilters);
  $("sortSelect").addEventListener("change", applyFilters);
  $("langSelect").addEventListener("change", applyFilters);

  // metric init
  $("featured-count").textContent = "0";

  fetchAllRepos().catch(() => {
    $("project-status").textContent = "Could not load GitHub repos (API rate limit). Refresh after a minute.";
    $("featured-status").textContent = "Featured repos could not load due to GitHub API limit. Refresh later.";
  });
});
