import MutiTerminalDetection from "./core.ts";

window.onload = function () {
  new MutiTerminalDetection({
    url: "ws://localhost:4100",
    username: "sean",
    mutiTerminalCallback: () => {
      console.log("--------------- muti login ------------------");
    },
  }).login();
};
