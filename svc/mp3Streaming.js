var probe = require('node-ffprobe');

var track = 'digitalmindspodcast1.mp3';

probe(track, function(err, probeData) {
    console.log(probeData);
});