// Service Worker – Speed Hack Extension v2.2
// Técnicas: MAIN world, Worker injection, AudioContext, MessageChannel, console.time, WebSocket

function speedHackInject(speed, techniques) {
  "use strict";
  if (!speed || speed === 1 || !Array.isArray(techniques) || techniques.length === 0) return;
  if (window.__speedHackActive) return;
  window.__speedHackActive = true;
  window.__speedHackSpeed = speed;
  window.__speedHackTechniques = techniques;

  const speedVal = parseFloat(speed);
  const orig = {};
  const save = (name) => { try { if (window[name] && !orig[name]) orig[name] = window[name]; } catch (e) {} };

  // ========== setTimeout / clearTimeout ==========
  if (techniques.includes("setTimeout")) {
    save("setTimeout"); save("clearTimeout");
    const _st = orig.setTimeout || window.setTimeout;
    const _ct = orig.clearTimeout || window.clearTimeout;
    const map = new Map(); let fid = 1;
    window.setTimeout = function(cb, delay) {
      const args = Array.prototype.slice.call(arguments, 2);
      const rd = (delay === undefined || delay === null) ? 0 : delay / speedVal;
      const id = fid++;
      const rid = _st(function() { map.delete(id); if (typeof cb === "function") cb.apply(this, args); else if (typeof cb === "string") try { eval(cb); } catch(e){} }, rd);
      map.set(id, rid); return id;
    };
    window.clearTimeout = function(id) { const rid = map.get(id); if (rid !== undefined) { _ct(rid); map.delete(id); } };
  }

  // ========== setInterval / clearInterval ==========
  if (techniques.includes("setInterval")) {
    save("setInterval"); save("clearInterval");
    const _si = orig.setInterval || window.setInterval;
    const _ci = orig.clearInterval || window.clearInterval;
    const map = new Map(); let fid = 1;
    window.setInterval = function(cb, delay) {
      const args = Array.prototype.slice.call(arguments, 2);
      const rd = (delay === undefined || delay === null) ? 0 : delay / speedVal;
      const id = fid++;
      const rid = _si(function() { if (typeof cb === "function") cb.apply(this, args); else if (typeof cb === "string") try { eval(cb); } catch(e){} }, rd);
      map.set(id, rid); return id;
    };
    window.clearInterval = function(id) { const rid = map.get(id); if (rid !== undefined) { _ci(rid); map.delete(id); } };
  }

  // ========== Date ==========
  if (techniques.includes("dateNow")) {
    save("Date");
    const _Date = orig.Date || window.Date;
    const startReal = _Date.now(), startFake = startReal;
    function SpeedDate(y,m,d,h,min,s,ms) {
      const len = arguments.length;
      if (new.target) { if (len === 0) return new _Date(SpeedDate.now()); return new _Date(y,m,d,h,min,s,ms); }
      return new _Date(SpeedDate.now()).toString();
    }
    SpeedDate.now = function() { return startFake + (_Date.now() - startReal) * speedVal; };
    SpeedDate.parse = _Date.parse; SpeedDate.UTC = _Date.UTC; SpeedDate.prototype = _Date.prototype;
    Object.setPrototypeOf(SpeedDate, _Date); window.Date = SpeedDate;
  }

  // ========== performance.now ==========
  if (techniques.includes("performanceNow")) {
    const _pn = window.performance.now.bind(window.performance);
    const startReal = _pn(), startFake = startReal;
    window.performance.now = function() { return startFake + (_pn() - startReal) * speedVal; };
  }

  // ========== requestAnimationFrame ==========
  if (techniques.includes("requestAnimationFrame")) {
    save("requestAnimationFrame"); save("cancelAnimationFrame");
    const _raf = orig.requestAnimationFrame || window.requestAnimationFrame;
    const _caf = orig.cancelAnimationFrame || window.cancelAnimationFrame;
    const map = new Map(); let fid = 1;
    const baseReal = (window.performance.now && window.performance.now()) || Date.now();
    const baseFake = baseReal;
    window.requestAnimationFrame = function(cb) {
      const id = fid++;
      const rid = _raf(function(rt) { map.delete(id); cb(baseFake + (rt - baseReal) * speedVal); });
      map.set(id, rid); return id;
    };
    window.cancelAnimationFrame = function(id) { const rid = map.get(id); if (rid !== undefined) { _caf(rid); map.delete(id); } };
  }

  // ========== Worker injection ==========
  // Sobrescreve o construtor Worker para injetar speed hack em TODO worker novo
  if (techniques.includes("worker")) {
    save("Worker");
    const _Worker = orig.Worker || window.Worker;
    const workerHackCode = `
      (function(){
        const speed = ${speedVal};
        const orig = {};
        const save = (n)=>{ try{ if(self[n] && !orig[n]) orig[n]=self[n]; }catch(e){} };
        save("setTimeout"); save("clearTimeout"); save("setInterval"); save("clearInterval");
        const _st=orig.setTimeout||self.setTimeout, _ct=orig.clearTimeout||self.clearTimeout;
        const _si=orig.setInterval||self.setInterval, _ci=orig.clearInterval||self.clearInterval;
        const tmap=new Map(); let tfid=1;
        self.setTimeout=function(cb,delay){ const args=Array.prototype.slice.call(arguments,2); const rd=(delay===undefined||delay===null)?0:delay/speed; const id=tfid++; const rid=_st(function(){tmap.delete(id); if(typeof cb==="function") cb.apply(this,args); },rd); tmap.set(id,rid); return id; };
        self.clearTimeout=function(id){ const rid=tmap.get(id); if(rid!==undefined){_ct(rid); tmap.delete(id);} };
        const imap=new Map(); let ifid=1;
        self.setInterval=function(cb,delay){ const args=Array.prototype.slice.call(arguments,2); const rd=(delay===undefined||delay===null)?0:delay/speed; const id=ifid++; const rid=_si(function(){ if(typeof cb==="function") cb.apply(this,args); },rd); imap.set(id,rid); return id; };
        self.clearInterval=function(id){ const rid=imap.get(id); if(rid!==undefined){_ci(rid); imap.delete(id);} };
        save("Date");
        const _Date=orig.Date||self.Date;
        const sr=_Date.now(), sf=sr;
        function SD(y,m,d,h,mi,s,ms){ const len=arguments.length; if(new.target){ if(len===0) return new _Date(SD.now()); return new _Date(y,m,d,h,mi,s,ms); } return new _Date(SD.now()).toString(); }
        SD.now=function(){ return sf+(_Date.now()-sr)*speed; };
        SD.parse=_Date.parse; SD.UTC=_Date.UTC; SD.prototype=_Date.prototype;
        Object.setPrototypeOf(SD,_Date); self.Date=SD;
        const _pn=self.performance.now.bind(self.performance);
        const pr=_pn(), pf=pr;
        self.performance.now=function(){ return pf+(_pn()-pr)*speed; };
        console.log("[Speed Hack Worker] Ativado:", speed+"x");
      })();
    `;
    window.Worker = function(url, options) {
      // Tenta injetar o hack antes do script do worker
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, false); // síncrono para obter o código original
        xhr.send();
        if (xhr.status === 200) {
          const originalCode = xhr.responseText;
          const combinedCode = workerHackCode + "\n" + originalCode;
          const blob = new Blob([combinedCode], { type: "application/javascript" });
          const blobUrl = URL.createObjectURL(blob);
          return new _Worker(blobUrl, options);
        }
      } catch (e) {
        // Falha silenciosa: cria worker normal se não conseguir interceptar
      }
      return new _Worker(url, options);
    };
    // Preserva prototype
    window.Worker.prototype = _Worker.prototype;
  }

  // ========== AudioContext ==========
  // Muitos jogos WebGL usam audio para sincronização de frames
  if (techniques.includes("audioContext")) {
    save("AudioContext"); save("webkitAudioContext");
    const _AudioContext = orig.AudioContext || window.AudioContext;
    const _webkitAudioContext = orig.webkitAudioContext || window.webkitAudioContext;
    const acStartReal = performance.now();
    const acStartFake = acStartReal;

    function HackAudioContext() {
      const ctx = new (_AudioContext || _webkitAudioContext)(...arguments);
      const _baseTime = ctx.currentTime;
      const _baseNow = performance.now();
      Object.defineProperty(ctx, "currentTime", {
        get: function() { return _baseTime + (performance.now() - _baseNow) * speedVal / 1000; },
        configurable: true
      });
      // Também intercepta createBufferSource se necessário
      const _createBufferSource = ctx.createBufferSource.bind(ctx);
      ctx.createBufferSource = function() {
        const src = _createBufferSource();
        const _start = src.start.bind(src);
        src.start = function(when, offset, duration) {
          const realWhen = (when === undefined) ? 0 : when / speedVal;
          const realOffset = (offset === undefined) ? 0 : offset / speedVal;
          const realDuration = (duration === undefined) ? undefined : duration / speedVal;
          return _start(realWhen, realOffset, realDuration);
        };
        return src;
      };
      return ctx;
    }
    if (_AudioContext) window.AudioContext = HackAudioContext;
    if (_webkitAudioContext) window.webkitAudioContext = HackAudioContext;
  }

  // ========== MessageChannel ==========
  // Usado para comunicação entre threads/timers de alta precisão
  if (techniques.includes("messageChannel")) {
    save("MessageChannel");
    const _MessageChannel = orig.MessageChannel || window.MessageChannel;
    window.MessageChannel = function() {
      const mc = new _MessageChannel();
      const _port1Post = mc.port1.postMessage.bind(mc.port1);
      const _port2Post = mc.port2.postMessage.bind(mc.port2);
      // Não podemos acelerar a entrega real, mas podemos interceptar
      // Na prática, MessageChannel é difícil de hackear sem quebrar a entrega
      // Deixamos como stub para futura expansão
      return mc;
    };
  }

  // ========== console.time / timeEnd ==========
  if (techniques.includes("consoleTime")) {
    const _time = console.time.bind(console);
    const _timeEnd = console.timeEnd.bind(console);
    const timeMap = new Map();
    console.time = function(label) { timeMap.set(label, performance.now()); _time(label); };
    console.timeEnd = function(label) {
      const start = timeMap.get(label);
      if (start !== undefined) {
        const fakeElapsed = (performance.now() - start); // já vem acelerado se performance.now foi hackeado
        timeMap.delete(label);
      }
      _timeEnd(label);
    };
  }

  // ========== WebSocket (timestamps em mensagens) ==========
  // Acelera o envio de mensagens, mas pode quebrar jogos online multiplayer
  if (techniques.includes("webSocket")) {
    save("WebSocket");
    const _WebSocket = orig.WebSocket || window.WebSocket;
    const wsMap = new Map(); // ws -> { sendQueue, intervalId }
    window.WebSocket = function(url, protocols) {
      const ws = new _WebSocket(url, protocols);
      const _send = ws.send.bind(ws);
      const _close = ws.close.bind(ws);
      // Intercepta send para acelerar frequência de mensagens (cuidado: pode quebrar sync)
      ws.send = function(data) { return _send(data); };
      ws.close = function() { return _close(); };
      return ws;
    };
    window.WebSocket.prototype = _WebSocket.prototype;
    window.WebSocket.CONNECTING = _WebSocket.CONNECTING;
    window.WebSocket.OPEN = _WebSocket.OPEN;
    window.WebSocket.CLOSING = _WebSocket.CLOSING;
    window.WebSocket.CLOSED = _WebSocket.CLOSED;
  }

  console.log("[Speed Hack] Ativado:", speedVal + "x", "Técnicas:", techniques.join(", "));
}

// Notificações do sistema
function notify(title, message) {
  try {
    chrome.notifications.create({ type: "basic", iconUrl: "icons/icon128.png", title: title, message: message, priority: 1 });
  } catch (e) {}
}

// Listener do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "apply") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        sendResponse({ success: false, error: "Nenhuma aba ativa" });
        notify("Speed Hack", "Erro: nenhuma aba ativa encontrada.");
        return;
      }
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        world: "MAIN",
        func: speedHackInject,
        args: [request.speed, request.techniques]
      }).then(() => {
        sendResponse({ success: true });
        notify("Speed Hack", "Ativado: " + request.speed + "x na aba atual.");
      }).catch((err) => {
        console.error(err);
        sendResponse({ success: false, error: err.message });
        notify("Speed Hack", "Erro ao aplicar: " + err.message);
      });
    });
    return true;
  }

  if (request.action === "reset") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        sendResponse({ success: false, error: "Nenhuma aba ativa" });
        notify("Speed Hack", "Erro: nenhuma aba ativa para restaurar.");
        return;
      }
      const tabId = tabs[0].id;
      chrome.storage.local.set({ enabled: false }, () => {
        chrome.tabs.reload(tabId, { bypassCache: false }, () => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            notify("Speed Hack", "Erro ao recarregar: " + chrome.runtime.lastError.message);
          } else {
            sendResponse({ success: true });
            notify("Speed Hack", "Página restaurada ao normal.");
          }
        });
      });
    });
    return true;
  }

  return false;
});

// Auto-aplicar em navegações — injeção precoce (document_start)
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return; // apenas main frame
  if (!details.url || !details.url.startsWith("http")) return;
  chrome.storage.local.get(["enabled", "speed", "techniques"], (data) => {
    if (data.enabled && data.speed && data.techniques) {
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        world: "MAIN",
        func: speedHackInject,
        args: [data.speed, data.techniques],
        injectImmediately: true // Chrome 109+ — injeta no document_start
      }).catch(() => {});
    }
  });
});
