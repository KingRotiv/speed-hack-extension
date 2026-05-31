# ⚡ Speed Hack

Extensão para Chrome que acelera a execução de páginas web manipulando temporizadores, relógios e loops de animação diretamente no contexto de execução da página (world MAIN).

---

## 📖 O que faz

Speed Hack intercepta funções nativas do JavaScript que controlam o tempo — como `setTimeout`, `Date.now`, `performance.now` e `requestAnimationFrame` — e as acelera (ou desacelera) por um multiplicador configurável.

Isso permite:
- **Acelerar jogos HTML5** (idle games, clickers, simuladores)
- **Pular animações lentas** em sites
- **Testar comportamento de timers** em alta velocidade
- **Desacelerar** para análise frame-a-frame (0.1x a 10x)

---

## 🚀 Instalação

### Método 1: Carregar sem compactação (recomendado para desenvolvimento)

1. Baixe e extraia o arquivo `speed-hack-extension.zip`
2. Abra o Chrome e navegue até `chrome://extensions/`
3. Ative o **Modo do desenvolvedor** no canto superior direito
4. Clique em **Carregar sem compactação**
5. Selecione a pasta extraída da extensão
6. O ícone ⚡ aparecerá na barra de extensões

### Método 2: Chrome Web Store (quando publicada)

*(Ainda não disponível na loja)*

---

## 🎮 Como usar

1. Abra qualquer site que use JavaScript (jogos, animações, etc.)
2. Clique no ícone **⚡ Speed Hack** na barra de extensões
3. Ajuste o **multiplicador de velocidade** via slider ou presets (0.1x a 10x)
4. Selecione quais **técnicas** deseja ativar
5. Clique em **Aplicar Speed**

A extensão injeta o código diretamente no contexto de execução da página (`world: MAIN`), sobrescrevendo as funções nativas em tempo real.

### Para desativar

Clique em **Restaurar** — a página será recarregada e todas as funções nativas voltam ao normal.

---

## ⚙️ Técnicas disponíveis

| Técnica | Função interceptada | Efeito |
|---------|---------------------|--------|
| **setTimeout** | `window.setTimeout` | Callbacks disparam mais rápido |
| **setInterval** | `window.setInterval` | Loops temporizados acelerados |
| **Date.now** | `Date.now()` e `new Date()` | Relógio do sistema acelerado |
| **performance.now** | `performance.now()` | Timestamps de alta precisão acelerados |
| **requestAnimationFrame** | `requestAnimationFrame` | Loop de animação do browser acelerado |

> **Dica:** Para a maioria dos jogos HTML5, ative **todas** as técnicas. Para sites com animações CSS puras, `requestAnimationFrame` e `performance.now` são suficientes.

---

## 🔧 Como funciona por baixo

### Arquitetura Manifest V3

```
┌─────────────┐     mensagem      ┌──────────────────┐
│   popup     │ ─────────────────>│  background.js   │
│  (UI/UX)    │                   │ (service worker) │
└─────────────┘                   └──────────────────┘
                                         │
                                         │ executeScript
                                         │ world: "MAIN"
                                         ▼
                              ┌──────────────────────┐
                              │   Página do site     │
                              │  window.setTimeout   │
                              │  window.Date         │
                              │  performance.now     │
                              │  requestAnimationFrame│
                              │    ← SOBRESCRITAS    │
                              └──────────────────────┘
```

### Por que `world: "MAIN"`?

No Manifest V3, `chrome.scripting.executeScript` injeta scripts no mundo **isolado** por padrão. Nesse mundo, `window.setTimeout` é uma cópia separada — sobrescrevê-la não afeta os scripts do site.

A Speed Hack usa **`world: "MAIN"`**, que injeta o código diretamente no mesmo contexto de execução dos scripts da página, garantindo que as funções nativas sejam realmente interceptadas.

---

## 🧪 Teste rápido

Para confirmar que o hack está funcionando, abra o console do site (F12 → Console) e execute:

```javascript
const start = Date.now();
setTimeout(() => {
  console.log("Tempo decorrido (fake):", Date.now() - start, "ms");
}, 1000);
```

Com **5x** de speed:
- O `setTimeout` de 1000ms dispara em **~200ms reais**
- `Date.now()` reporta **~1000ms** de diferença

---

## 📁 Estrutura de arquivos

```
speed-hack-extension/
├── manifest.json          # Manifest V3 — permissões e configuração
├── background.js          # Service worker — injeção no world MAIN
├── popup.html             # Interface do popup
├── popup.js               # Lógica da UI e comunicação
├── icons/
  ├── icon16.png             # Ícones da extensão
  ├── icon48.png
  └── icon128.png
```

---

## ⚠️ Limitações e avisos

- **CSP (Content Security Policy):** Sites com CSP extremamente restritivos podem bloquear a injeção. Nesse caso, a extensão tenta injetar via `executeScript` nativo do Chrome, que respeita menos restrições que `<script>` tags.
- **Web Workers:** O hack não afeta Web Workers ou Service Workers isolados. Para acelerar workers, seria necessário injetar código em cada worker individualmente.
- **WebAssembly:** Jogos que usam WASM com seus próprios timers internos podem não ser afetados.
- **React/Vue dev tools:** Alguns frameworks usam `performance.now()` para profiling. Acelera-lo pode distorcer métricas de desenvolvimento.

---

## 🛡️ Privacidade

- **Zero telemetria:** A extensão não envia nenhum dado para servidores externos.
- **Storage local:** Configurações (speed, técnicas, estado) são salvas apenas no `chrome.storage.local` do navegador.
- **Permissões mínimas:** `activeTab`, `scripting`, `storage`, `tabs` — necessárias apenas para injeção e persistência.

---


## 📜 Licença

MIT — uso livre para fins pessoais e educacionais.

> **Aviso:** O uso em jogos online multiplayer pode violar termos de serviço. Use por sua conta e risco.

---

## 🙏 Créditos

Inspirado na extensão [HTML5 Universal Speed Hack](https://chromewebstore.google.com/detail/html5-universal-speed-hac/eckionmoiajpjncecfebdmmbcboblkja) do Chrome Web Store.
