const fs = require('fs');
const https = require('https');
const express = require('express');
const routeHandlers = require('./routeHandlers');
const compression = require('compression');
const path = require('path');
const http = require('http');
const net = require('net');
const Debug = require('./debug');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(compression());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../public')));

// Mount the router on the app
app.use('/', routeHandlers);

// Read the key and the certificate
const privateKey = fs.readFileSync('./web-server/private_key.pem', 'utf8');
const certificate = fs.readFileSync('./web-server/certificate.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

// Create an HTTPS service
const httpsServer = https.createServer(credentials, app);

const httpServer = http.createServer((req, res) => {
    // Redirect to https
    res.writeHead(301, { 'Location': `https://${req.headers.host}${req.url}` });
    Debug.debug(`Redirecting to https://${req.headers.host}${req.url}`);
    res.end();
});

const commonPort = 3000;

const server = net.createServer(socket => {
    socket.once('data', buffer => {
        // Determine if this is an HTTP or HTTPS request
        const byte = buffer[0];

        const serverToProxy = byte === 22 ? httpsServer : httpServer;

        const proxy = net.createConnection({
            host: 'localhost',
            port: serverToProxy.address().port
        }, () => {
            proxy.write(buffer);
            socket.pipe(proxy).pipe(socket);
        });
    });
}).listen(commonPort, () => {
    Debug.log(`Proxy server listening on port ${commonPort}`);

    httpServer.listen(0);
    httpsServer.listen(0);
});



