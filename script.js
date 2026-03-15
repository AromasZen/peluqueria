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

// ===== TRABAJOS STATE =====
const TRABAJOS_PER_PAGE = 5;
let trabajosCargados = [];
let trabajosTotalCount = 0;
let trabajosOffset = 0;
let trabajosLoading = false;

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

  progressBar.innerHTML = steps
    .map(
      (_, i) =>
        `<div class="progress-step ${i <= currentStep ? "active" : ""}"></div>`
    )
    .join("");

  stepLabel.textContent = `✨ Paso ${currentStep + 1} de ${steps.length}`;
  quizTitle.textContent = step.title;
  quizSubtitle.textContent = step.subtitle;

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

  quizOptions.querySelectorAll(".quiz-option").forEach((el) => {
    el.addEventListener("click", () => {
      selections[step.key] = el.dataset.value;
      renderStep();
    });
  });

  prevBtn.disabled = currentStep === 0;
  prevBtn.style.opacity = currentStep === 0 ? "0.35" : "1";

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

// ===== TRABAJOS: LOAD FROM SUPABASE =====
async function cargarTrabajos(reset) {
  if (trabajosLoading) return;
  trabajosLoading = true;

  const loadingEl = document.getElementById("trabajosLoading");
  const emptyEl = document.getElementById("trabajosEmpty");
  const gridEl = document.getElementById("trabajosGrid");
  const loadMoreEl = document.getElementById("trabajosLoadMore");
  const btnSpinner = document.getElementById("btnVerMasSpinner");
  const btnText = document.querySelector(".btn-load-more-text");
  const countEl = document.getElementById("trabajosCount");

  if (reset) {
    trabajosCargados = [];
    trabajosOffset = 0;
    gridEl.innerHTML = "";
    gridEl.classList.add("hidden");
    loadMoreEl.classList.add("hidden");
    emptyEl.classList.add("hidden");
    loadingEl.classList.remove("hidden");
  } else {
    // Show spinner on button
    btnSpinner.classList.remove("hidden");
    btnText.textContent = "Cargando...";
  }

  try {
    // First get total count
    if (reset) {
      const { count, error: countError } = await supabaseClient
     .from("trabajos")
     .select("*", { count: "exact", head: true })
     .eq("empresa_id", empresaId);

      if (countError) {
        console.error("Error contando trabajos:", countError);
        trabajosTotalCount = 0;
      } else {
        trabajosTotalCount = count || 0;
      }
    }

    // Fetch the next batch
    const { data, error } = await supabaseClient
  .from("trabajos")
  .select("*")
  .eq("empresa_id", empresaId)
  .order("created_at", { ascending: false })
  .range(trabajosOffset, trabajosOffset + TRABAJOS_PER_PAGE - 1);

    if (error) {
      console.error("Error cargando trabajos:", error);
      loadingEl.classList.add("hidden");
      emptyEl.innerHTML = `
        <div class="trabajos-empty-icon">⚠️</div>
        <h4>Error al cargar trabajos</h4>
        <p>No se pudieron cargar los trabajos. Intenta recargar la página.</p>
      `;
      emptyEl.classList.remove("hidden");
      trabajosLoading = false;
      return;
    }

    loadingEl.classList.add("hidden");

    if ((!data || data.length === 0) && trabajosCargados.length === 0) {
      emptyEl.classList.remove("hidden");
      trabajosLoading = false;
      return;
    }

    if (data && data.length > 0) {
      trabajosCargados = trabajosCargados.concat(data);
      trabajosOffset += data.length;

      // Render new cards with animation
      data.forEach((trabajo, index) => {
        const card = crearTarjetaTrabajo(trabajo, index);
        gridEl.appendChild(card);
      });

      gridEl.classList.remove("hidden");

      // Animate new cards
      requestAnimationFrame(() => {
        const newCards = gridEl.querySelectorAll(".trabajo-card.entering");
        newCards.forEach((card, i) => {
          setTimeout(() => {
            card.classList.remove("entering");
            card.classList.add("entered");
          }, i * 100);
        });
      });

      // Update count text
      countEl.textContent = `Mostrando ${trabajosCargados.length} de ${trabajosTotalCount} trabajos`;

      // Show/hide load more button
      if (trabajosCargados.length < trabajosTotalCount) {
        loadMoreEl.classList.remove("hidden");
      } else {
        loadMoreEl.classList.add("hidden");
      }
    } else {
      // No more data to load
      loadMoreEl.classList.add("hidden");
    }
  } catch (err) {
    console.error("Error:", err);
    loadingEl.classList.add("hidden");
  }

  // Reset button state
  btnSpinner.classList.add("hidden");
  btnText.textContent = "Ver más trabajos";
  trabajosLoading = false;
}

// ===== CREATE TRABAJO CARD =====
function crearTarjetaTrabajo(trabajo, index) {
  const card = document.createElement("div");
  card.className = "trabajo-card entering";
  card.style.animationDelay = `${index * 0.1}s`;

  const fecha = trabajo.created_at
    ? new Date(trabajo.created_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  card.innerHTML = `
    <div class="trabajo-img-wrapper" onclick="abrirLightbox('${trabajo.imagen_url || ""}', '${(trabajo.titulo || "").replace(/'/g, "\\'")}')">
      <img
        src="${trabajo.imagen_url || ""}"
        alt="${trabajo.titulo || "Trabajo"}"
        loading="lazy"
        onerror="this.parentElement.classList.add('img-error'); this.style.display='none';"
      >
      <div class="trabajo-img-overlay">
        <span class="trabajo-zoom-icon">🔍</span>
      </div>
    </div>
    <div class="trabajo-card-body">
      <h4 class="trabajo-titulo">${trabajo.titulo || "Sin título"}</h4>
      ${fecha ? `<span class="trabajo-fecha">📅 ${fecha}</span>` : ""}
    </div>
  `;

  return card;
}

// ===== LIGHTBOX =====
function abrirLightbox(imagenUrl, titulo) {
  if (!imagenUrl) return;

  const overlay = document.getElementById("lightboxModal");
  const img = document.getElementById("lightboxImage");
  const caption = document.getElementById("lightboxCaption");

  img.src = imagenUrl;
  img.alt = titulo;
  caption.textContent = titulo;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function cerrarLightbox() {
  const overlay = document.getElementById("lightboxModal");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

// Lightbox event listeners
document.getElementById("lightboxBackdrop").addEventListener("click", cerrarLightbox);
document.getElementById("lightboxClose").addEventListener("click", cerrarLightbox);

// Close lightbox with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const lightbox = document.getElementById("lightboxModal");
    if (lightbox.classList.contains("active")) {
      cerrarLightbox();
    } else {
      closeQuiz();
    }
  }
});

// ===== VER MÁS BUTTON =====
document.getElementById("btnVerMas").addEventListener("click", () => {
  cargarTrabajos(false);
});

// ===== SMOOTH SCROLL FOR NAVBAR LINKS =====
document.querySelectorAll('.navbar-links a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ===== NAVBAR SCROLL EFFECT =====
let lastScroll = 0;
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  const scrollY = window.scrollY;

  if (scrollY > 100) {
    navbar.classList.add("navbar-scrolled");
  } else {
    navbar.classList.remove("navbar-scrolled");
  }

  lastScroll = scrollY;
});

// ===== INIT =====
renderStep();
cargarTrabajos(true);