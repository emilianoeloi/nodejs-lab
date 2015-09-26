var mongo = require('mongodb');
var express = require('express');
var monk = require('monk');
var request = require('request');
var db =  monk('localhost:27017/firefoxoshmg');
var app = new express();

var enableCORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

app.use(enableCORS);
app.use(express.bodyParser());
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded());

app.use(express.static(__dirname + '/public'));

/**
 * PUSH
 */
var pushVersion = 0;
var pushCollection = db.get('push');
app.get('/push', function(req, res){
    pushCollection.find({}, function(err,doc){
        if(err){
            res.json(500,err);
        }else{
            res.json(doc);
        }

    })
})
app.post('/push', function(req, res){
    var push = req.body;
    pushCollection.insert(push, function(err, doc){
        if(err){
            res.json(500,err);
        }else{
            res.json(201,doc);
        }
    });
})
app.get('/push/:id', function(req, res){
    var id = req.params.id;
    pushCollection.findById(id, function(err,doc){
        if(err){
            res.json(500,err);
        }else if(doc){
            res.json(doc);
        }else{
            res.json(404);
        }

    })
})
app.put('/push/:id', function(req, res){
    var id = req.params.id;
    var push = req.body;
    delete push._id;
    pushCollection.findAndModify({_id:id}, {$set: push}, {multi:false}, function(err, doc){
        if(err){
            res.json(500, err);
        }else if(doc){
            res.json(doc);
        }else{
            res.json(404);
        }
    })

})
app.delete('/push/:id', function(req, res){
    var id = req.params.id;
    pushCollection.remove({_id:id},function(err){
        if(err){
            res.json(500,err);
        }else{
            res.json(204);
        }
    })
})
app.post('/push/send/:id', function(req, res){
    var id = req.params.id;
    pushVersion +=1;
    pushCollection.findById(id, function(err, doc){
        if(err){
            res.json(500, err);
        }else if(doc){
            request.put({
                uri: doc.url,
                body: 'version='+ pushVersion
            }, function(err, body){
                console.log('send Push','novo', doc.url);
                res.json(201);
            })
        }else{
            res.json(404);
        }
    })
})

/**
 * PODCAST
 */
var podcastCollection = db.get('podcast');
app.get('/podcasts', function(req, res){
    var query = req.query.query;
    var callback = function(err,doc){
        if(err){
            res.json(500,err);
        }else{
            res.json(doc);
        }

    };
    if(query) {
        var paramFilter = query.split('=');
        var filter = JSON.parse('{"'+ paramFilter[0]+'" : "'+paramFilter[1] +  '" }');
        podcastCollection.find(filter, callback);
    }else{
        podcastCollection.find({}, callback);
    }

})
app.post('/podcasts', function(req, res){
    var podcast = req.body;
    podcastCollection.insert(podcast, function(err, doc){
        if(err){
            res.json(500,err);
        }else{
            res.json(201,doc);
        }
    });
})
app.get('/podcasts/:id', function(req, res){
    var id = req.params.id;
    podcastCollection.findById(id, function(err,doc){
        if(err){
            res.json(500,err);
        }else if(doc){
            res.json(doc);
        }else{
            res.json(404);
        }

    })
})
app.put('/podcasts/:id', function(req, res){
    var id = req.params.id;
    var podcast = req.body;
    delete podcast._id;
    podcastCollection.findAndModify({_id:id}, {$set: podcast}, {multi:false}, function(err, doc){
        if(err){
            res.json(500, err);
        }else if(doc){
            res.json(doc);
        }else{
            res.json(404);
        }
    })

})
app.delete('/podcasts/:id', function(req, res){
    var id = req.params.id;
    pushCollection.remove({_id:id},function(err){
        if(err){
            res.json(500,err);
        }else{
            res.json(204);
        }
    })
})
app.get('/podcasters', function(req, res){
    var doc = [{ "name" : "radiomundoreal", "title" : "Radio Mundo Real" , "qtde" : 10, "url": "http://www.radiomundoreal.fm/?lang=es" },
        { "name" : "radiolevelup", "title" : "Radio Level Up" , "qtde" : 10, "url":"http://www.radiolevelup.com/" },
        { "name" : "exordium", "title" : "Exordium" , "qtde" : 24, "url":"http://exordium-podcast.blogspot.com.br/" },
        { "name" : "enperpectiva", "title" : "En perspectiva" , "qtde" : 22, "url":"http://podcast.espectador.com/" },
        { "name" : "bastardos", "title" : "Bastardos" , "qtde" : 4, "url":"http://www.poderato.com/bastardos/basta-rdos" },
        { "name" : "eltrianguloobtuso", "title" : "El Triángulo Obtuso" , "qtde" : 19, "url":"http://www.trianguloobtuso.com/" }];

    res.json(doc);

})
app.listen(4000)