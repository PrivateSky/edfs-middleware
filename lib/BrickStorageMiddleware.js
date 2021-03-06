const bricks_storage_folder = "brick-storage";
const URL_PREFIX = "/bricks";

function BrickStorageMiddleware(server) {
    const path = require("path");
    require("../flows/BricksManager");

    let storageFolder = path.join(server.rootFolder, bricks_storage_folder);
    if (typeof process.env.EDFS_BRICK_STORAGE_FOLDER !== "undefined") {
        storageFolder = process.env.EDFS_BRICK_STORAGE_FOLDER;
    }

    $$.flow.start("BricksManager").init(storageFolder);
    console.log("Bricks Storage location", storageFolder);

    function setHeaders(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Content-Length, X-Content-Length');
        next();
    }

    function uploadBrick(req, res) {
        $$.flow.start("BricksManager").write(req, (err, result) => {
            res.statusCode = 201;
            if (err) {
                res.statusCode = 500;

                if (err.code === 'EACCES') {
                    res.statusCode = 409;
                }
            }
            res.end(JSON.stringify(result));
        });
    }

    function downloadBrick(req, res) {
        res.setHeader("content-type", "application/octet-stream");
        res.setHeader('Cache-control', 'max-age=31536000'); // set brick cache expiry to 1 year
        $$.flow.start("BricksManager").read(req.params.fileId, res, (err, result) => {
            res.statusCode = 200;
            if (err) {
                console.log(err);
                res.statusCode = 404;
            }
            res.end();
        });
    }

    function downloadMultipleBricks(req, res) {
        res.setHeader("content-type", "application/octet-stream");
        res.setHeader('Cache-control', 'max-age=31536000'); // set brick cache expiry to 1 year
        $$.flow.start("BricksManager").readMultipleBricks(req.query.hashes, res, (err, result) => {
            res.statusCode = 200;
            if (err) {
                console.log(err);
                res.statusCode = 404;
            }
            res.end();
        });
    }

    server.use(`${URL_PREFIX}/*`, setHeaders);
    server.use(`${URL_PREFIX}/downloadMultipleBricks`, downloadMultipleBricks);
    // server.post(`${URL_PREFIX}/`, uploadBrick);
    server.get(`${URL_PREFIX}/:fileId`, downloadBrick);
    server.post(`${URL_PREFIX}`, uploadBrick);
    server.get(`${URL_PREFIX}/:fileId/:dldomain`, downloadBrick);
}

module.exports = BrickStorageMiddleware;
