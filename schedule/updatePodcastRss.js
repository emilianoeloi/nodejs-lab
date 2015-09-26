var mongo = require('mongodb');
var monk = require('monk');
var request = require('request');
var db = monk('localhost:27017/firefoxos');
var podcastRSS = require('podcastrss');
var podcastDAO = require('podcastMongo');
var fs = require('fs');
var async = require("async");

function processPodcast(options, callback) {
    podcastRSS.process(options, callback, function (data) {
        if (typeof(data.mp3) != 'string') {
            data.mp3 = '';
        }
        data.podcaster = options.podcaster;
        data.country = options.country;
        podcastDAO.get(data, function (rows) {
            console.log(' --> ', rows);
            if (rows && rows.length == 0 && data.mp3 && data.mp3 != '') {
                podcastDAO.insert(data, function (inserted) {
                    console.log('inserido--->', inserted.podcaster);
                });
            }
        }, function (err) {
            console.log('podcast get error', err);
        })

    });
}

var podcasterCollection = db.get('podcaster');

process.on('exit', function () {
    fs.appendFile('/var/process.log', 'This MUST be saved on exit.');
});
process.on('uncaughtException', function (err) {
    console.error('An uncaught error occurred!');
    console.error(err.stack);
});

podcasterCollection.find({"active": true, "podcaster.name": "pegadinhaMucao"}, function (err, doc) {
    if (err) {
        console.log('podcasterCollection find - error', err);
    } else {
        console.log('total', doc.length);
        async.each(doc, function (d, callback) {
            console.log('d', d);
            processPodcast(d, callback);
        }, function (err) {
            if (err) {
                console.log("Deu erro...");
                process.exit(1);
            } else {
                console.log(" Ok...");
                process.exit(0);
            }
        });
        console.log('podcasterCollection find success');
    }

});
