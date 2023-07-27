import { parse } from "url";
const InvalidQueryMsg = "query doesn't startsWith 'user=' or there is no user string";
const BeatTimeout = 20000;
export const Ping = "ping";
const Pong = "pong";
export default function factory(
/* istanbul ignore next */
timeout = BeatTimeout) {
    const pool = {};
    return function (ws, request) {
        let username;
        let uid;
        try {
            const { query } = parse(request.url, true);
            if (!query || !query.username || query.uid)
                throw InvalidQueryMsg;
            username = query.username;
            uid = query.uid;
        }
        catch (e) {
            console.log("parse query error", e);
            ws.close(3500, String(e));
            return;
        }
        if (pool[username] && pool[username] !== uid) {
            console.log(`multi-terminal login detected, user=${username}`);
            // TODO doc : 简单写下 close 实现原理
            wsClose(3409, "multi-terminal login detected");
            return;
        }
        pool[username] = uid;
        console.log(`on connection, user=${username}`);
        let timeoutHandler;
        ws.on("message", onMessage);
        ws.on("close", onClose);
        ws.on("open", onOpen);
        function sendPong() {
            ws.send(Pong);
        }
        function handleReceivePing() {
            timeoutCheck();
            sendPong();
        }
        function clearHandler() {
            timeoutHandler && clearTimeout(timeoutHandler);
        }
        function timeoutCheck() {
            clearHandler();
            timeoutHandler = setTimeout(() => {
                console.log(`timeout! unresponsive! user=${username}`);
                wsClose(3400, "unresponsive from backend");
            }, timeout);
        }
        function wsClose(code, reason) {
            ws.close(code, reason);
            clearTimerAndListener();
            deleteUser();
        }
        function clearTimerAndListener() {
            ws.onmessage = undefined;
            ws.onclose = undefined;
            ws.onopen = undefined;
            clearHandler();
        }
        function deleteUser() {
            if (pool[username] === uid) {
                delete pool[username];
            }
        }
        function onMessage(data) {
            if (data.toString() === Ping) {
                console.log(`receive ping, user=${username}`);
                handleReceivePing();
            }
        }
        function onClose(code, reason) {
            console.log(`receive close, user=${username}, code=${code} reason=${reason.toString()}`);
            deleteUser();
            clearHandler();
        }
        function onOpen() {
            timeoutCheck();
        }
    };
}
//# sourceMappingURL=core.js.map