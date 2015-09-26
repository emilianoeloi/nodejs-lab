var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'blog',
  password : 's4brina5',
  database : 'blog'
});

connection.connect();

connection.query('SELECT * from wp_posts WHERE post_type = "post" AND post_status = "publish" ORDER BY post_date DESC LIMIT 1', function(err, rows, fields) {
  if (err) throw err;

  console.log('The solution is: ', rows[0].post_content);
});

connection.end();
