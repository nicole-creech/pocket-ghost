import * as path from "path";
import * as vscode from "vscode";
import { getWebviewHtml } from "./getWebviewHtml";

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

const DEFAULT_STATE: GhostState = {
  name: "Wisp",
  happiness: 78,
  energy: 72,
  focusMinutesToday: 0,
  focusSessionsToday: 0,
  streak: 0,
  currentDialogue: "hi bestie... i kept your tab warm ✨",
  focusMode: false,
  focusPaused: false,
  focusSecondsLeft: 25 * 60,
  currentTaskLabel: "",
};

export function activate(context: vscode.ExtensionContext) {
  console.log("Pocket Ghost extension activated");

  const provider = new PocketGhostSidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PocketGhostSidebarProvider.viewType,
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pocketGhost.openSidebar", async () => {
      await vscode.commands.executeCommand("workbench.view.explorer");
      void vscode.window.showInformationMessage(
        "Pocket Ghost is available in the Explorer sidebar."
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pocketGhost.resetAllData", async () => {
      await context.workspaceState.update("pocketGhost.state", DEFAULT_STATE);
      provider.refresh();
      void vscode.window.showInformationMessage(
        "Pocket Ghost data reset successfully."
      );
    })
  );
}

export function deactivate() {}

class PocketGhostSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "pocketGhost.sidebar";

  private view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _resolveContext: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    const mediaRoot = vscode.Uri.file(
      path.join(this.context.extensionPath, "media")
    );

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaRoot],
    };

    webviewView.webview.html = this.buildHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "ready": {
          this.postState();
          return;
        }

        case "rename": {
          const nextState = {
            ...this.getState(),
            name:
              typeof message.name === "string" && message.name.trim()
                ? message.name.trim()
                : DEFAULT_STATE.name,
          };

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "pet": {
          const current = this.getState();
          const nextState: GhostState = {
            ...current,
            happiness: clamp(current.happiness + 8),
            energy: clamp(current.energy - 2),
            currentDialogue: "okay wait i loved that 💜",
          };

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "feed": {
          const current = this.getState();
          const nextState: GhostState = {
            ...current,
            happiness: clamp(current.happiness + 4),
            energy: clamp(current.energy + 10),
            currentDialogue: "fuel acquired ✨",
          };

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "play": {
          const current = this.getState();
          const nextState: GhostState = {
            ...current,
            happiness: clamp(current.happiness + 12),
            energy: clamp(current.energy - 8),
            currentDialogue: "zoomies initiated 👻",
          };

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "startFocus": {
          const current = this.getState();
          const taskLabel =
            typeof message.taskLabel === "string" ? message.taskLabel.trim() : "";

          const nextState: GhostState = {
            ...current,
            focusMode: true,
            focusPaused: false,
            focusSecondsLeft: 25 * 60,
            currentTaskLabel: taskLabel,
            currentDialogue: taskLabel
              ? `focus mode activated for ${taskLabel}. i’m locked in with you ✨`
              : "focus mode activated. one tiny step at a time ✨",
          };

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "pauseFocus": {
          const current = this.getState();
          const nextState: GhostState = {
            ...current,
            focusPaused: true,
            currentDialogue: "okay, little pause. i’ll keep your spot warm 💜",
          };

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "resumeFocus": {
          const current = this.getState();
          const nextState: GhostState = {
            ...current,
            focusPaused: false,
            currentDialogue: "back in it. nice and steady, bestie 💫",
          };

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "endFocus": {
          const current = this.getState();
          const completed =
            typeof message.completed === "boolean" ? message.completed : false;

          const nextState: GhostState = {
            ...current,
            focusMode: false,
            focusPaused: false,
            focusSecondsLeft: 25 * 60,
            focusMinutesToday: completed
              ? current.focusMinutesToday + 25
              : current.focusMinutesToday,
            focusSessionsToday: completed
              ? current.focusSessionsToday + 1
              : current.focusSessionsToday,
            happiness: completed
              ? clamp(current.happiness + 6)
              : current.happiness,
            currentDialogue: completed
              ? "focus complete... i’m proud of you ✨"
              : "that’s okay. we can try again whenever 💜",
            currentTaskLabel: "",
          };

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "tickFocus": {
          const current = this.getState();

          if (!current.focusMode || current.focusPaused) {
            return;
          }

          const nextSeconds = Math.max(0, current.focusSecondsLeft - 1);

          const nextState: GhostState = {
            ...current,
            focusSecondsLeft: nextSeconds,
          };

          if (nextSeconds === 0) {
            nextState.focusMode = false;
            nextState.focusPaused = false;
            nextState.focusSecondsLeft = 25 * 60;
            nextState.focusMinutesToday = current.focusMinutesToday + 25;
            nextState.focusSessionsToday = current.focusSessionsToday + 1;
            nextState.happiness = clamp(current.happiness + 6);
            nextState.currentDialogue = "focus complete... i’m proud of you ✨";
            nextState.currentTaskLabel = "";
          }

          await this.saveState(nextState);
          this.postState();
          return;
        }

        case "resetAll": {
          await this.saveState(DEFAULT_STATE);
          this.postState();
          return;
        }
      }
    });
  }

  public refresh() {
    if (!this.view) return;
    this.view.webview.html = this.buildHtml(this.view.webview);
  }

  private buildHtml(webview: vscode.Webview) {
    const ghostImageUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "media", "wisp-baby-boo.png")
      )
    );

    const ghostStaticImageUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(
          this.context.extensionPath,
          "media",
          "wisp-baby-boo-static.png"
        )
      )
    );

    return getWebviewHtml(webview, this.getState(), {
      ghostImageSrc: ghostImageUri.toString(),
      ghostStaticImageSrc: ghostStaticImageUri.toString(),
    });
  }

  private getState(): GhostState {
    return this.context.workspaceState.get<GhostState>(
      "pocketGhost.state",
      DEFAULT_STATE
    );
  }

  private async saveState(state: GhostState) {
    await this.context.workspaceState.update("pocketGhost.state", state);
  }

  private postState() {
    if (!this.view) return;

    void this.view.webview.postMessage({
      type: "state",
      payload: this.getState(),
    });
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}