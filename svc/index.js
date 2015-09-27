var keys = require("../keys/keys");
var OAuth = require('oauth');
var MD5 = require('MD5');
var mongo = require('mongodb');
var express = require('express');
var monk = require('monk');
var request = require('request');
var fs = require('fs');
var $ = require('cheerio');
var dir = require('node-dir');
var db = monk('localhost:27017/firefoxos');
var app = new express();
var instagram = require('instagram-node').instagram();

app.enable('trust proxy');

var statFirefoxos = require('statFirefoxos');
var podcastRSS = require('podcastrss');
var podcastDAO = require('podcastMongo');



var enableCORS = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
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
 * Stats Socket IO
 */
var Realtime = function(){
    var _genericEmit = function(method, obj){
        try{
            socketIO.emit(method, obj);
        }catch(e){}
    }
    this.statsUpdate = function(obj){
        _genericEmit('stats update', obj);
    }
}
var realtime = new Realtime();

/**
 * Server
 */
app.put('/server/firefoxos/updatestats', function(req, res){
    var body = req.body;
    var start = new Date(body.start);
    var end = new Date(body.end);
    console.log('body', body);
    console.log('start', start);
    console.log('end', end);
    statFirefoxos.updateStats(start, end);
    res.json(200,'processando');
})

/**
 * PUSH
 */
var pushVersion = 0;
var pushCollection = db.get('push');
var pushReceivedCollection = db.get('pushReceived');
var notificationCollection =db.get('notification');
app.get('/push', function (req, res) {
    pushCollection.find({}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    })
})
app.get('/push/report/total', function (req, res) {
    pushCollection.count({}, function (err, count) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(count);
        }

    })
})
app.get('/pushReceived', function (req, res) {
    pushReceivedCollection.find({}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    })
})
app.post('/push', function (req, res) {
    var push = req.body;
    pushCollection.insert(push, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.post('/pushReceived', function (req, res) {
    var pushReceived = req.body;
    pushReceivedCollection.insert(pushReceived, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/push/:id', function (req, res) {
    var id = req.params.id;
    pushCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/push/:id', function (req, res) {
    var id = req.params.id;
    var push = req.body;
    delete push._id;
    pushCollection.findAndModify({_id: id}, {$set: push}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/push/:id', function (req, res) {
    var id = req.params.id;
    pushCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})
app.post('/push/send/:id', function (req, res) {
    var id = req.params.id;
    pushVersion += 1;
    pushCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            request.put({
                uri: doc.url,
                body: 'version=' + pushVersion
            }, function (err, body) {
                console.log('send Push', 'novo', doc.url);
                res.json(201);
            })
        } else {
            res.json(404);
        }
    })
})

app.put('/push/sendBatch/:podcastName', function (req, res) {
    var podcastName = req.params.podcastName;
    var send = function(doc, version){
        for (var index in doc) {
            var item = doc[index];
            request.put({
                uri: item.url,
                body: 'version='+version
            }, function (err, body) {
                console.log('Sending', 'return', 'err', err);

            })
        }
    }
    pushCollection.find({'app': podcastName}, function (err, pushs) {
        if (err) {
            res.json(500, err);
        } else {
            notificationCollection.find({'app':podcastName}, function (err, notifications) {
                var version = 0;
                if (err) {
                    res.json(500, err);
                } else {
                    if(notifications.length == 0 ){
                        notificationCollection.insert({'app':podcastName, 'lastVersion':0}, function (err, notification) {
                            if (err) {
                                res.json(500, err);
                            } else {
                                send(pushs, version);
                            }
                        });
                    }else{
                        var current = notifications[0];
                        var id = current._id;
                        delete current._id;
                        current.lastVersion += 1;
                        notificationCollection.findAndModify({_id: id}, {$set: current}, {multi: false}, function (err, updatedNotification) {
                            if (err) {
                                res.json(500, err);
                            } else if (updatedNotification) {
                                send(pushs, updatedNotification.lastVersion);
                            }
                        })
                    }
                }

            })

            res.json(201, 'sending Batch');
        }

    })
})

/**
 * BLOG
 */
app.get('/blog/lastpost', function(req, res){
    var mysql      = require('mysql');
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'blog',
        password : 's4brina5',
        database : 'blog'
    });
    var post = {
        "title":"",
        "content":""
    };

    connection.connect();

    connection.query('SELECT * from wp_posts WHERE post_type = "post" AND post_status = "publish" ORDER BY post_date DESC LIMIT 1', function(err, rows, fields) {
        if (err){
            res.json(err);
        }else{
            post.title = rows[0].post_title;
            post.content = rows[0].post_content.replace(/\r\n/g, "<br />").replace('"','');
            res.json(post);
        }
    });

    connection.end();

});

/**
 * PODCAST
 */
var podcastCollection = db.get('podcast');
app.get('/podcasts', function (req, res) {
    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"published":-1}}');
    }
    if (query) {

        var queryList = query.split('+');
        console.log('podcasts - queryList', queryList);
        var strJSONFilter = [];
        for(var index in queryList){
            var queryItem = queryList[index];
            var paramFilter = queryItem.split('=');
            if('titleParts'.indexOf(paramFilter[0]) != -1 ){
                strJSONFilter.push('"titleParts":{ "$in": ["'+paramFilter[1]+'"] }');
            }else {
                strJSONFilter.push('"' + paramFilter[0] + '" : "' + paramFilter[1] + '"');
            }
        }
        console.log('{' + strJSONFilter.join(',') + '}');
        var filter = JSON.parse('{' + strJSONFilter.join(',') + '}');
        console.log('podcasts - get - filter', filter);

        podcastCollection.find(filter, limitStr, callback);
    } else {
        podcastCollection.find({}, limitStr, callback);
    }

})
app.get('/podcasts/report/total', function (req, res) {
    podcastCollection.count({}, function (err, count) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(count);
        }

    })
})
app.post('/podcasts', function (req, res) {
    var podcast = req.body;
    if(podcast.published){
        podcast.published = new Date(podcast.published);
    }
    podcastCollection.insert(podcast, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/podcasts/:id', function (req, res) {
    var id = req.params.id;
    podcastCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/podcasts/:id', function (req, res) {
    var id = req.params.id;
    var podcast = req.body;
    delete podcast._id;
    if(podcast.published){
        podcast.published = new Date(podcast.published);
    }
    podcastCollection.findAndModify({_id: id}, {$set: podcast}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/podcasts/:id', function (req, res) {
    var id = req.params.id;
    podcastCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * PODCASTER
 */
var async = require("async");

function processPodcast(options, callback) {
    podcastRSS.process(options, callback, function (data) {
        if (typeof(data.mp3) != 'string') {
            data.mp3 = '';
        }
        data.podcaster = options.podcaster;
        data.country = options.country;
        podcastDAO.get(data, function (rows) {
            console.log(' ---(MP3)> ', data.mp3, rows.length);
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
app.put('/podcasters/rss/update/:podcasterName', function(req, res){
    var podcasterName = req.params.podcasterName;
    var filter = JSON.parse('{"active":true, "podcaster.name" : "' + podcasterName + '" }');
    if(podcasterName == 'full'){
        filter = {"active":true};
    }
    podcasterCollection.find(filter, function(err, doc){
        if(err){
            res.json(500, err);
        }else{

            async.each(doc, function (d, callback) {
                processPodcast(d, callback);
            }, function (err) {
                if (err) {
                    console.log("Deu erro...");
                    res.json(500, err);
                } else {
                    res.json(200, "Updated");
                    process.exit(0);
                }
            });
        }

    });

})
app.get('/podcasters/report/total', function (req, res) {
    podcasterCollection.count({}, function (err, count) {
        if (err) {
            res.json(500, err);
        } else if (count) {
            res.json(count);
        }
    })
})
app.get('/podcasters', function (req, res) {
    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"published":-1}}');
    }
    if (query) {
        var paramFilter = query.split('=');
        var filter = JSON.parse('{"' + paramFilter[0] + '" : "' + paramFilter[1] + '" }');
        podcasterCollection.find(filter, limitStr, callback);
    } else {
        podcasterCollection.find({}, limitStr, callback);
    }

})
app.post('/podcasters', function (req, res) {
    var podcaster = req.body;
    podcasterCollection.insert(podcaster, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/podcasters/:id', function (req, res) {
    var id = req.params.id;
    podcasterCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/podcasters/:id', function (req, res) {
    var id = req.params.id;
    var podcaster = req.body;
    delete podcaster._id;
    podcasterCollection.findAndModify({_id: id}, {$set: podcaster}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/podcasters/:id', function (req, res) {
    var id = req.params.id;
    podcasterCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * FEEDBACK
 */
var feedbackCollection = db.get('feedback');
app.get('/feedbacks', function (req, res) {
    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"published":-1}}');
    }
    if (query) {
        var paramFilter = query.split('=');
        var filter = JSON.parse('{"' + paramFilter[0] + '" : "' + paramFilter[1] + '" }');
        feedbackCollection.find(filter, limitStr, callback);
    } else {
        feedbackCollection.find({}, limitStr, callback);
    }

})
app.post('/feedbacks', function (req, res) {
    var feedback = req.body;
    feedbackCollection.insert(feedback, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/feedbacks/:id', function (req, res) {
    var id = req.params.id;
    feedbackCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/feedbacks/:id', function (req, res) {
    var id = req.params.id;
    var feedback = req.body;
    delete feedback._id;
    feedbackCollection.findAndModify({_id: id}, {$set: feedback}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/feedbacks/:id', function (req, res) {
    var id = req.params.id;
    feedbackCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * USER
 */
var userCollection = db.get('user');
var userSessionCollection = db.get('userSession');
app.get('/users', function (req, res) {
    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"created":-1}}');
    }
    if (query) {
        var paramFilter = query.split('=');
        var filter = JSON.parse('{"' + paramFilter[0] + '" : "' + paramFilter[1] + '" }');
        userCollection.find(filter, limitStr, callback);
    } else {
        userCollection.find({}, limitStr, callback);
    }

})
app.post('/users', function (req, res) {
    var user = req.body;
    if(user && user.password){
        user.passwordHash = MD5(user.password);
        delete user.password;
    }
    userCollection.insert(user, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/users/:id', function (req, res) {
    var id = req.params.id;
    userCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/users/:id', function (req, res) {
    var id = req.params.id;
    var user = req.body;
    delete user._id;
    userCollection.findAndModify({_id: id}, {$set: user}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.put('/authenticate', function (req, res) {
    var user = req.body;
    var filter = {};
    if(user.accessToken){
        filter.accessToken = user.accessToken;
    }else{
        user.passwordHash = MD5(user.password);
        delete user.password;
    }
    console.log('authenticate', 'filter', filter);
    userCollection.find(filter, function(err, doc){
        if (err) {
            res.json(500, err);
        } else if (doc && doc.length > 0) {

            var userSession = {};
            var now = new Date();
            var expire = new Date();
            expire.setHours(now.getHours()+1);

            delete doc[0]._id;
            delete doc[0].passwordHash;

            userSession.user = doc[0];
            userSession.expire = expire;
            userSession.token = MD5(user.name + expire.getMilliseconds());

            userSessionCollection.insert(userSession, function(err, doc){
                if(err){
                    res.json(500, err)
                }else{
                    res.json(userSession);
                }
            });

        } else {
            res.json(403);
        }
    });

})
app.delete('/users/:id', function (req, res) {
    var id = req.params.id;
    userCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * Device
 */
var deviceCollection = db.get('device');
app.get('/devices', function (req, res) {
    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"created":-1}}');
    }
    if (query) {
        var paramFilter = query.split('=');
        var filter = JSON.parse('{"' + paramFilter[0] + '" : "' + paramFilter[1] + '" }');
        deviceCollection.find(filter, limitStr, callback);
    } else {
        deviceCollection.find({}, limitStr, callback);
    }

})
app.post('/devices', function (req, res) {
    var device = req.body;

    deviceCollection.insert(device, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/devices/:id', function (req, res) {
    var id = req.params.id;
    deviceCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/devices/:id', function (req, res) {
    var id = req.params.id;
    var device = req.body;
    delete user._id;
    deviceCollection.findAndModify({_id: id}, {$set: device}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/devices/:id', function (req, res) {
    var id = req.params.id;
    deviceCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * App
 */
var appCollection = db.get('app');
app.get('/apps', function (req, res) {
    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"created":-1}}');
    }
    if (query) {
        var filter = {};
        var value = '';
        var paramFilter = query.split('=');
        if(paramFilter[0] == 'active'){
            value = JSON.parse(paramFilter[1]);
        }else{
            value = paramFilter[1];
        }
        filter[paramFilter[0]] = value;
        appCollection.find(filter, limitStr, callback);
    } else {
        appCollection.find({}, limitStr, callback);
    }

})
app.post('/apps', function (req, res) {
    var app = req.body;

    appCollection.insert(app, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/apps/:id', function (req, res) {
    var id = req.params.id;
    appCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/apps/:id', function (req, res) {
    var id = req.params.id;
    var app = req.body;
    delete app._id;
    appCollection.findAndModify({_id: id}, {$set: app}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/apps/:id', function (req, res) {
    var id = req.params.id;
    appCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * Terms
 */
var termCollection = db.get('term');
app.get('/terms', function (req, res) {

    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"created":-1}}');
    }
    if (query) {
        var queryList = query.split('+');
        console.log('queryList', queryList);
        var strJSONFilter = [];
        for(var index in queryList){
            var queryItem = queryList[index];
            var paramFilter = queryItem.split('=');
            if('remember.hours'.indexOf(paramFilter[0]) != -1 ){
                strJSONFilter.push('"remember.hours":{ "$in": ['+paramFilter[1]+'] }');
            }else {
                strJSONFilter.push('"' + paramFilter[0] + '" : "' + paramFilter[1] + '"');
            }
        }
        console.log('{' + strJSONFilter.join(',') + '}');
        var filter = JSON.parse('{' + strJSONFilter.join(',') + '}');
        console.log('terms - get - filter', filter);
        termCollection.find(filter, limitStr, callback);
    } else {
        termCollection.find({}, limitStr, callback);
    }

})
app.post('/terms', function (req, res) {
    var term = req.body;

    termCollection.insert(term, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/terms/:id', function (req, res) {
    var id = req.params.id;
    termCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/terms/:id', function (req, res) {
    var id = req.params.id;
    var term = req.body;
    delete term._id;
    termCollection.findAndModify({_id: id}, {$set: term}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/terms/:id', function (req, res) {
    var id = req.params.id;
    termCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * Register
 */
var registerCollection = db.get('register');
app.get('/registers', function (req, res) {

    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"created":-1}}');
    }
    if (query) {
        var queryList = query.split('+');
        console.log('queryList', queryList);
        var strJSONFilter = [];
        for(var index in queryList){
            var queryItem = queryList[index];
            var paramFilter = queryItem.split('=');
            if('remember.hours'.indexOf(paramFilter[0]) != -1 ){
                strJSONFilter.push('"remember.hours":{ "$in": ['+paramFilter[1]+'] }');
            }else {
                strJSONFilter.push('"' + paramFilter[0] + '" : "' + paramFilter[1] + '"');
            }
        }
        console.log('{' + strJSONFilter.join(',') + '}');
        var filter = JSON.parse('{' + strJSONFilter.join(',') + '}');
        console.log('registers - get - filter', filter);
        registerCollection.find(filter, limitStr, callback);
    } else {
        registerCollection.find({}, limitStr, callback);
    }

})
app.post('/registers', function (req, res) {
    var register = req.body;

    registerCollection.insert(register, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/registers/:id', function (req, res) {
    var id = req.params.id;
    registerCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/registers/:id', function (req, res) {
    var id = req.params.id;
    var register = req.body;
    delete register._id;
    registerCollection.findAndModify({_id: id}, {$set: register}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/registers/:id', function (req, res) {
    var id = req.params.id;
    registerCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * App Instances
 */
var appInstanceCollection = db.get('appInstance');
app.get('/appinstances', function (req, res) {
    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"created":-1}}');
    }
    if (query) {
        var paramFilter = query.split('=');
        var filter = JSON.parse('{"' + paramFilter[0] + '" : "' + paramFilter[1] + '" }');
        appInstanceCollection.find(filter, limitStr, callback);
    } else {
        appInstanceCollection.find({}, limitStr, callback);
    }
    realtime.statsUpdate('Get Instance');
})
app.get('/appinstances/report/total', function (req, res) {
    appInstanceCollection.count({}, function (err, count) {
        if (err) {
            res.json(500, err);
        } else if (count) {
            res.json(count);
        }
    })
})
app.post('/appinstances', function (req, res) {
    var appInstance = req.body;

    appInstanceCollection.insert(appInstance, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
    realtime.statsUpdate('Insert Instance');
})
app.get('/appinstances/:id', function (req, res) {
    var id = req.params.id;
    appInstanceCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.put('/appinstances/:id', function (req, res) {
    var id = req.params.id;
    var appInstance = req.body;
    delete appInstance._id;
    appInstanceCollection.findAndModify({_id: id}, {$set: appInstance}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/appinstances/:id', function (req, res) {
    var id = req.params.id;
    appInstanceCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * Encomendas
 */
var orderCollection = db.get('order');
app.get('/orders', function (req, res) {
    var query = req.query.query;
    var limit = req.query.limit;

    var callback = function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(doc);
        }

    };
    var limitStr = {};
    if (limit) {
        limitStr = JSON.parse('{"limit":"' + limit + '", "sort":{"created":-1}}');
    }
    if (query) {
        var paramFilter = query.split('=');
        var filter = JSON.parse('{"' + paramFilter[0] + '" : "' + paramFilter[1] + '" }');
        orderCollection.find(filter, limitStr, callback);
    } else {
        orderCollection.find({}, limitStr, callback);
    }

})
app.post('/orders', function (req, res) {
    var entity = req.body;

    orderCollection.insert(entity, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(201, doc);
        }
    });
})
app.get('/orders/:id', function (req, res) {
    var id = req.params.id;
    orderCollection.findById(id, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }

    })
})
app.get('/orders/track/:company/:code', function (req, res) {
    var company = req.params.company;
    var code = req.params.code;

    var data = {
        'P_ITEMCODE': '',
        'P_LINGUA' 	: '001',
        'P_TESTE' 	: '',
        'P_TIPO' 	: '001',
        'P_COD_UNI' : code,
        'Z_ACTION' 	: 'Pesquisar',
    };

    request.post({
        'url' : "http://websro.correios.com.br/sro_bin/txect01$.QueryList",
        'form' : data
    }, function(err, response, body, d){

        var parsedHTML = $.load(body);

        parsedHTML('tr').map(function(i, foo) {
            // the foo html element into a cheerio object (same pattern as jQuery)
            foo = $(foo);
            console.log(foo)
            res.json(200, foo.text() );
        })


    })
})
app.put('/orders/:id', function (req, res) {
    var id = req.params.id;
    var entity = req.body;
    delete entity._id;
    orderCollection.findAndModify({_id: id}, {$set: entity}, {multi: false}, function (err, doc) {
        if (err) {
            res.json(500, err);
        } else if (doc) {
            res.json(doc);
        } else {
            res.json(404);
        }
    })

})
app.delete('/orders/:id', function (req, res) {
    var id = req.params.id;
    orderCollection.remove({_id: id}, function (err) {
        if (err) {
            res.json(500, err);
        } else {
            res.json(204);
        }
    })
})

/**
 * Verbetes
 */
app.get('/fourtime/verbetes/search/:verbete', function (req, res) {
    var verbete = req.params.verbete;

    res.json(204, "API Offline");

    /*if(verbete){
        request({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            method: 'POST',
            uri: 'http://apidicionario.fourtime.com/services/dicionario/pesquisa',
            body: 'palavra='+verbete}, function(e, r, b){
            var final = [];
            if(b){
                var a = JSON.parse(b);
                final = a.lista;
            }
            res.json(201, final);

        });
    }else{
        res.json(500, err);
    }*/
})

/**
 * Rdio
 * ./rdio-call --consumer-key=zeb9njqmm9e5pucjvv24mxg2 --consumer-secret=62qcaUa5vJ getPlaybackToken domain=fxos.com.br
 */
app.get('/rdio/playBackToken', function(req, res){

    var oauth = new OAuth.OAuth(
        'http://api.rdio.com/oauth/request_token',
        'http://api.rdio.com/oauth/access_token',
        'zeb9njqmm9e5pucjvv24mxg2',
        '62qcaUa5vJ',
        '1.0A',
        null,
        'HMAC-SHA1'
    );
console.log('a');
    oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
        console.log('rdio - error', error);
        console.log('rdio - oauth_token', oauth_token);
        console.log('rdio - oauth_token_secret', oauth_token_secret);
        console.log('rdio - results', results);
    });

})

/**
 * Echonest
 */
var echonestCacheCollection = db.get('echonestCache');
var ECHONEST_SERVICE_URL = 'http://developer.echonest.com/api/v4/';
var ECHONEST_API_KEY = 'UCI1SZNFEACPDO7B6';

app.get('/echonest/images/artist/:artistId', function (req, res) {
    var artistId = req.params.artistId;
    var cacheObject = {};
    cacheObject.key = artistId;
    cacheObject.method = 'images';

    var getImagesInEchonest = function(id){
        var uri = [];
        uri.push(ECHONEST_SERVICE_URL);
        uri.push('artist/images?');
        uri.push('format=json&');
        uri.push('results=10&');
        uri.push('id=');
        uri.push(id);
        uri.push('&bucket=id:rdio-BR&bucket=tracks');
        uri.push('&');
        uri.push('api_key=');
        uri.push(ECHONEST_API_KEY);

        request({headers: {'content-type' : 'application/x-www-form-urlencoded'},
            method: 'GET',
            uri: uri.join('')}, function(e, r, b){
            var a = JSON.parse(b);
            if(a && a.response && a.response.status && a.response.status.code == 0){
                cacheObject.value = a.response.images;
                echonestCacheCollection.insert(cacheObject);
                res.json(200, cacheObject.value);
            }else{
                res.json(500,null);
            }
        })
    }

    if(artistId){
        echonestCacheCollection.find(cacheObject, function(err, doc){
            if(err || !doc || (doc && doc.length == 0)){
                res.setHeader('from', 'echonest');

                getImagesInEchonest(artistId);
            }else{
                res.setHeader('from', 'cache');

                var fromCache = doc[0].value;
                res.json(200, fromCache);
            }
        })

    }else{
        res.json(500, err);
    }

});

app.get('/echonest/search/artist/:artistToFind', function (req, res) {
    var artistToFind = req.params.artistToFind;
    var cacheObject = {};
    cacheObject.key = artistToFind;
    cacheObject.method = 'search';

    var findInEchonest = function(wordkey){

        var uri = [];
        uri.push(ECHONEST_SERVICE_URL);
        uri.push('artist/search?');
        uri.push('format=json&');
        uri.push('results=10&');
        uri.push('name=');
        uri.push(wordkey);
        uri.push('&');
        uri.push('bucket=id:rdio-BR&');
        uri.push('api_key=');
        uri.push(ECHONEST_API_KEY);

        request({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                method: 'GET',
                uri: uri.join('')},
            function(e, r, b){
                var a = JSON.parse(b);
                if(a && a.response && a.response.status && a.response.status.code == 0){
                    cacheObject.value = a.response.artists;
                    echonestCacheCollection.insert(cacheObject);
                    res.json(200, cacheObject.value);
                }else{
                    res.json(500,null);
                }
            });
    }

    if(artistToFind){
        echonestCacheCollection.find(cacheObject, function(err, doc){
            if(err || !doc || (doc && doc.length == 0)){
                res.setHeader('from', 'echonest');

                findInEchonest(artistToFind);
            }else{
                res.setHeader('from', 'cache');

                console.log('vindo do cache');
                var fromCache = doc[0].value;
                res.json(200, fromCache);
            }
        })

    }else{
        res.json(500, err);
    }
})
app.get('/echonest/artist/:id', function (req, res) {
    var id = req.params.id;
    var cacheObject = {};
    cacheObject.key = id;
    cacheObject.method = 'get';

    var findByIdEchonest = function(id){
        request({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                method: 'GET',
                uri: 'http://developer.echonest.com/api/v4/artist/biographies?api_key=UCI1SZNFEACPDO7B6&id='+id+'&format=json&results=10&start=0&license=cc-by-sa'},
            function(e, r, b){
                var a = JSON.parse(b);
                cacheObject.value = a;
                echonestCacheCollection.insert(cacheObject);
                res.json(200, a);
            });
    }

    if(id){
        echonestCacheCollection.find(cacheObject, function(err, doc){
            if(err || !doc || (doc && doc.length == 0)){
                findByIdEchonest(id);
            }else{
                var fromCache = doc[0].value;
                fromCache['fromCache'] = true;
                res.json(200, fromCache);
            }
        })

    }else{
        res.json(500, err);
    }
})
app.get('/echonest/songs/:artistId', function (req, res) {
    var artistId = req.params.artistId;
    var cacheObject = {};
    cacheObject.key = artistId;
    cacheObject.method = 'images';

    var getSongsInEchonest = function(id){
        var uri = [];
        uri.push(ECHONEST_SERVICE_URL);
        uri.push('song/search?');
        uri.push('format=json&');
        uri.push('results=10&');
        uri.push('artist_id=');
        uri.push(id);
        uri.push('&');
        uri.push('bucket=id:rdio-BR&bucket=tracks&')
        uri.push('api_key=');
        uri.push(ECHONEST_API_KEY);

        console.log(uri.join(''));

        request({headers: {'content-type' : 'application/x-www-form-urlencoded'},
            method: 'GET',
            uri: uri.join('')}, function(e, r, b){
            var a = JSON.parse(b);
            if(a && a.response && a.response.status && a.response.status.code == 0){
                cacheObject.value = a.response.songs;
                echonestCacheCollection.insert(cacheObject);
                res.json(200, cacheObject.value);
            }else{
                res.json(500,null);
            }
        })
    }

    if(artistId){
        echonestCacheCollection.find(cacheObject, function(err, doc){
            if(err || !doc || (doc && doc.length == 0)){
                res.setHeader('from', 'echonest');

                getSongsInEchonest(artistId);
            }else{
                res.setHeader('from', 'cache');

                var fromCache = doc[0].value;
                res.json(200, fromCache);
            }
        })

    }else{
        res.json(500, err);
    }
})

/// Instagram
instagram.use({ client_id: keys.instagram.clientId,
         client_secret: keys.instagram.clientSecret });
app.get('/instagram/lastPost', function (req, res) {

    instagram.user_media_recent(keys.instagram.userId, function(err, result, remaining, limit) {
        var json = {};
        json.err = err;
        json.result = result;
        json.remaining = remaining;
        json.limit = limit;
        res.json(json);
    });

});

app.get('/instagram/lastOneImage', function (req, res) {

    instagram.user_media_recent(keys.instagram.userId, function(err, result, remaining, limit) {
        if (err) {
            res.json(500);
        };
        res.json(result[0].images.standard_resolution);
    });

});

app.listen(3000, function(){
    console.log('listen');
})
