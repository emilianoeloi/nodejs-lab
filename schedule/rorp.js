var FeedParser = require('feedparser')
  , request = require('request')
  , Firebase = require('firebase');

var req = request('http://oifm-api.oi.com.br/api/services/site/rss/podcasts/RoncaRonca')
  , feedparser = new FeedParser();

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

  var roncas = [],
      ronca = {};  

	var myRootRef = new Firebase('https://necp.firebaseIO.com/roncaroncas');
  while (item = stream.read()) {
    ronca.number = item['title'].split('#')[1]; 
    ronca.title = item['title'];
    ronca.link = item['link'];
    ronca.published = item.pubDate;
    ronca.mp3 = item['enclosures'][0]['url'];
    ronca.duration = item['enclosures'][0]['length'];
    ronca.description = item['description'];
  	roncas.push(ronca);
  	myRootRef.push().set(ronca);
  }
});