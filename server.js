import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import brojSJRouter from "./routes/api/brojSJRouter.js";
import vrstaSJRouter from "./routes/api/vrstaSJRouter.js";
import imageRouter from "./routes/api/imageRouter.js";
import loginRouter from "./routes/loginRouter.js";
import logoutRouter from "./routes/logoutRouter.js";
import refreshRouter from "./routes/refreshRouter.js";
import verifyJwt from "./authentication/verifyJwt.js";
import objektiRouter from "./routes/api/objektiRouter.js";
import kampoviRouter from "./routes/api/kampoviRouter.js";
import periodiRouter from "./routes/api/periodiRouter.js";
import tockeInteresaRouter from "./routes/api/tockeInteresaRouter.js";
import prijevodiRouter from "./routes/api/prijevodiRouter.js";
import usersRouter from "./routes/api/usersRouter.js";
import stopBookingRouter from "./routes/api/stopBookingRouter.js";
import parametriRouter from "./routes/api/parametriRouter.js";
import natpisiRouter from "./routes/api/natpisiRouter.js";
import cjeniciRouter from "./routes/api/cjeniciRouter.js";
import publicApiRouter from "./routes/publicApiRouter.js";
import objectOwnerCheck from "./middleware/objectOwnerCheck.js";
import functionsBackend from "./functionsBackend.js";
import osuncanostRouter from "./routes/api/osuncanostRouter.js";
import grupeTockiRouter from "./routes/api/grupeTockiRouter.js";
import podlogaRouter from "./routes/api/podlogaRouter.js";
import integracijeRouter from "./routes/api/integracijeRouter.js";
import paymentGwRouter from "./routes/api/paymentGwRouter.js";
import ostalePostavkeRouter from "./routes/api/ostalePostavkeRouter.js";
import paidPackagesRouter from "./routes/api/paidPackagesRouter.js";
import requestLogging from "./middleware/requestLogging.js";
import rateIdWhitelistRouter from "./routes/api/rateIdWhitelistRouter.js";

import db from "./config/dbConfig.js";

const __dirname = path.resolve();
const port = process.env.PORT || 8085;
const cmsRootUrl = "/cms";
const app = express();

app.set("trust proxy", "loopback");

//Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ origin: "*" }));

//setup
import ejs from "ejs";
app.set("views", path.join(__dirname, "..", "kampc_dev", "kampc"));
app.engine("html", ejs.renderFile);
app.set("render engine", ejs);
//set the page
app.get("/camp/:grupacija/:kamp/index", (req, res) => {
  const data = { group: req.params.grupacija, kamp: req.params.kamp };
  res.render(path.join(__dirname, "..", "app", "kamp", "index.html"), data);
});
app.get("/camp/test/:grupacija/:kamp/index", (req, res) => {
  const data = { group: req.params.grupacija, kamp: req.params.kamp };
  res.render(path.join(__dirname, "..", "kampc_dev", "kampc", "index.html"), data);
});
app.get("/camp/:alias", (req, res) => {
  console.log(req.params.alias);
  const sql = "SELECT * FROM aliases WHERE alias = ? AND deleted IS NOT TRUE;";
  const vars = [req.params.alias];
  db.getPool("kamp_aliases").execute(sql, vars, (err, results) => {
    if (err) throw err;
    if (!results.length) return res.sendStatus(404);
    console.log(results);
    res.render(path.join(__dirname, "..", "app", "kamp", "index.html"), {
      group: results[0].grupacija,
      kamp: String(results[0].kampId),
    });
  });
});
//give it what it needs
app.use("/camp/:grupacija/:kamp/", express.static(path.join(__dirname, "..", "app", "kamp")));
app.use(
  "/camp/kamp/views/images",
  express.static(path.join(__dirname, "views", "images"), {
    extensions: ["html"],
  })
);
app.use("/camp/test/:grupacija/:kamp/", express.static(path.join(__dirname, "..", "kampc_dev", "kampc")));
app.use(
  "/camp/test/kamp/views/images",
  express.static(path.join(__dirname, "views", "images"), {
    extensions: ["html"],
  })
);

//Public folder
app.use(
  cmsRootUrl + "/public",
  express.static(path.join(__dirname, "views", "public"), {
    extensions: ["html"],
  })
);

//Images should be public
app.use(cmsRootUrl + "/images", express.static(path.join(__dirname, "views", "images")));

//Public API
app.use(cmsRootUrl + "/api", publicApiRouter);

//Authentication endpoints
app.use(cmsRootUrl + "/login", loginRouter);
app.use(cmsRootUrl + "/refresh", refreshRouter);

//Authentication check
app.use(verifyJwt);

//Logging
app.use(requestLogging);

//Logout
app.use(cmsRootUrl + "/logout", logoutRouter);

//Authenticated ping
app.use(cmsRootUrl + "/api/v1/authenticatedPing", async (req, res) => {
  if (!req.query.propertyId) return res.sendStatus(400);
  if ( await functionsBackend.checkPriviledges(req.db, req.userId, req.query.propertyId)) return res.sendStatus(204);
  return res.sendStatus(403);
});

//API
app.use(cmsRootUrl + "/api/v1", brojSJRouter);
app.use(cmsRootUrl + "/api/v1", vrstaSJRouter);
app.use(cmsRootUrl + "/api/v1", imageRouter);
app.use(cmsRootUrl + "/api/v1", objektiRouter);
app.use(cmsRootUrl + "/api/v1", kampoviRouter);
app.use(cmsRootUrl + "/api/v1", periodiRouter);
app.use(cmsRootUrl + "/api/v1", tockeInteresaRouter);
app.use(cmsRootUrl + "/api/v1", prijevodiRouter);
app.use(cmsRootUrl + "/api/v1", usersRouter);
app.use(cmsRootUrl + "/api/v1", stopBookingRouter);
app.use(cmsRootUrl + "/api/v1", parametriRouter);
app.use(cmsRootUrl + "/api/v1", natpisiRouter);
app.use(cmsRootUrl + "/api/v1", cjeniciRouter);
app.use(cmsRootUrl + "/api/v1", osuncanostRouter);
app.use(cmsRootUrl + "/api/v1", grupeTockiRouter);
app.use(cmsRootUrl + "/api/v1", podlogaRouter);
app.use(cmsRootUrl + "/api/v1", integracijeRouter);
app.use(cmsRootUrl + "/api/v1", paymentGwRouter);
app.use(cmsRootUrl + "/api/v1", ostalePostavkeRouter);
app.use(cmsRootUrl + "/api/v1", paidPackagesRouter);
app.use(cmsRootUrl + "/api/v1", rateIdWhitelistRouter);

//js functions
app.use(cmsRootUrl + "/functions", express.static(path.join(__dirname, "views", "functions")));

//vlasnik objekta page and javascript
app.get(cmsRootUrl + "/objektiVlasnik", async (req, res) => {
  if (await functionsBackend.isVlasnikObjekta(req.db, req.userId))
    res.sendFile(path.join(__dirname, "views", "objektiVlasnik.html"));
  else res.sendStatus(403);
});
app.get(cmsRootUrl + "/objektiVlasnik.js", async (req, res) => {
  if (await functionsBackend.isVlasnikObjekta(req.db, req.userId))
    res.sendFile(path.join(__dirname, "views", "objektiVlasnik.js"));
  else res.sendStatus(403);
});
app.get(cmsRootUrl + "/loader.css", async (req, res) => {
  res.sendFile(path.join(__dirname, "views", "loader.css"));
});

//objectOwnerCheck
app.use(objectOwnerCheck);

//Home page
app.get(cmsRootUrl + "/", (req, res) => {
  res.redirect(cmsRootUrl + "/dashboard");
});

//Frontend files
app.use(cmsRootUrl, express.static(path.join(__dirname, "views"), { extensions: ["html"] }));

//Start server
app.listen(port, () => {
  console.log("Listening on port: " + port);
});
