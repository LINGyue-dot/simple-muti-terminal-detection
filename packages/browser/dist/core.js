// 心跳间隔
const BeatInterval = 5;
const MS = 1000;
const Ping = "ping";
const Pong = "pong";
const MUTITERMINALCODDE = 3409;
class MutiTerminalDetection {
    /*************** heart beat  ***************/
    constructor(config) {
        /*************** user config ***************/
        this.logoutFlag = false;
        this.activeHandlers = [];
        this.url = config.url;
        this.uid = genUid();
        this.username = config.username;
        this.mutiTerminalCallback = config.mutiTerminalCallback;
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
        this.ws.addEventListener("open", this.onOpen.bind(this));
        this.ws.addEventListener("error", this.onError.bind(this));
        this.ws.addEventListener("close", this.onClose.bind(this));
        this.ws.addEventListener("message", this.onMessage.bind(this));
    }
    logout() {
        this.logoutFlag = true;
        this.wsDestory();
        // TODO 断网重连时候 reconnect
    }
    wsDestory(code, reason) {
        if (!this.ws) {
            return;
        }
        if (code && reason)
            this.ws.close(code, reason);
        else
            this.ws.close();
        // TODO bind 是否会生成新的 function ？
        this.removeListeners();
    }
    removeListeners() {
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
        }
        else {
            window.addEventListener("online", () => {
                _reconnect();
            }, { once: true });
        }
    }
    heartbeat() {
        this.timeoutCheck();
    }
    clearHandler() {
        if (this.timeoutHandler)
            clearTimeout(this.timeoutHandler);
        this.activeHandlers.forEach(clearTimeout);
        this.timeoutHandler = null;
        this.activeHandlers = [];
    }
    timeoutCheck() {
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
        ].map((timeout) => setTimeout(() => {
            this.ping();
        }, timeout));
    }
    wsSend(message) {
        var _a, _b;
        if (((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) !== ((_b = this.ws) === null || _b === void 0 ? void 0 : _b.OPEN)) {
            // TODO ???
            return;
        }
        this.ws.send(JSON.stringify(message));
    }
    ping() {
        this.wsSend(Ping);
    }
    onOpen() {
        console.log("websocket connect");
        this.heartbeat();
    }
    onClose(code, reason) {
        var _a;
        console.log(`onClose : ${code} ${reason}`);
        this.removeListeners();
        const data = JSON.parse(reason);
        if (code === 1006) {
            this.reconnect();
        }
        else if (code === MUTITERMINALCODDE) {
            (_a = this.mutiTerminalCallback) === null || _a === void 0 ? void 0 : _a.call(this);
        }
    }
    onMessage(res) {
        // TODO error handler ?
        if (res === Pong) {
            this.timeoutCheck();
            return;
        }
    }
    onError() { }
}
function genUid() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}
export default MutiTerminalDetection;
//# sourceMappingURL=core.js.map