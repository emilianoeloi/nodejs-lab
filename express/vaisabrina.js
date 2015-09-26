var express = require('express');
var app = express();

app.get('/', function(req, res){
  res.send('Vai Sabrina');
});

app.listen(3000);
