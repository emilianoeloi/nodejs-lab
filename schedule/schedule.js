var mongo = require('mongodb');
var monk = require('monk');
var request = require('request');
var db = monk('localhost:27017/firefoxos');
var podcastRSS = require('podcastrss');
var podcastDAO = require('podcastMongo');
var schedule = require('node-schedule');

function processPodcast(options) {
    podcastRSS.process(options, function (data) {
        if(typeof(data.mp3) != 'string'){
            data.mp3 = '';
        }
        data.podcaster = options.podcaster;
        data.country = options.country;
        podcastDAO.get(data, function (rows) {
            if (rows && rows.length == 0 && data.mp3 && data.mp3 != '') {
                podcastDAO.insert(data, function(inserted){
                    console.log('inserido--->', inserted.podcaster);
                });
            }
        }, function (err) {
            console.log('podcast get error', err);
        })

    });
}

var j = schedule.scheduleJob('15 * * * *', function(){

    console.log('schedule from', new Date());

    var podcasterCollection = db.get('podcaster');

    podcasterCollection.find({}, function(err, doc){
        if(err){
            console.log('podcasterCollection find - error', err);
        }else{
            console.log('total', doc.length);
            for(var index in doc){
                var podcastToProcess = doc[index];
                processPodcast(podcastToProcess);
            }
            console.log('podcasterCollection find success');
        }

    });

});
