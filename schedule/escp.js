var FeedParser = require('feedparser')
  , request = require('request')
  , Firebase = require('firebase');

var req = request('http://www.escribacafe.com/feed/podcast/')
  , feedparser = new FeedParser();

var count = 0,
    PodcastController = function(item){

  _separator = '\u2013';
  _fator = 1000/60;
  _remove = 'Podcast';
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
  _link = item.link;
  _published = item.pubDate;
  if(item['enclosures'] && item['enclosures'][0] && item['enclosures'][0].url){
      _mp3 = item['enclosures'][0].url;
  }else{
    _mp3 = item['enclosures'];
  }
  if(item['enclosures'] && item['enclosures'][0] && item['enclosures'][0].length){
      _duration = item['enclosures'][0].length;
  }
  _duration = (_duration / 1000000 ) * 60;

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
  // handle any request errors
});
req.on('response', function (res) {
  var stream = this;

  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

  stream.pipe(feedparser);
});


feedparser.on('error', function(error) {
  // always handle errors
});
feedparser.on('readable', function() {
  // This is where the action is!
  var stream = this
    , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
    , item;

  var nerdcasts = [],
      nerdcast = {};  

	var myRootRef = new Firebase('https://necp.firebaseIO.com/escribacafes');
  while (item = stream.read()) {
    var podLocal = new PodcastController(item);
    myRootRef.push().set( podLocal.getObject() );
    count++;
    /*nerdcast.title = item.title;
    nerdcast.description = item.description;
    nerdcast.link = item.link;
    nerdcast.published = item.pubDate;

    if(item['enclosures'] && item['enclosures'][0] && item['enclosures'][0].url){
      	nerdcast.mp3 = item['enclosures'][0].url;
  	}else{
  		nerdcast.mp3 = item['enclosures'];
  	}

    if(item['enclosures'] && item['enclosures'][0] && item['enclosures'][0].length){
        nerdcast.duration = item['enclosures'][0].length;
    }else{
      nerdcast.mp3 = item['enclosures'];
    }

  	nerdcasts.push(nerdcast);
  	myRootRef.push().set(nerdcast);*/
  }
});