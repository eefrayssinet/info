const modeNote = document.getElementById("mode-note");
const modeButtons = document.querySelectorAll("[data-mode]");
const promptTyping = document.getElementById("prompt-typing");
const waitlistForm = document.getElementById("waitlist-form");
const waitlistMessage = document.getElementById("waitlist-message");

const modes = {
  grid: {
    note:
      "Code Grid pone a prueba debugging, refactors y automatizaciones. El premio esta en llegar a una salida valida con precision fria y casi sin tiros de mas.",
  },
  amber: {
    note:
      "Studio Pulse trabaja branding, UX y direccion visual. Gana quien encuentra una idea fuerte con instrucciones limpias y pocas iteraciones.",
  },
  violet: {
    note:
      "Legal Echo lleva el juego a contratos, compliance y lectura de riesgo. La cancha castiga la ambiguedad y recompensa la claridad quirurgica.",
  },
};

const prompts = [
  "corrige este bug sin romper el contrato publico y devolve solo el cambio esencial",
  "propone un hero mobile first con una idea central y tres reglas de sistema visual",
  "reescribe esta clausula para bajar riesgo legal sin perder intencion comercial",
  "resume esta tesis en una postura defendible con una objecion y una replica",
];

let modeIndex = 0;
let promptIndex = 0;
let characterIndex = 0;
let deleting = false;

function setMode(mode) {
  document.body.dataset.mode = mode;
  modeNote.textContent = modes[mode].note;

  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
}

function cycleMode() {
  const keys = Object.keys(modes);
  modeIndex = (modeIndex + 1) % keys.length;
  setMode(keys[modeIndex]);
}

function typePrompt() {
  const currentPrompt = prompts[promptIndex];

  if (!deleting) {
    characterIndex += 1;
    promptTyping.textContent = currentPrompt.slice(0, characterIndex);

    if (characterIndex === currentPrompt.length) {
      deleting = true;
      setTimeout(typePrompt, 1600);
      return;
    }
  } else {
    characterIndex -= 1;
    promptTyping.textContent = currentPrompt.slice(0, characterIndex);

    if (characterIndex === 0) {
      deleting = false;
      promptIndex = (promptIndex + 1) % prompts.length;
    }
  }

  setTimeout(typePrompt, deleting ? 22 : 42);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const keys = Object.keys(modes);
    modeIndex = keys.indexOf(button.dataset.mode);
    setMode(button.dataset.mode);
  });
});

setMode("grid");
typePrompt();
setInterval(cycleMode, 9000);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  observer.observe(element);
});

waitlistForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(waitlistForm);
  const email = String(data.get("email") || "").trim();

  if (!email) {
    waitlistMessage.textContent =
      "Necesitamos un correo para enganchar tu handle al primer lobby.";
    return;
  }

  waitlistMessage.textContent = `Handle reservado para ${email}. Cuando Prompt Golf salga del laboratorio, tu lugar en el lobby ya va a estar tomado.`;
  waitlistForm.reset();
});
