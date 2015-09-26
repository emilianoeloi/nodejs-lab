var mongo = require('mongodb');
var monk = require('monk');
var request = require('request');
var db = monk('localhost:27017/firefoxos');

var urlStatTemplate = 'https://marketplace.firefox.com/api/v1/stats/app/{marketplaceId}/installs/?_user=emilianoeloi%40gmail.com%2Cb9dbbadd8d759b98738e6f8950b3d6a4b165b61d713ce668fcabd3fa4149877b9bb566ef19ff1303bfa6bc337aafd5bc8d021deec95abff47b4e2afae6331f91%2Cff68e43963b2410e96456c4622b5b08e&end={end}&interval=day&lang=pt-BR&start={start}'
var marketeplaceId = 'nerdcast-player';
var start = '2014-08-05';
var end = '2014-08-04';

var appCollection = db.get('app');
appCollection.find({'active':true}, function(err, doc){

    var appList = [];
    var index = -1;

    var getNextApp = function(){
        index++;
        if(appList[index]){
            return appList[index];
        }
    }

    var getStatsOfApp = function(app){
        if(!app){
            return;
        }
        if(!app.marketplaceId){
            getStatsOfApp(getNextApp());
            return;
        }
        var urlStat = '';
        var startDate
        if(app.lastStat){
            startDate = new Date(app.lastStat);
        }else{
            startDate = new Date(app.published);
        }
        var y = startDate.getFullYear();
        var m = startDate.getMonth()+1;
        var d = startDate.getDate()+1;
        var strStart = y + '-' + m + '-' + d;

        var urlStat = urlStatTemplate.replace('{marketplaceId}', app.marketplaceId)
            .replace('{start}', strStart)
            .replace('{end}', end);
        request(urlStat, function (err, res, body) {
            console.log('req res');
            var fxosStats = JSON.parse(body);
            var id = app._id;
            delete app._id;
            if(app.lastStat && app.instalationList){
                console.log('aaaa');
                for(var index in fxosStats.objects){
                    var item = fxosStats.objects[index];
                    app.instalationList.push(item);
                }
            }else{
                console.log('bbbb');
                app.instalationList = fxosStats.objects;
            }

            app.lastStat = new Date();
            appCollection.findAndModify({_id: id}, {$set: app}, {multi: false}, function (err, doc) {
                if (err) {
                    console.log('err', err);
                } else if (doc) {
                    console.log('sucesso', app);
                } else {
                    console.log('notfound');
                }
                getStatsOfApp(getNextApp());
            })
        })
    }

    console.log('------ INI -----');
    if(!err){
        appList = doc;
        getStatsOfApp(getNextApp());
    }else{
        console.log('Erro', err);
    }
});