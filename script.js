// ===== SUPABASE INIT =====
const supabaseClient = window.supabase.createClient(
  "https://nkkyyqqqusodhwqvprik.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ra3l5cXFxdXNvZGh3cXZwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjU1MDIsImV4cCI6MjA4ODYwMTUwMn0.Gs5bdRrv9HNViruVjr8mQl4Oh2Ei1Hyryr0vxpdPPhU"
);

// ===== QUIZ DATA =====
const steps = [
  {
    key: "genero",
    title: "¿Cuál es tu género?",
    subtitle: "Selecciona para ver cortes personalizados",
    options: [
      { value: "Mujer", label: "Mujer", emoji: "👩" },
      { value: "Hombre", label: "Hombre", emoji: "👨" },
      { value: "Unisex", label: "Unisex", emoji: "🧑" },
    ],
  },
  {
    key: "tipo_cara",
    title: "¿Qué forma tiene tu cara?",
    subtitle: "El corte ideal depende de tu tipo de rostro",
    options: [
      { value: "Ovalada", label: "Ovalada", emoji: "🥚" },
      { value: "Redonda", label: "Redonda", emoji: "🔵" },
      { value: "Cuadrada", label: "Cuadrada", emoji: "🟧" },
      { value: "Corazón", label: "Corazón", emoji: "💛" },
      { value: "Alargada", label: "Alargada", emoji: "📏" },
    ],
  },
  {
    key: "tipo_pelo",
    title: "¿Cómo es tu tipo de pelo?",
    subtitle: "Cada tipo de cabello luce diferente con cada corte",
    options: [
      { value: "Liso", label: "Liso", emoji: "➖" },
      { value: "Ondulado", label: "Ondulado", emoji: "〰️" },
      { value: "Rizado", label: "Rizado", emoji: "🌀" },
      { value: "Fino", label: "Fino", emoji: "🪶" },
    ],
  },
  {
    key: "largo",
    title: "¿Qué largo prefieres?",
    subtitle: "Elige el largo que más te guste",
    options: [
      { value: "Corto", label: "Corto", emoji: "✂️" },
      { value: "Medio", label: "Medio", emoji: "📐" },
      { value: "Largo", label: "Largo", emoji: "💇" },
    ],
  },
];

// ===== STATE =====
let currentStep = 0;
let selections = {};

// ===== DOM ELEMENTS =====
const quizModal = document.getElementById("quizModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const quizContent = document.getElementById("quizContent");
const resultsContent = document.getElementById("resultsContent");
const resultsInner = document.getElementById("resultsInner");
const progressBar = document.getElementById("progressBar");
const stepLabel = document.getElementById("stepLabel");
const quizTitle = document.getElementById("quizTitle");
const quizSubtitle = document.getElementById("quizSubtitle");
const quizOptions = document.getElementById("quizOptions");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// ===== OPEN / CLOSE MODAL =====
function openQuiz() {
  currentStep = 0;
  selections = {};
  quizContent.classList.remove("hidden");
  resultsContent.classList.add("hidden");
  renderStep();
  quizModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeQuiz() {
  quizModal.classList.remove("active");
  document.body.style.overflow = "";
}

document.getElementById("navQuizBtn").addEventListener("click", openQuiz);
document.getElementById("heroQuizBtn").addEventListener("click", openQuiz);
document.getElementById("ctaQuizBtn").addEventListener("click", openQuiz);
modalBackdrop.addEventListener("click", closeQuiz);
modalClose.addEventListener("click", closeQuiz);

// ===== RENDER STEP =====
function renderStep() {
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Progress bar
  progressBar.innerHTML = steps
    .map(
      (_, i) =>
        `<div class="progress-step ${i <= currentStep ? "active" : ""}"></div>`
    )
    .join("");

  // Labels
  stepLabel.textContent = `✨ Paso ${currentStep + 1} de ${steps.length}`;
  quizTitle.textContent = step.title;
  quizSubtitle.textContent = step.subtitle;

  // Options
  quizOptions.innerHTML = step.options
    .map(
      (opt) =>
        `<div class="quiz-option ${
          selections[step.key] === opt.value ? "selected" : ""
        }" data-value="${opt.value}">
          <span class="emoji">${opt.emoji}</span>
          <span class="label">${opt.label}</span>
        </div>`
    )
    .join("");

  // Option click handlers
  quizOptions.querySelectorAll(".quiz-option").forEach((el) => {
    el.addEventListener("click", () => {
      selections[step.key] = el.dataset.value;
      renderStep();
    });
  });

  // Prev button
  prevBtn.disabled = currentStep === 0;
  prevBtn.style.opacity = currentStep === 0 ? "0.35" : "1";

  // Next button
  const canProceed = !!selections[step.key];
  nextBtn.disabled = !canProceed;
  nextBtn.textContent = isLast ? "🔍 Buscar mi corte ideal" : "Siguiente →";
}

// ===== NAVIGATION =====
prevBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentStep < steps.length - 1) {
    currentStep++;
    renderStep();
  } else {
    searchCortes();
  }
});

// ===== SEARCH CORTES =====
async function searchCortes() {
  quizContent.classList.add("hidden");
  resultsContent.classList.remove("hidden");

  // Show loading
  resultsInner.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Buscando tu corte ideal...</p>
    </div>
  `;

  try {
    let query = supabaseClient.from("cortes").select("*");

    if (selections.genero) query = query.eq("genero", selections.genero);
    if (selections.tipo_cara) query = query.eq("tipo_cara", selections.tipo_cara);
    if (selections.tipo_pelo) query = query.eq("tipo_pelo", selections.tipo_pelo);
    if (selections.largo) query = query.eq("largo", selections.largo);

    const { data, error } = await query;

    if (error) {
      console.error("Error:", error);
      resultsInner.innerHTML = `
        <div class="no-results">
          <div class="icon">⚠️</div>
          <h4>Error al buscar</h4>
          <p>Hubo un problema al consultar los cortes. Intenta de nuevo.</p>
          <button class="btn-primary small" onclick="resetQuiz()">Intentar de nuevo</button>
        </div>
      `;
      return;
    }

    if (!data || data.length === 0) {
      resultsInner.innerHTML = `
        <div class="no-results">
          <div class="icon">✂️</div>
          <h4>No encontramos coincidencias</h4>
          <p>Intenta cambiar algunos filtros para encontrar más opciones de cortes.</p>
          <button class="btn-primary small" onclick="resetQuiz()">Intentar de nuevo</button>
        </div>
      `;
      return;
    }

    renderResults(data);
  } catch (err) {
    console.error("Error:", err);
    resultsInner.innerHTML = `
      <div class="no-results">
        <div class="icon">⚠️</div>
        <h4>Error de conexión</h4>
        <p>No se pudo conectar con la base de datos.</p>
        <button class="btn-primary small" onclick="resetQuiz()">Intentar de nuevo</button>
      </div>
    `;
  }
}

// ===== RENDER RESULTS =====
function renderResults(cortes) {
  const count = cortes.length;
  const plural = count !== 1;

  let html = `
    <div class="results-header">
      <h3>${count} corte${plural ? "s" : ""} encontrado${plural ? "s" : ""}</h3>
      <button class="btn-accent-outline" onclick="resetQuiz()">Nueva búsqueda</button>
    </div>
    <div class="results-grid">
  `;

  cortes.forEach((corte) => {
  html += `
    <div class="result-card">
      <div class="result-img-wrapper">
        <img src="${corte.imagen}" alt="${corte.nombre_corte}">
        <span class="result-badge">${corte.genero}</span>
      </div>

      <div class="result-card-body">
        <h4>${corte.nombre_corte}</h4>
        <p class="desc">${corte.descripcion || ""}</p>

        <div class="result-tags">
          <span class="result-tag">${corte.tipo_cara}</span>
          <span class="result-tag">${corte.tipo_pelo}</span>
          <span class="result-tag">${corte.largo}</span>
        </div>

        ${corte.precio ? `<div class="result-price">$${Number(corte.precio).toFixed(2)}</div>` : ""}
      </div>
    </div>
  `;
});

  html += `</div>`;
  resultsInner.innerHTML = html;
}

// ===== RESET QUIZ =====
function resetQuiz() {
  currentStep = 0;
  selections = {};
  quizContent.classList.remove("hidden");
  resultsContent.classList.add("hidden");
  renderStep();
}

// ===== INIT =====
renderStep();