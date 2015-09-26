var FeedParser = require('feedparser')
    , request = require('request')
    , Firebase = require('firebase');

var req = request('http://jovemnerd.com.br/categoria/matando-robos-gigantes/feed/')
    , feedparser = new FeedParser();

var count = 0,
    PodcastController = function(item){

        _separator = ':';
        _fator = 1000/60;
        _remove = 'MRG';
        _number = '';
        _title = '';
        _description = '';
        _link = '';
        _cover = '';
        _published = '';
        _mp3 = '';
        _duration = '';
        _categories = [];


        var parts = item.title.split(_separator);
        if(parts.length == 2){
            _number = parts[0].replace(_remove, '');
            _title = parts[1];
        }else{
            _number = count + ' ';
            _title = item.title;
        }
        _description = item.description;

        try {
            var reg = /src=\".+\.jpg\"/;
            var matches = _description.match(reg);
            _cover = matches[0].split('=')[1].replace('"', '').replace('"', '');
        }catch(e){
            _cover = '';
        }

        _link = item.link;
        _published = item.pubDate;
        if(item['enclosures'] && item['enclosures'][0] && item['enclosures'][0].url){
            _mp3 = item['enclosures'][0].url;
        }else{
            _mp3 = item['enclosures'];
        }
        if(item['itunes:duration'] && item['itunes:duration']['#']){
            _duration = item['itunes:duration']['#'];
        }

        _categories = item['categories'];

        this.getObject = function(){
            var podcast = {};
            podcast.number = _number.trim();
            podcast.title = _title.trim();
            podcast.description = _description;
            podcast.link = _link;
            podcast.cover = _cover;
            podcast.published = _published;
            podcast.mp3 = _mp3;
            podcast.duration = _duration;
            podcast.categories = _categories;
            return podcast;
        }

    }


req.on('error', function (error) {
});
req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(feedparser);
});


feedparser.on('error', function(error) {
});
feedparser.on('readable', function() {
    var stream = this
        , item;


    var myRootRef = new Firebase('https://necp.firebaseIO.com/mrgs');
    var flag = true;
    while (item = stream.read()) {
        var podLocal = new PodcastController(item);
        myRootRef.push().set( podLocal.getObject() );
        count++;
        console.log('contagem', count);
    }
});