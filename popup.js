document.addEventListener("DOMContentLoaded", () => {
  const speedRange = document.getElementById("speedRange");
  const speedValue = document.getElementById("speedValue");
  const applyBtn = document.getElementById("applyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const statusEl = document.getElementById("status");
  const techItems = document.querySelectorAll(".tech-item");
  const presetBtns = document.querySelectorAll(".preset-btn");

  let statusTimer = null;

  // Carrega configuração salva
  chrome.storage.local.get(["speed", "techniques", "enabled"], (data) => {
    const speed = data.speed ? parseFloat(data.speed) : 1;
    speedRange.value = speed;
    speedValue.textContent = speed.toFixed(1) + "x";
    updatePresetActive(speed);

    if (data.techniques) {
      techItems.forEach(item => {
        const tech = item.dataset.tech;
        const checked = data.techniques.includes(tech);
        item.classList.toggle("active", checked);
        item.querySelector("input").checked = checked;
      });
    }
  });

  function updatePresetActive(val) {
    presetBtns.forEach(btn => {
      const s = parseFloat(btn.dataset.speed);
      btn.classList.toggle("active", Math.abs(s - val) < 0.05);
    });
  }

  speedRange.addEventListener("input", () => {
    const val = parseFloat(speedRange.value);
    speedValue.textContent = val.toFixed(1) + "x";
    updatePresetActive(val);
  });

  presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseFloat(btn.dataset.speed);
      speedRange.value = val;
      speedValue.textContent = val.toFixed(1) + "x";
      updatePresetActive(val);
    });
  });

  techItems.forEach(item => {
    item.addEventListener("click", () => {
      const checkbox = item.querySelector("input");
      checkbox.checked = !checkbox.checked;
      item.classList.toggle("active", checkbox.checked);
    });
  });

  function showStatus(msg, type) {
    if (statusTimer) clearTimeout(statusTimer);
    statusEl.textContent = msg;
    statusEl.className = "status show " + type;
    statusTimer = setTimeout(() => { statusEl.classList.remove("show"); }, 4000);
  }

  function setLoading(btn, isLoading) {
    btn.disabled = isLoading;
    btn.classList.toggle("loading", isLoading);
  }

  applyBtn.addEventListener("click", () => {
    const speed = parseFloat(speedRange.value);
    const techniques = Array.from(techItems)
      .filter(item => item.classList.contains("active"))
      .map(item => item.dataset.tech);

    if (techniques.length === 0) {
      showStatus("Selecione pelo menos uma técnica!", "error");
      return;
    }

    setLoading(applyBtn, true);
    showStatus("Aplicando speed hack...", "info");

    chrome.storage.local.set({ speed, techniques, enabled: true }, () => {
      chrome.runtime.sendMessage(
        { action: "apply", speed, techniques },
        (response) => {
          setLoading(applyBtn, false);
          if (chrome.runtime.lastError) {
            showStatus("Erro: " + chrome.runtime.lastError.message, "error");
            return;
          }
          if (response && response.success) {
            showStatus("Speed Hack ativado: " + speed.toFixed(1) + "x", "success");
          } else {
            showStatus("Erro: " + (response?.error || "desconhecido"), "error");
          }
        }
      );
    });
  });

  resetBtn.addEventListener("click", () => {
    setLoading(resetBtn, true);
    showStatus("Restaurando página...", "info");

    chrome.storage.local.set({ enabled: false }, () => {
      chrome.runtime.sendMessage({ action: "reset" }, (response) => {
        setLoading(resetBtn, false);
        if (chrome.runtime.lastError) {
          showStatus("Erro: " + chrome.runtime.lastError.message, "error");
          return;
        }
        if (response && response.success) {
          showStatus("Página restaurada. Recarregando...", "success");
          speedRange.value = 1;
          speedValue.textContent = "1.0x";
          updatePresetActive(1);
        } else {
          showStatus("Erro: " + (response?.error || "desconhecido"), "error");
        }
      });
    });
  });
});
