const form = document.getElementById("search-form");
const input = document.getElementById("pokemon-name");
const container = document.getElementById("pokemon-container");
const message = document.getElementById("message");
const searchButton = document.getElementById("search-button");

const installPrompt = document.getElementById("install-prompt");
const installButton = document.getElementById("install-button");
const dismissInstallButton = document.getElementById("dismiss-install");
const installHelp = document.getElementById("install-help");

let deferredInstallPrompt = null;

const typeColors = {
  fire: "#ff795b",
  water: "#60a5fa",
  grass: "#65d995",
  electric: "#facc65",
  psychic: "#f783c6",
  ice: "#67dce3",
  dragon: "#a78bfa",
  dark: "#a1a1aa",
  fairy: "#f9a8d4",
  normal: "#c4c9d4",
  fighting: "#fb7185",
  flying: "#a5b4fc",
  poison: "#c084fc",
  ground: "#d6a56c",
  rock: "#c4b18a",
  bug: "#a3c94f",
  ghost: "#9b8ade",
  steel: "#94a3b8"
};

async function showPokemon(value) {
  const query = String(value).trim().toLowerCase();

  if (!query) {
    message.textContent = "Escribe el nombre o número de un Pokémon.";
    message.classList.add("error");
    return;
  }

  searchButton.disabled = true;
  message.classList.remove("error");
  message.textContent = "Buscando Pokémon...";
  container.replaceChildren();

  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "No encontramos ese Pokémon. Prueba otro nombre o número."
        );
      }

      throw new Error("No se pudo consultar la API. Inténtalo de nuevo.");
    }

    const pokemon = await response.json();
    const card = document.createElement("article");
    card.className = "pokemon-card";

    const mainType = pokemon.types[0].type.name;

    card.style.setProperty(
      "--pokemon-color",
      typeColors[mainType] || "#a78bfa"
    );

    const top = document.createElement("div");
    top.className = "card-top";

    const label = document.createElement("span");
    label.className = "card-label";
    label.textContent = "POKEMON DESCUBIERTO";

    const number = document.createElement("span");
    number.className = "pokemon-number";
    number.textContent = "#" + String(pokemon.id).padStart(3, "0");

    top.append(label, number);

    const visual = document.createElement("div");
    visual.className = "pokemon-visual";

    const image = document.createElement("img");
    image.className = "pokemon-image";
    image.alt = "Pokemon " + pokemon.name;
    image.loading = "lazy";
    image.src =
      pokemon.sprites.other?.["official-artwork"]?.front_default ||
      pokemon.sprites.front_default ||
      "";

    visual.appendChild(image);

    const name = document.createElement("h2");
    name.className = "pokemon-name";
    name.textContent = pokemon.name;

    const types = document.createElement("div");
    types.className = "type-list";

    pokemon.types.forEach(({ type }) => {
      const badge = document.createElement("span");
      badge.className = "type-badge";
      badge.textContent = type.name;
      types.appendChild(badge);
    });

    const stats = document.createElement("div");
    stats.className = "stats-grid";

    const details = [
      ["Altura", (pokemon.height / 10) + " m"],
      ["Peso", (pokemon.weight / 10) + " kg"],
      ["Experiencia base", pokemon.base_experience ?? "N/D"],
      [
        "Habilidades",
        pokemon.abilities.map(item => item.ability.name).join(", ")
      ]
    ];

    details.forEach(([labelText, value]) => {
      const box = document.createElement("div");
      box.className = "stat-box";

      const statLabel = document.createElement("span");
      statLabel.className = "stat-label";
      statLabel.textContent = labelText;

      const statValue = document.createElement("div");
      statValue.className = "stat-value";
      statValue.textContent = String(value);

      box.append(statLabel, statValue);
      stats.appendChild(box);
    });

    card.append(top, visual, name, types, stats);
    container.appendChild(card);

    message.textContent = "Pokemon encontrado!";
  } catch (error) {
    message.textContent = error.message || "Ocurrió un error inesperado.";
    message.classList.add("error");
  } finally {
    searchButton.disabled = false;
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  showPokemon(input.value);
});

document.querySelectorAll("[data-pokemon]").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.pokemon;
    showPokemon(button.dataset.pokemon);
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./serviceworker.js");
      console.log("Service Worker registrado correctamente.");
    } catch (error) {
      console.error("Error registrando el Service Worker:", error);
    }
  });
}

function isAppInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

function hideInstallPrompt() {
  installPrompt.hidden = true;
}

function showInstallPrompt() {
  if (!isAppInstalled()) {
    installPrompt.hidden = false;
  }
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;

  installButton.textContent = "Instalar app";
  installHelp.hidden = true;
  showInstallPrompt();
});

installButton.addEventListener("click", async () => {
  if (isAppInstalled()) {
    hideInstallPrompt();
    return;
  }

  if (!deferredInstallPrompt) {
    installHelp.hidden = false;
    installHelp.textContent =
      "Si no aparece la instalación automática, abre el menú del navegador " +
      "y selecciona Instalar aplicación o Instalar página como aplicación.";
    return;
  }

  const installEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  installButton.disabled = true;

  try {
    await installEvent.prompt();

    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      console.log("El usuario aceptó instalar la Pokédex.");
      hideInstallPrompt();
    } else {
      installHelp.hidden = false;
      installHelp.textContent = "Puedes instalar la app cuando quieras.";
    }
  } catch (error) {
    console.error("Error al solicitar la instalación:", error);
    installHelp.hidden = false;
    installHelp.textContent =
      "No se pudo abrir la instalación. Intenta desde el menú del navegador.";
  } finally {
    installButton.disabled = false;
  }
});

dismissInstallButton.addEventListener("click", () => {
  hideInstallPrompt();
});

window.addEventListener("appinstalled", () => {
  hideInstallPrompt();
  deferredInstallPrompt = null;
  console.log("La Pokédex se instaló correctamente.");
});

if (isAppInstalled()) {
  hideInstallPrompt();
} else {
  showInstallPrompt();
}