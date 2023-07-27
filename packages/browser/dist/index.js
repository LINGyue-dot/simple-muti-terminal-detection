import MutiTerminalDetection from "./core.js";
window.onload = function () {
    new MutiTerminalDetection({
        url: "ws://localhost:4100",
        username: "sean",
        mutiTerminalCallback: () => {
            console.log("--------------- muti login ------------------");
        },
    }).login();
};
//# sourceMappingURL=index.js.map