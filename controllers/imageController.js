import path from "path";
import fs from "fs";
//import sharp from "sharp";
const __dirname = path.resolve();

const recieveImage = (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);

  Object.keys(req.files).forEach((key) => {
    req.files[key].mv(
      path.join(
        __dirname,
        "views",
        "images",
        req.db.substring(3),
        req.headers.kampid,
        req.files[key].name
      ),
      (err) => {
        if (err) return res.sendStatus(500);
      }
    );
  });
  return res
    .status(201)
    .send({ pathPart: req.db.substring(3) + "/" + req.headers.kampid });
};

const sendIconsList = (req, res) => {
  const folder = req.db.substring(3);
  let icons = [];
  if (fs.existsSync(path.join(__dirname, "views", "sprite_images", folder))) {
    icons.push(
      ...fs
        .readdirSync(path.join(__dirname, "views", "sprite_images", folder))
        .map((i) => folder + "/" + i)
    );
  }
  icons.push(
    ...fs
      .readdirSync(path.join(__dirname, "views", "sprite_images", "default"))
      .map((i) => "default/" + i)
  );
  res.send(icons);
};

const sendPanorama = (req, res) => {
  const path = req.query.path;
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>360&deg; Image</title>
    <meta name="description" content="360&deg; Image - A-Frame">
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
  </head>
  <body>
    <a-scene>
      <a-entity camera look-controls="reverseMouseDrag: true" position="0 1.6 0"></a-entity>
      <a-sky src="https://campsabout.com/cms/fullsize/${path}" rotation="0 -130 0"></a-sky>
    </a-scene>
  </body>
</html>
`;
  res.send(html);
};

const sendSmallerImage = (req, res) => {
  const imagePath = path.join(req.originalUrl.replace("/images", ""));
  //res.send(sharp(imagePath).resize(1024).toBuffer());
  res.sendStatus(404);//TODO sharp ne radi na serveru iz nekog razloga. Istražiti pa reaktivirati.
};

export default { recieveImage, sendIconsList, sendPanorama, sendSmallerImage };
