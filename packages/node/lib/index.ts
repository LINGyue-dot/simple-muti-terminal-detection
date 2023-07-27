const express = require("express");
const expressWs = require("express-ws");
const cors = require("cors");
const loginCheckFactory = require("./core");

const expressApp = express();
const { app } = expressWs(expressApp);
app.use(cors());
app.ws("/loginCheck", loginCheckFactory());

app.listen(4100, () => console.log("Listening on port 4100"));
