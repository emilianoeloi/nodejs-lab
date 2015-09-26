var statFirefoxos = require('statFirefoxos');
var body = req.body;
var start = new Date(body.start);
var end = new Date(body.end);
statFirefoxos.updateStats(start, end);
res.json(200,'processando');