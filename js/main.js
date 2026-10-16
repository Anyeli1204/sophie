(() => {
  const body = document.body;
  const plines = [...document.querySelectorAll(".prologue-texts .pline")];
  const scenes = [...document.querySelectorAll(".scene")];
  const letters = [...document.querySelectorAll(".letter")];
  const progress = document.querySelector(".progress i");
  const veil = document.querySelector(".spotlight-veil");
  const flame = document.querySelector(".flame-cursor");
  const chapterNav = document.querySelector(".chapter-nav");
  const deskContinue = document.querySelector(".desk-continue");
  const deskHint = document.querySelector(".desk-move-hint");
  const correctionStage = document.querySelector(".correction-stage");
  const finalScene = document.getElementById("final");
  const litScenes = new Set();

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let lightX = window.innerWidth / 2;
  let lightY = window.innerHeight / 2;
  let moveDistance = 0;
  let lastX = lightX;
  let lastY = lightY;
  let flameVisible = false;

  function setLight(x, y) {
    lightX = x;
    lightY = y;
    document.documentElement.style.setProperty("--lx", `${x}px`);
    document.documentElement.style.setProperty("--ly", `${y}px`);
    if (flame) {
      flame.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  function enableLight() {
    body.dataset.light = "on";
    body.classList.remove("prologue-active");
    body.classList.add("desk-active");
    if (veil) veil.hidden = false;
    if (flame) flame.classList.add("is-on");
    flameVisible = true;
    setLight(window.innerWidth / 2, window.innerHeight / 2);
    window.setTimeout(() => body.classList.add("sophie-awake"), 1100);
  }

  function unlockDesk() {
    if (body.classList.contains("desk-unlocked")) return;
    body.classList.add("desk-unlocked");
    body.classList.remove("locked");
    if (deskContinue) deskContinue.hidden = false;
    if (deskHint) deskHint.style.opacity = "0";
    if (chapterNav) chapterNav.hidden = false;
  }

  function onPointerMove(event) {
    if (body.dataset.light !== "on") return;
    const x = event.clientX;
    const y = event.clientY;
    setLight(x, y);

    if (!flameVisible) {
      flameVisible = true;
      if (flame) flame.classList.add("is-on");
    }

    if (body.classList.contains("desk-active") && !body.classList.contains("desk-unlocked")) {
      moveDistance += Math.hypot(x - lastX, y - lastY);
      lastX = x;
      lastY = y;
      if (moveDistance > 420) unlockDesk();
    }
  }

  async function playPrologue() {
    await wait(700);

    for (let i = 0; i < plines.length; i += 1) {
      plines.forEach((line) => line.classList.remove("show"));
      plines[i].classList.add("show");
      const hold = i >= plines.length - 1 ? 2200 : i < 2 ? 2400 : 2600;
      await wait(hold);
      if (i < plines.length - 1) {
        plines[i].classList.add("gone");
        await wait(500);
      }
    }

    await wait(600);
    enableLight();
    body.querySelector(".scene-desk")?.classList.add("is-in");
  }

  function runCorrectionStory() {
    if (!correctionStage || correctionStage.dataset.played === "1") return;
    correctionStage.dataset.played = "1";
    const steps = [...correctionStage.querySelectorAll(".corr-step")];
    steps.forEach((step, index) => {
      setTimeout(() => step.classList.add("show"), 800 + index * 1400);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          if (entry.target.id === "lagrange") runCorrectionStory();
          if (entry.target.id === "despertar" && body.dataset.light === "on") {
            body.classList.add("desk-active");
          }
        }
        if (entry.target.id === "despertar" && !entry.isIntersecting) {
          body.classList.remove("desk-active");
        }
      });
    },
    { threshold: 0.28 }
  );

  scenes.forEach((scene) => observer.observe(scene));

  // Escenas iluminadas (la obra y el final): se apaga el velo de la vela.
  const litObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          litScenes.add(entry.target);
        } else {
          litScenes.delete(entry.target);
        }
      });
      body.classList.toggle("lit-scene", litScenes.size > 0);
      body.classList.toggle("final-lit", litScenes.has(finalScene));
    },
    { rootMargin: "-35% 0px -35% 0px" }
  );
  document.querySelectorAll(".scene-lit").forEach((scene) => litObserver.observe(scene));

  // Recorrido por la obra: cada paso enfoca una zona de la imagen.
  const obraFrame = document.querySelector(".obra-frame");
  const obraSteps = [...document.querySelectorAll(".obra-step")];

  function focusObra(step) {
    obraSteps.forEach((s) => s.classList.toggle("is-active", s === step));
    obraFrame.style.setProperty("--ox", step.dataset.ox);
    obraFrame.style.setProperty("--oy", step.dataset.oy);
    obraFrame.style.setProperty("--s", step.dataset.s);
  }

  if (obraFrame && obraSteps.length) {
    const stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) focusObra(entry.target);
        });
      },
      {
        // En móvil la imagen ocupa la parte superior: el texto se lee abajo.
        rootMargin: window.matchMedia("(max-width: 900px)").matches
          ? "-72% 0px -18% 0px"
          : "-45% 0px -45% 0px",
      }
    );
    obraSteps.forEach((step) => stepObserver.observe(step));
  }

  letters.forEach((letter) => {
    letter.addEventListener("click", () => letter.classList.toggle("is-open"));
  });

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? window.scrollY / max : 0;
    progress.style.width = `${Math.min(100, value * 100)}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener(
    "touchmove",
    (event) => {
      const t = event.touches[0];
      if (t) onPointerMove({ clientX: t.clientX, clientY: t.clientY });
    },
    { passive: true }
  );

  updateProgress();
  setLight(window.innerWidth / 2, window.innerHeight / 2);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const skipPrologue = Boolean(location.hash) && location.hash !== "#oscuridad";

  if (reduced || skipPrologue) {
    plines[plines.length - 1]?.classList.add("show");
    enableLight();
    unlockDesk();
    if (skipPrologue && location.hash !== "#despertar") {
      body.classList.remove("locked");
    }
    runCorrectionStory();
    return;
  }

  playPrologue();
})();
