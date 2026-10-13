(function () {
  const state = {
    projects: [],
    query: "",
    filter: "all"
  };

  const grid = document.querySelector("#project-grid");
  const liveRegion = document.querySelector("#project-count");
  const searchInput = document.querySelector("#project-search");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const statTotal = document.querySelector('[data-stat="total"]');
  const statActive = document.querySelector('[data-stat="active"]');
  const statAndroid = document.querySelector('[data-stat="android"]');
  const statMoney = document.querySelector('[data-stat="money"]');
  const loadingState = document.querySelector("#loading-state");
  const errorState = document.querySelector("#error-state");
  const emptyState = document.createElement("div");

  emptyState.className = "empty-state";
  emptyState.textContent = "Nu s-au găsit proiecte pentru criteriile actuale.";
  emptyState.id = "empty-state";
  emptyState.setAttribute("role", "status");

  function normalize(value) {
    return (value ?? "").toString().toLowerCase().trim();
  }

  function formatLabel(value) {
    if (!value) return " nespecificat";
    return value.split(/[_-]| /).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function buildMetaItem(label, value) {
    const wrap = document.createElement("div");
    wrap.className = "meta-item";
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrap.append(dt, dd);
    return wrap;
  }

  function buildMeta(rows, project) {
    rows.forEach(row => {
      const label = row.label;
      let value = "";
      if (row.path === "host") value = project.host || " nespecificat";
      if (row.path === "stage") value = project.stage || " nespecificat";
      if (row.path === "agents") value = String(project.agents ?? 0);
      if (row.path === "lastUpdate") value = project.lastUpdate || " nespecificat";
      if (row.path === "status") value = formatLabel(project.status || "");
      rows.push();
    });
    return rows;
  }

  function createMeta(project) {
    const dl = document.createElement("dl");
    dl.className = "card-meta";
    const rows = [
      ["Host", project.host || ""],
      ["Stage", project.stage || ""],
      ["Agents", project.agents ?? 0],
      ["Last update", project.lastUpdate || ""]
    ];
    rows.forEach(([label, value]) => {
      dl.append(buildMetaItem(label, value));
    });
    return dl;
  }

  function createBadge(text, variant) {
    const badge = document.createElement("span");
    badge.className = `badge ${variant}`;
    badge.textContent = text;
    return badge;
  }

  function createActions(project) {
    const actions = document.createElement("div");
    actions.className = "card-actions";
    if (project.url) {
      const site = document.createElement("a");
      site.className = "link-btn primary";
      site.href = project.url;
      site.target = "_blank";
      site.rel = "noopener noreferrer";
      site.textContent = "Site live";
      actions.append(site);
    }
    if (project.github) {
      const repo = document.createElement("a");
      repo.className = "link-btn";
      repo.href = project.github;
      repo.target = "_blank";
      repo.rel = "noopener noreferrer";
      repo.textContent = "GitHub";
      actions.append(repo);
    }
    if (project.apk) {
      const apk = document.createElement("a");
      apk.className = "link-btn";
      apk.href = project.apk;
      apk.target = "_blank";
      apk.rel = "noopener noreferrer";
      apk.textContent = "APK";
      actions.append(apk);
    }
    return actions;
  }

  function createCard(project) {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.status = normalize(project.status);
    card.dataset.android = project.android ? "true" : "false";
    card.dataset.money = project.money ? "true" : "false";


    const head = document.createElement("header");
    head.className = "card-head";
    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = project.name || "Proiect";
    const status = document.createElement("span");
    status.className = `badge ${normalize(project.status)}`;
    status.textContent = formatLabel(project.status);
    head.append(title, status);

    const description = document.createElement("p");
    description.className = "card-desc";
    description.textContent = project.description || "";

    const meta = createMeta(project);

    const badgeList = document.createElement("div");
    badgeList.className = "badge-list";
    badgeList.append(
      project.money ? createBadge("Produce bani", "active") : createBadge("Nu produce bani", "inactive"),
      project.android ? createBadge("Are Android", "active") : createBadge("Fără Android", "inactive")
    );

    const actions = createActions(project);

    card.append(head, description, meta, badgeList, actions);
    return card;
  }

  function updateStats() {
    const total = state.projects.length;
    statTotal.textContent = String(total);
    statActive.textContent = String(state.projects.filter(project => normalize(project.status) === "activ").length);
    statAndroid.textContent = String(state.projects.filter(project => !!project.android).length);
    statMoney.textContent = String(state.projects.filter(project => !!project.money).length);
  }

  function getMatchingCount() {
    return state.projects.filter(project => {
      if (state.filter === "android" && !project.android) return false;
      if (state.filter === "money" && !project.money) return false;
      if (state.filter === "inactive" && normalize(project.status) !== "inactiv") return false;
      if (!state.query) return true;
      return normalize(project.name).includes(state.query)
        || normalize(project.description).includes(state.query)
        || normalize(project.stage).includes(state.query)
        || normalize(project.host).includes(state.query);
    }).length;
  }

  function render() {
    const matched = state.projects.filter(project => {
      if (state.filter === "android" && !project.android) return false;
      if (state.filter === "money" && !project.money) return false;
      if (state.filter === "inactive" && normalize(project.status) !== "inactiv") return false;
      if (!state.query) return true;
      return normalize(project.name).includes(state.query)
        || normalize(project.description).includes(state.query)
        || normalize(project.stage).includes(state.query)
        || normalize(project.host).includes(state.query);
    });

    grid.replaceChildren();
    matched.forEach(project => grid.append(createCard(project)));
    if (!matched.length) grid.append(emptyState);
    const countText = state.filter === "all"
      ? `Toate proiectele afișate: ${matched.length}`
      : `Rezultate: ${matched.length}`;
    liveRegion.textContent = countText;
  }

  async function loadData() {
    try {
      errorState.classList.add("hidden");
      loadingState.classList.remove("hidden");
      const response = await fetch("../../projects.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      state.projects = Array.isArray(data) ? data : [];
      state.projects.sort((a, b) => (b.lastUpdate ?? "").localeCompare(a.lastUpdate ?? ""));
      updateStats();
      render();
    } catch (error) {
      console.error("Dashboard data load error:", error);
      loadingState.classList.add("hidden");
      errorState.classList.remove("hidden");
      grid.replaceChildren();
    } finally {
      setTimeout(() => {
        loadingState.classList.add("hidden");
      }, 250);
    }
  }

  searchInput.addEventListener("input", event => {
    state.query = normalize(event.target.value);
    render();
  });

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      filterButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      state.filter = button.dataset.filter;
      render();
    });
  });

  loadData();
}());