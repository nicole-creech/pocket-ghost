import * as vscode from "vscode";

type GhostState = {
  name: string;
  happiness: number;
  energy: number;
  focusMinutesToday: number;
  focusSessionsToday: number;
  streak: number;
  currentDialogue: string;
  focusMode: boolean;
  focusPaused: boolean;
  focusSecondsLeft: number;
  currentTaskLabel: string;
};

type WebviewAssets = {
  ghostImageSrc: string;
  ghostStaticImageSrc: string;
};

export function getWebviewHtml(
  webview: vscode.Webview,
  initialState: GhostState,
  assets: WebviewAssets
) {
  const nonce = getNonce();
  const initialStateJson = JSON.stringify(initialState);

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pocket Ghost</title>
  <style>
    :root {
      color-scheme: dark;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 12px;
      font-family: var(--vscode-font-family);
      background:
        radial-gradient(circle at top, rgba(139, 92, 246, 0.16), transparent 35%),
        linear-gradient(180deg, #0f1020 0%, #17182d 100%);
      color: #fff;
    }

    .shell {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card {
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      border-radius: 18px;
      padding: 14px;
      backdrop-filter: blur(12px);
    }

    .header {
      text-align: center;
    }

    .eyebrow {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.22em;
      color: rgba(255,255,255,0.45);
    }

    .name-input {
      width: 100%;
      margin-top: 8px;
      border: none;
      background: transparent;
      color: white;
      font-size: 22px;
      font-weight: 600;
      text-align: center;
      outline: none;
    }

    .subtle {
      margin-top: 6px;
      font-size: 12px;
      color: rgba(255,255,255,0.58);
      text-align: center;
    }

    .ghost-wrap {
      display: flex;
      justify-content: center;
      margin-top: 8px;
      margin-bottom: 2px;
    }

    .ghost-scene {
      position: relative;
      width: 190px;
      height: 190px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: floaty 3.8s ease-in-out infinite;
      transform-origin: center;
      filter: drop-shadow(0 0 24px rgba(167,139,250,0.14));
    }

    .ghost-img,
    .ghost-static-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
      -webkit-user-drag: none;
      pointer-events: none;
      display: block;
    }

    .ghost-static-img {
      display: none;
    }

    .eye {
      position: absolute;
      top: 72px;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      overflow: hidden;
    }

    .eye.left {
      left: 70px;
    }

    .eye.right {
      left: 106px;
    }

    .eye-bg {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: #24142c;
    }

    .pupil {
      position: absolute;
      inset: 0;
      transform: translate(0px, 0px);
      transition: transform 220ms ease;
    }

    .pupil-main {
      position: absolute;
      left: 5px;
      top: 4px;
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: white;
    }

    .pupil-small {
      position: absolute;
      left: 4px;
      top: 13px;
      width: 3px;
      height: 3px;
      border-radius: 999px;
      background: white;
    }

    .pupil-tiny {
      position: absolute;
      left: 12px;
      top: 12px;
      width: 2px;
      height: 2px;
      border-radius: 999px;
      background: rgba(255,255,255,0.85);
    }

    .eyelid {
      position: absolute;
      inset: 0;
      transform-origin: top center;
      transform: scaleY(0);
      border-radius: 999px;
      background: #eef4ff;
      transition: transform 120ms ease;
    }

    .eye.blinking .eyelid {
      transform: scaleY(1);
    }

    .eye.sleepy .eyelid {
      transform: scaleY(0.34);
    }

    .dialogue {
      margin-top: 10px;
      border-radius: 14px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.9);
      font-size: 13px;
      line-height: 1.4;
    }

    .status-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 12px;
    }

    .status-row {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .status-head {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: rgba(255,255,255,0.58);
    }

    .track {
      height: 8px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      overflow: hidden;
    }

    .fill {
      height: 100%;
      border-radius: 999px;
      background: rgba(255,255,255,0.74);
      transition: width 180ms ease;
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 12px;
    }

    button {
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.08);
      color: white;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease;
    }

    button:hover {
      background: rgba(255,255,255,0.14);
    }

    .focus-card {
      border: 1px solid rgba(196,181,253,0.16);
      background: rgba(167,139,250,0.08);
    }

    .focus-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .focus-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: rgba(221,214,254,0.65);
    }

    .focus-subtitle {
      margin-top: 5px;
      font-size: 12px;
      color: rgba(255,255,255,0.65);
    }

    .timer {
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
    }

    .task-input {
      width: 100%;
      margin-top: 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      color: white;
      padding: 10px 12px;
      font-size: 13px;
      outline: none;
    }

    .focus-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .focus-actions button {
      flex: 1;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .stat {
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      padding: 10px;
    }

    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: rgba(255,255,255,0.4);
    }

    .stat-value {
      margin-top: 6px;
      font-size: 14px;
      font-weight: 600;
    }

    .footer {
      text-align: center;
      font-size: 11px;
      color: rgba(255,255,255,0.38);
    }

    .compact-mode .ghost-img {
      display: none;
    }

    .compact-mode .ghost-img {
      display: none;
    }

    .compact-mode .ghost-static-img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transform: none;
    }

    .compact-mode .eye {
      display: none;
    }

    .compact-mode .ghost-scene {
      width: 170px;
      height: 170px;
    }

    .compact-mode .subtle {
      font-size: 11px;
    }

    @keyframes floaty {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-7px); }
      100% { transform: translateY(0px); }
    }

    @media (max-width: 340px) {
      .card {
        padding: 12px;
        border-radius: 16px;
      }

      .ghost-scene {
        width: 150px;
        height: 150px;
      }

      .name-input {
        font-size: 20px;
      }

      .dialogue {
        font-size: 12px;
        padding: 9px 10px;
      }

      .action-grid {
        grid-template-columns: 1fr;
      }

      .focus-actions {
        flex-direction: column;
      }

      .stats {
        grid-template-columns: 1fr;
      }

      .timer {
        font-size: 22px;
      }
    }

    @media (max-width: 290px) {
      body {
        padding: 8px;
      }

      .card {
        padding: 10px;
      }

      .ghost-scene {
        width: 132px;
        height: 132px;
      }

      .name-input {
        font-size: 18px;
      }

      .subtle,
      .footer {
        font-size: 10px;
      }

      .dialogue {
        font-size: 11px;
        line-height: 1.3;
      }

      button {
        padding: 9px 10px;
        font-size: 11px;
      }

      .timer {
        font-size: 20px;
      }

      .task-input {
        font-size: 12px;
        padding: 9px 10px;
      }
    }

    .ghost-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 8px;
      margin-bottom: 2px;
      overflow: visible;
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="card header">
      <div class="eyebrow">Pocket Ghost</div>
      <input id="nameInput" class="name-input" value="${escapeHtml(
        initialState.name
      )}" />
      <div class="subtle">your tiny spectral coding companion</div>

      <div class="ghost-wrap">
        <div class="ghost-scene" id="ghostScene">
          <img
            class="ghost-img"
            src="${assets.ghostImageSrc}"
            alt="Wisp the ghost companion"
          />

          <img
            class="ghost-static-img"
            src="${assets.ghostStaticImageSrc}"
            alt="Wisp the ghost companion"
          />

          <div class="eye left" id="leftEye">
            <div class="eye-bg"></div>
            <div class="pupil" id="leftPupil">
              <div class="pupil-main"></div>
              <div class="pupil-small"></div>
              <div class="pupil-tiny"></div>
            </div>
            <div class="eyelid"></div>
          </div>

          <div class="eye right" id="rightEye">
            <div class="eye-bg"></div>
            <div class="pupil" id="rightPupil">
              <div class="pupil-main"></div>
              <div class="pupil-small"></div>
              <div class="pupil-tiny"></div>
            </div>
            <div class="eyelid"></div>
          </div>
        </div>
      </div>

      <div id="dialogue" class="dialogue">${escapeHtml(
        initialState.currentDialogue
      )}</div>

      <div class="status-group">
        <div class="status-row">
          <div class="status-head">
            <span>Happiness</span>
            <span id="happinessValue">${initialState.happiness}%</span>
          </div>
          <div class="track">
            <div id="happinessFill" class="fill" style="width: ${
              initialState.happiness
            }%"></div>
          </div>
        </div>

        <div class="status-row">
          <div class="status-head">
            <span>Energy</span>
            <span id="energyValue">${initialState.energy}%</span>
          </div>
          <div class="track">
            <div id="energyFill" class="fill" style="width: ${
              initialState.energy
            }%"></div>
          </div>
        </div>
      </div>

      <div class="action-grid">
        <button id="petBtn">Pet</button>
        <button id="feedBtn">Feed</button>
        <button id="playBtn">Play</button>
      </div>
    </section>

    <section class="card focus-card">
      <div class="focus-top">
        <div>
          <div id="focusTitle" class="focus-title">${
            initialState.focusPaused
              ? "Focus Paused"
              : initialState.focusMode
              ? "Focus Mode"
              : "Ready to Focus"
          }</div>
          <div id="focusSubtitle" class="focus-subtitle">${
            initialState.currentTaskLabel
              ? escapeHtml(initialState.currentTaskLabel)
              : "one task at a time, bestie"
          }</div>
        </div>

        <div id="timer" class="timer">${formatTime(
          initialState.focusSecondsLeft
        )}</div>
      </div>

      <input
        id="taskInput"
        class="task-input"
        placeholder="focus label"
        value="${escapeHtml(initialState.currentTaskLabel)}"
      />

      <div class="focus-actions">
        <button id="startEndBtn">${
          initialState.focusMode ? "End" : "Start"
        }</button>
        <button id="pauseResumeBtn">${
          initialState.focusMode
            ? initialState.focusPaused
              ? "Resume"
              : "Pause"
            : "Reset"
        }</button>
      </div>
    </section>

    <section class="stats">
      <div class="stat">
        <div class="stat-label">Today</div>
        <div id="todayMinutes" class="stat-value">${
          initialState.focusMinutesToday
        }m</div>
      </div>
      <div class="stat">
        <div class="stat-label">Sessions</div>
        <div id="todaySessions" class="stat-value">${
          initialState.focusSessionsToday
        }</div>
      </div>
      <div class="stat">
        <div class="stat-label">Streak</div>
        <div id="streak" class="stat-value">${initialState.streak}</div>
      </div>
    </section>

    <div class="footer">tiny ghost on standby ✨</div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let state = ${initialStateJson};

    const COMPACT_MODE_MAX_WIDTH = 360;

    const nameInput = document.getElementById("nameInput");
    const dialogue = document.getElementById("dialogue");
    const happinessValue = document.getElementById("happinessValue");
    const happinessFill = document.getElementById("happinessFill");
    const energyValue = document.getElementById("energyValue");
    const energyFill = document.getElementById("energyFill");

    const focusTitle = document.getElementById("focusTitle");
    const focusSubtitle = document.getElementById("focusSubtitle");
    const timer = document.getElementById("timer");
    const taskInput = document.getElementById("taskInput");

    const startEndBtn = document.getElementById("startEndBtn");
    const pauseResumeBtn = document.getElementById("pauseResumeBtn");

    const todayMinutes = document.getElementById("todayMinutes");
    const todaySessions = document.getElementById("todaySessions");
    const streak = document.getElementById("streak");

    const petBtn = document.getElementById("petBtn");
    const feedBtn = document.getElementById("feedBtn");
    const playBtn = document.getElementById("playBtn");

    const leftEye = document.getElementById("leftEye");
    const rightEye = document.getElementById("rightEye");
    const leftPupil = document.getElementById("leftPupil");
    const rightPupil = document.getElementById("rightPupil");

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return mins + ":" + String(secs).padStart(2, "0");
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function isCompactMode() {
      return window.innerWidth <= COMPACT_MODE_MAX_WIDTH;
    }

    function applyResponsiveMode() {
      document.body.classList.toggle("compact-mode", isCompactMode());
    }

    function render(nextState) {
      state = nextState;

      nameInput.value = state.name;
      dialogue.textContent = state.currentDialogue;

      happinessValue.textContent = state.happiness + "%";
      happinessFill.style.width = state.happiness + "%";

      energyValue.textContent = state.energy + "%";
      energyFill.style.width = state.energy + "%";

      focusTitle.textContent = state.focusPaused
        ? "Focus Paused"
        : state.focusMode
        ? "Focus Mode"
        : "Ready to Focus";

      focusSubtitle.textContent = state.currentTaskLabel
        ? state.currentTaskLabel
        : "one task at a time, bestie";

      timer.textContent = formatTime(state.focusSecondsLeft);
      taskInput.value = state.currentTaskLabel;

      startEndBtn.textContent = state.focusMode ? "End" : "Start";
      pauseResumeBtn.textContent = state.focusMode
        ? state.focusPaused
          ? "Resume"
          : "Pause"
        : "Reset";

      todayMinutes.textContent = state.focusMinutesToday + "m";
      todaySessions.textContent = String(state.focusSessionsToday);
      streak.textContent = String(state.streak);

      const isSleepy = state.energy < 35;
      leftEye.classList.toggle("sleepy", isSleepy);
      rightEye.classList.toggle("sleepy", isSleepy);

      applyResponsiveMode();
    }

    function blink() {
      if (!isCompactMode()) {
        leftEye.classList.add("blinking");
        rightEye.classList.add("blinking");

        setTimeout(() => {
          leftEye.classList.remove("blinking");
          rightEye.classList.remove("blinking");
        }, state.energy < 35 ? 180 : 120);
      }

      const nextDelay = state.energy < 35
        ? randomInt(2600, 4200)
        : state.focusMode && !state.focusPaused
        ? randomInt(3200, 5200)
        : randomInt(2800, 5200);

      setTimeout(blink, nextDelay);
    }

    function movePupils(x, y) {
      const clampedX = clamp(x, -1.2, 1.2);
      const clampedY = clamp(y, -0.8, 1.2);

      leftPupil.style.transform = "translate(" + clampedX + "px, " + clampedY + "px)";
      rightPupil.style.transform = "translate(" + clampedX + "px, " + clampedY + "px)";
    }

    function applyAmbientLook() {
      if (isCompactMode()) {
        movePupils(0, 0);
        setTimeout(applyAmbientLook, randomInt(2200, 4200));
        return;
      }

      let xMin = -2;
      let xMax = 2;
      let yMin = -0.5;
      let yMax = 2;

      if (state.energy < 35) {
        xMin = -0.8;
        xMax = 0.8;
        yMin = 0.2;
        yMax = 1;
      }

      if (state.focusMode && !state.focusPaused) {
        xMin = -0.7;
        xMax = 0.7;
        yMin = 0;
        yMax = 0.8;
      }

      const x = randomBetween(xMin, xMax);
      const y = randomBetween(yMin, yMax);
      movePupils(x, y);

      setTimeout(applyAmbientLook, randomInt(2200, 4200));
    }

    function randomBetween(min, max) {
      return Math.random() * (max - min) + min;
    }

    function randomInt(min, max) {
      return Math.floor(randomBetween(min, max + 1));
    }

    nameInput.addEventListener("change", () => {
      vscode.postMessage({
        type: "rename",
        name: nameInput.value
      });
    });

    petBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "pet" });
    });

    feedBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "feed" });
    });

    playBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "play" });
    });

    startEndBtn.addEventListener("click", () => {
      if (state.focusMode) {
        vscode.postMessage({
          type: "endFocus",
          completed: false
        });
        return;
      }

      vscode.postMessage({
        type: "startFocus",
        taskLabel: taskInput.value
      });
    });

    pauseResumeBtn.addEventListener("click", () => {
      if (!state.focusMode) {
        vscode.postMessage({ type: "resetAll" });
        return;
      }

      vscode.postMessage({
        type: state.focusPaused ? "resumeFocus" : "pauseFocus"
      });
    });

    window.addEventListener("message", (event) => {
      const message = event.data;

      if (message.type === "state") {
        render(message.payload);
      }
    });

    window.addEventListener("resize", applyResponsiveMode);

    setInterval(() => {
      vscode.postMessage({ type: "tickFocus" });
    }, 1000);

    blink();
    applyAmbientLook();
    applyResponsiveMode();

    vscode.postMessage({ type: "ready" });
    render(state);
  </script>
</body>
</html>
`;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getNonce() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";

  for (let i = 0; i < 16; i += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}