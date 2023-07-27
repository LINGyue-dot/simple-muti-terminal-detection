interface MutiTerminalDetectionConfig {
  username: string;
  mutiTerminalCallback: () => void;
  url: string;
}

// 心跳间隔
const BeatInterval = 5;
const MS = 1000;
const Ping = "ping";
const Pong = "pong";
const MUTITERMINALCODDE = 3409;

class MutiTerminalDetection {
  ws: WebSocket | undefined;
  uid: string = genUid();
  private timer: NodeJS.Timeout | null;

  //#region user config
  private logoutFlag = false;
  url: string;

  mutiTerminalCallback: () => void;
  username: string;
  //#endregion

  //#region heart beat  ***************/
  private timeoutHandler: NodeJS.Timeout | null;
  private activeHandlers: NodeJS.Timeout[] = [];
  //#endregion

  constructor(private config: MutiTerminalDetectionConfig) {
    this.url = config.url;
    this.uid = genUid();
    this.username = config.username;
    this.mutiTerminalCallback = config.mutiTerminalCallback;

    this.onOpen = this.onOpen.bind(this);
    this.onError = this.onError.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onMessage = this.onMessage.bind(this);
  }

  login() {
    this.createWs();
  }

  createWs() {
    this.wsDestory();
    const url = new URL(this.url);
    url.search = new URLSearchParams({
      username: this.username,
      uid: this.uid,
    }).toString();
    this.ws = new WebSocket(url);
    this.ws.addEventListener("open", this.onOpen);
    this.ws.addEventListener("error", this.onError);
    this.ws.addEventListener("close", this.onClose);
    this.ws.addEventListener("message", this.onMessage);
  }

  logout() {
    this.logoutFlag = true;
    this.wsDestory();

    // TODO 断网重连时候 reconnect
  }

  wsDestory(code?: number, reason?: string) {
    if (!this.ws) {
      return;
    }

    if (code && reason) this.ws.close(code, reason);
    else this.ws.close();

    this.removeListeners();
  }

  private removeListeners() {
    this.ws.removeEventListener("open", this.onOpen.bind(this));
    this.ws.removeEventListener("error", this.onError.bind(this));
    this.ws.removeEventListener("close", this.onClose.bind(this));
    this.ws.removeEventListener("message", this.onMessage.bind(this));
    this.ws = undefined;

    this.clearHandler();
  }

  reconnect() {
    const _reconnect = () => {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      // 避免被多次 reconnect
      this.timer = setTimeout(() => {
        this.createWs();
      }, 200);
    };

    if (navigator.onLine) {
      _reconnect();
    } else {
      window.addEventListener(
        "online",
        () => {
          _reconnect();
        },
        { once: true }
      );
    }
  }

  private heartbeat() {
    this.timeoutCheck();
  }

  private clearHandler() {
    if (this.timeoutHandler) clearTimeout(this.timeoutHandler);
    this.activeHandlers.forEach(clearTimeout);
    this.timeoutHandler = null;
    this.activeHandlers = [];
  }
  private timeoutCheck() {
    this.clearHandler();
    this.timeoutHandler = setTimeout(() => {
      console.log("接收后端 pong 数据超时");
      this.wsDestory();
      this.reconnect();
    }, BeatInterval * 4 * MS);
    this.activeHandlers = [
      BeatInterval * MS,
      BeatInterval * 2 * MS,
      BeatInterval * 3 * MS,
    ].map((timeout) =>
      setTimeout(() => {
        this.ping();
      }, timeout)
    );
  }

  wsSend(message: string) {
    if (this.ws?.readyState !== this.ws?.OPEN) {
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  private ping() {
    this.wsSend(Ping);
  }

  private onOpen() {
    console.log("websocket connect");
    this.heartbeat();
  }

  private onClose({ code, reason }: { code: number; reason: string }) {
    console.log(`onClose : ${code} ${reason}`);
    this.removeListeners();

    const data = JSON.parse(reason);
    if (code === 1006) {
      this.reconnect();
    } else if (code === MUTITERMINALCODDE) {
      this.mutiTerminalCallback?.();
    }
  }
  private onMessage(res) {
    // TODO error handler ?
    if (res === Pong) {
      this.timeoutCheck();
      return;
    }
  }
  private onError() {}
}

function genUid() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

export default MutiTerminalDetection;
