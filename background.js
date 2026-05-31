// Service Worker – Speed Hack Extension
// Injeta código diretamente no world MAIN da página via executeScript

// Função auto-contida que será serializada e injetada no world MAIN
function speedHackInject(speed, techniques) {
  "use strict";

  if (!speed || speed === 1 || !Array.isArray(techniques) || techniques.length === 0) {
    return;
  }

  // Evita dupla injeção
  if (window.__speedHackActive) return;
  window.__speedHackActive = true;
  window.__speedHackSpeed = speed;
  window.__speedHackTechniques = techniques;

  const orig = {};
  const speedVal = parseFloat(speed);

  // Helper: salva original antes de sobrescrever
  const save = (name) => {
    if (window[name] && !orig[name]) {
      try {
        orig[name] = window[name];
      } catch (e) {}
    }
  };

  // --- setTimeout / clearTimeout ---
  if (techniques.includes("setTimeout")) {
    save("setTimeout");
    save("clearTimeout");
    const _setTimeout = orig.setTimeout || window.setTimeout;
    const _clearTimeout = orig.clearTimeout || window.clearTimeout;
    const timerMap = new Map(); // fakeId -> realId
    let fakeId = 1;

    window.setTimeout = function(callback, delay) {
      const args = Array.prototype.slice.call(arguments, 2);
      const realDelay = (delay === undefined || delay === null) ? 0 : delay / speedVal;
      const id = fakeId++;
      const realId = _setTimeout(function() {
        timerMap.delete(id);
        if (typeof callback === "function") {
          callback.apply(this, args);
        } else if (typeof callback === "string") {
          // Compatibilidade legada (não recomendado, mas suportado)
          try { eval(callback); } catch (e) {}
        }
      }, realDelay);
      timerMap.set(id, realId);
      return id;
    };

    window.clearTimeout = function(id) {
      const realId = timerMap.get(id);
      if (realId !== undefined) {
        _clearTimeout(realId);
        timerMap.delete(id);
      }
    };
  }

  // --- setInterval / clearInterval ---
  if (techniques.includes("setInterval")) {
    save("setInterval");
    save("clearInterval");
    const _setInterval = orig.setInterval || window.setInterval;
    const _clearInterval = orig.clearInterval || window.clearInterval;
    const intervalMap = new Map();
    let fakeId = 1;

    window.setInterval = function(callback, delay) {
      const args = Array.prototype.slice.call(arguments, 2);
      const realDelay = (delay === undefined || delay === null) ? 0 : delay / speedVal;
      const id = fakeId++;
      const realId = _setInterval(function() {
        if (typeof callback === "function") {
          callback.apply(this, args);
        } else if (typeof callback === "string") {
          try { eval(callback); } catch (e) {}
        }
      }, realDelay);
      intervalMap.set(id, realId);
      return id;
    };

    window.clearInterval = function(id) {
      const realId = intervalMap.get(id);
      if (realId !== undefined) {
        _clearInterval(realId);
        intervalMap.delete(id);
      }
    };
  }

  // --- Date.now / new Date() ---
  if (techniques.includes("dateNow")) {
    save("Date");
    const _Date = orig.Date || window.Date;
    const startReal = _Date.now();
    const startFake = startReal;

    function SpeedDate(y, m, d, h, min, s, ms) {
      const len = arguments.length;
      if (new.target) {
        // new Date(...) ou new Date
        if (len === 0) {
          return new _Date(SpeedDate.now());
        }
        return new _Date(y, m, d, h, min, s, ms);
      }
      // Chamada como função: Date() -> string
      return new _Date(SpeedDate.now()).toString();
    }

    SpeedDate.now = function() {
      return startFake + (_Date.now() - startReal) * speedVal;
    };

    SpeedDate.parse = _Date.parse;
    SpeedDate.UTC = _Date.UTC;
    SpeedDate.prototype = _Date.prototype;

    // Preserva propriedades estáticas do Date original
    Object.setPrototypeOf(SpeedDate, _Date);

    window.Date = SpeedDate;
  }

  // --- performance.now ---
  if (techniques.includes("performanceNow")) {
    const _perfNow = window.performance.now.bind(window.performance);
    const startReal = _perfNow();
    const startFake = startReal;

    window.performance.now = function() {
      return startFake + (_perfNow() - startReal) * speedVal;
    };
  }

  // --- requestAnimationFrame ---
  if (techniques.includes("requestAnimationFrame")) {
    save("requestAnimationFrame");
    save("cancelAnimationFrame");
    const _raf = orig.requestAnimationFrame || window.requestAnimationFrame;
    const _caf = orig.cancelAnimationFrame || window.cancelAnimationFrame;
    const rafMap = new Map();
    let fakeId = 1;
    const baseReal = (window.performance.now && window.performance.now()) || _Date.now();
    const baseFake = baseReal;

    window.requestAnimationFrame = function(callback) {
      const id = fakeId++;
      const realId = _raf(function(realTimestamp) {
        rafMap.delete(id);
        const fakeTimestamp = baseFake + (realTimestamp - baseReal) * speedVal;
        callback(fakeTimestamp);
      });
      rafMap.set(id, realId);
      return id;
    };

    window.cancelAnimationFrame = function(id) {
      const realId = rafMap.get(id);
      if (realId !== undefined) {
        _caf(realId);
        rafMap.delete(id);
      }
    };
  }

  console.log("[Speed Hack] Ativado:", speedVal + "x", "Técnicas:", techniques.join(", "));
}

// Listener do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "apply") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        sendResponse({ success: false, error: "Nenhuma aba ativa" });
        return;
      }
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        world: "MAIN", // <-- ESSENCIAL: injeta no mundo da página
        func: speedHackInject,
        args: [request.speed, request.techniques]
      }).then(() => {
        sendResponse({ success: true });
      }).catch((err) => {
        console.error(err);
        sendResponse({ success: false, error: err.message });
      });
    });
    return true; // async response
  }

  if (request.action === "reset") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id, allFrames: true },
        world: "MAIN",
        func: () => {
          window.location.reload();
        }
      });
      sendResponse({ success: true });
    });
    return true;
  }

  return false;
});

// Auto-aplicar em novas abas/navegações se estiver habilitado
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    chrome.storage.local.get(["enabled", "speed", "techniques"], (data) => {
      if (data.enabled && data.speed && data.techniques) {
        chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: true },
          world: "MAIN",
          func: speedHackInject,
          args: [data.speed, data.techniques]
        }).catch(() => {});
      }
    });
  }
});
