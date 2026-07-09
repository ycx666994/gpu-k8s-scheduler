const mockScenarios = {
  baseline: {
    label: "Baseline",
    utilization: "12/12",
    pending: 9,
    idleCost: 18.4,
    score: 51,
    teams: [
      { name: "Research", used: 4, quota: 0, color: "#b98219" },
      { name: "Training", used: 7, quota: 0, color: "#2f6fbd" },
      { name: "Inference", used: 1, quota: 0, color: "#be4b49" }
    ],
    events: [
      ["Training", "One namespace can consume most GPUs without a hard team budget."],
      ["Inference", "Production replicas wait behind batch workloads."],
      ["Cluster", "Allocated GPUs can stay idle without utilization feedback."]
    ]
  },
  quota: {
    label: "Namespace + Quota",
    utilization: "11/12",
    pending: 5,
    idleCost: 11.2,
    score: 68,
    teams: [
      { name: "Research", used: 2, quota: 2, color: "#b98219" },
      { name: "Training", used: 6, quota: 6, color: "#2f6fbd" },
      { name: "Inference", used: 3, quota: 4, color: "#16856a" }
    ],
    events: [
      ["Quota", "Namespace budgets make GPU ownership explicit."],
      ["Admission", "Quota can reject workloads before scheduling."],
      ["Cost", "Team-level allocation is visible enough for chargeback."]
    ]
  },
  affinity: {
    label: "Node Affinity",
    utilization: "11/12",
    pending: 3,
    idleCost: 7.6,
    score: 77,
    teams: [
      { name: "Research", used: 2, quota: 2, color: "#b98219" },
      { name: "Training", used: 5, quota: 6, color: "#2f6fbd" },
      { name: "Inference", used: 4, quota: 4, color: "#16856a" }
    ],
    events: [
      ["Affinity", "Training jobs target the training GPU pool."],
      ["Inference", "Inference replicas target the low-latency pool."],
      ["Cluster", "Placement policy reduces accidental resource mixing."]
    ]
  },
  priority: {
    label: "PriorityClass",
    utilization: "10/12",
    pending: 2,
    idleCost: 4.9,
    score: 86,
    teams: [
      { name: "Research", used: 1, quota: 2, color: "#b98219" },
      { name: "Training", used: 5, quota: 6, color: "#2f6fbd" },
      { name: "Inference", used: 4, quota: 4, color: "#16856a" }
    ],
    events: [
      ["Priority", "Critical inference receives the highest scheduling priority."],
      ["Preemption", "Low-priority batch workloads can yield capacity."],
      ["Cost", "Business-critical workloads spend GPU budget first."]
    ]
  }
};

const descriptions = {
  cluster: "Current state exported from kubectl.",
  baseline: "No isolation policy; teams compete directly for GPU capacity.",
  quota: "Namespace budgets expose team ownership and admission control.",
  affinity: "Node labels steer workloads into the intended GPU pools.",
  priority: "Business priority controls which workloads win during contention."
};

const colors = {
  research: "#b98219",
  training: "#2f6fbd",
  inference: "#16856a"
};

const buttons = document.querySelectorAll(".strategy");
const teamRows = document.querySelector("#teamRows");
const events = document.querySelector("#events");
const comparison = document.querySelector("#comparison");
const dataSource = document.querySelector("#dataSource");

let scenarios = { ...mockScenarios };

function buildClusterScenario(status) {
  const summary = status.summary || {};
  const teams = (status.teams || []).map((team) => ({
    name: team.team.charAt(0).toUpperCase() + team.team.slice(1),
    used: Number(team.gpuRequested || 0),
    quota: Number(team.gpuQuota || 0),
    pendingPods: Number(team.pendingPods || 0),
    color: colors[team.team] || "#657286"
  }));

  const eventRows = (status.events || []).slice(0, 8).map((event) => [
    event.reason,
    `${event.namespace} ${event.object}: ${event.message}`
  ]);

  if (eventRows.length === 0) {
    eventRows.push(["Cluster", "No failed scheduling or admission events exported."]);
  }

  const quota = Number(summary.gpuQuota || 0);
  const requested = Number(summary.gpuRequested || 0);
  const pending = Number(summary.pendingPods || 0);
  const failedCreate = Number(summary.failedCreateEvents || 0);
  const failedScheduling = Number(summary.failedSchedulingEvents || 0);
  const score = Math.max(0, 100 - pending * 8 - failedCreate * 4 - failedScheduling * 2);

  return {
    label: `Live Cluster (${status.context || "unknown"})`,
    utilization: `${requested}/${quota}`,
    pending,
    idleCost: Number(summary.estimatedIdleCostPerHour || 0),
    score,
    teams,
    events: eventRows,
    generatedAt: status.generatedAt
  };
}

function render(strategyKey) {
  const scenario = scenarios[strategyKey] || scenarios.baseline;

  document.querySelector("#utilization").textContent = scenario.utilization;
  document.querySelector("#pending").textContent = scenario.pending;
  document.querySelector("#idleCost").textContent = `$${scenario.idleCost.toFixed(2)}`;
  document.querySelector("#score").textContent = scenario.score;
  document.querySelector("#strategyLabel").textContent = scenario.label;
  document.querySelector("#eventWindow").textContent = scenario.generatedAt || "Recent";

  teamRows.innerHTML = scenario.teams
    .map((team) => {
      const denominator = team.quota || Math.max(team.used, 1);
      const width = Math.min(100, Math.round((team.used / denominator) * 100));
      const quotaText = team.quota ? `${team.used}/${team.quota} GPU` : `${team.used} GPU requested`;
      const pendingText = team.pendingPods ? ` · ${team.pendingPods} pending` : "";

      return `
        <div class="team">
          <div>
            <div class="team-name">${team.name}</div>
            <div class="team-meta">${quotaText}${pendingText}</div>
          </div>
          <div class="bar" aria-label="${team.name} GPU usage">
            <div class="fill" style="width: ${width}%; background: ${team.color};"></div>
          </div>
          <strong>${width}%</strong>
        </div>
      `;
    })
    .join("");

  events.innerHTML = scenario.events
    .map(([scope, text]) => `<li><strong>${scope}</strong> ${text}</li>`)
    .join("");

  comparison.innerHTML = Object.entries(scenarios)
    .map(([key, item]) => `
      <article class="strategy-card ${key === strategyKey ? "active" : ""}">
        <h3>${item.label}</h3>
        <p>GPU requested ${item.utilization}</p>
        <p>Pending Pods ${item.pending}</p>
        <p>Idle cost $${item.idleCost.toFixed(2)}/h</p>
        <p>${descriptions[key]}</p>
      </article>
    `)
    .join("");

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.strategy === strategyKey);
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => render(button.dataset.strategy));
});

if (window.CLUSTER_STATUS) {
  scenarios = {
    cluster: buildClusterScenario(window.CLUSTER_STATUS),
    ...mockScenarios
  };
  dataSource.textContent = "Live Export";
  render("cluster");
} else {
  document.querySelector('[data-strategy="cluster"]').disabled = true;
  dataSource.textContent = "Mock Metrics";
  render("baseline");
}

