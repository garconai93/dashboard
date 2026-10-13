(function () {
  const state = { projects: [], query: "", filter: "all" };

  const grid = document.getElementById("project-grid");
  const liveRegion = document.getElementById("project-count");
  const searchInput = document.getElementById("project-search");
  const buttons = Array.from(document.querySelectorAll("[data-filter]"));
  const stateStats = {
    total: document.querySelector('[data-stat="total"]'),
    active: document.querySelector('[data-stat="active"]'),
    android: document.querySelector('[data-stat="android"]'),
    money: document.querySelector('[data-stat="money"]')
  };
  const loading = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");

  function normalize(value) {
    return (value ?? "").toString().toLowerCase().trim();
  }

  function formatLabel(value) {
    if (!value) return "";
    return value.split(/[ _-]| /).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function buildMetaItem(label, value) {
    const wrapper = document.createElement("div");
    wrapper.className = "meta-item";
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value || " nespecificat";
    wrapper.append(term, detail);
    return wrapper;
  }

  function buildCard(project) {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.status = normalize(project.status);
    card.dataset.android = String(Boolean(project.android));
    card.dataset.money = String(Boolean(project.money));

    const head = document.createElement("header");
    head.className = "card-head";
    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = project.name || "Proiect";
    head.append(title);

    const description = document.createElement("p");
    description.className = "card-desc";
    description.textContent = project.description || "";

    const meta = document.createElement("dl");
    meta.className = "card-meta";
    meta.append(
      buildMetaItem("Host", project.host || ""),
      buildMetaItem("Stage", project.stage || ""),
      buildMetaItem("Agents", String(project.agents ?? 0)),
      buildMetaItem("Last update", project.lastUpdate || "")
    );

    const features = document.createElement("div");
    features.className = "feature-list";
    features.append(
      createFeatureBadge(project.money ? "Produce bani" : "Nu produce bani", project.money ? "active" : "inactive"),
      createFeatureBadge(project.android ? "Are Android" : "Fără Android", project.android ? "active" : "inactive")
    );

    const actions = document.createElement("div");
    actions.className = "card-actions";
    if (project.url) actions.append(createLink(project.url, "Deschide site", "primary"));
    if (project.github) actions.append(createLink(project.github, "GitHub"));
    if (project.apk) actions.append(createLink(project.apk, "APK"));

    card.append(head, description, meta, features, actions);
    return card;
  }

  function createFeatureBadge(text, variant) {
    const badge = document.createElement("span");
    badge.className = `feature-badge is-${variant}`;
    badge.textContent = text;
    return badge;
  }

  function createLink(href, text, variant = "") {
    const link = document.createElement("a");
    link.className = `link-btn${variant ? " " + variant : ""}`;
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = text;
    return link;
  }

  function updateStats() {
    stateStats.total.textContent = String(state.projects.length);
    stateStats.active.textContent = String(state.projects.filter(project => normalize(project.status) === "activ").length);
    stateStats.android.textContent = String(state.projects.filter(project => project.android).length);
    stateStats.money.textContent = String(state.projects.filter(project => project.money).length);
  }

  function matches(project) {
    if (state.filter === "android" && !project.android) return false;
    if (state.filter === "money" && !project.money) return false;
    if (state.filter === "inactive" && normalize(project.status) !== "inactiv") return false;
    if (!state.query) return true;
    return normalize(project.name).includes(state.query)
      || normalize(project.description).includes(state.query)
      || normalize(project.stage).includes(state.query)
      || normalize(project.host).includes(state.query);
  }

  function render() {
    const filtered = state.projects.filter(matches);
    grid.replaceChildren();
    filtered.forEach(project => grid.append(buildCard(project)));
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Nu există proiecte pentru filtrul selectat.";
      grid.append(empty);
    }
    liveRegion.textContent = `Rezultate: ${filtered.length}`;
  }

  async function loadData() {
    try {
      errorState.classList.add("hidden");
      loading.classList.remove("hidden");
      const response = await fetch("../../projects.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      state.projects = Array.isArray(data) ? data : [];
      state.projects.sort((a, b) => (b.lastUpdate ?? "").localeCompare(a.lastUpdate ?? ""));
      updateStats();
      render();
    } catch (error) {
      console.error("Dashboard preview load error:", error);
      grid.replaceChildren();
      errorState.classList.remove("hidden");
      liveRegion.textContent = "Nu s-au putut încărca datele.";
    } finally {
      loading.classList.add("hidden");
    }
  }

  searchInput.addEventListener("input", event => {
    state.query = normalize(event.target.value);
    render();
  });

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      state.filter = button.dataset.filter;
      render();
    });
  });

  loadData();
}());