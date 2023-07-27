import express from "express";
import expressWs from "express-ws";
import loginCheckFactory from "./core";
const expressApp = express();
const { app } = expressWs(expressApp);
app.ws("/loginCheck", loginCheckFactory());
app.listen(4100, () => console.log("Listening on port 4100"));
//# sourceMappingURL=index.js.map