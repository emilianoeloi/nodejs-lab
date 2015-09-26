// Instanciando os módulos Express e Mongoq
var express = require('express');
var mongoq = require('mongoq');
// Configurando a execução do banco MongoDB
var COLLECTION = 'collection_teste';
var DB = 'banco_teste';
var db = mongoq(DB);
var collection = db.collection(COLLECTION);

// Iniciando o servidor Express
var express = require("express");
  var app = express();

// Configuração básica do servidor Express
app.configure(function(){
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.use(app.router);
});

// Rota GET para listar os usuários
app.get('/usuarios', function(req, res){
   // Fazendo uma consulta no banco de dados
   collection.find().toArray(function(err, result){
      res.render('index', { usuarios : result });
   });
});

// Rota GET para consultar um usuário
app.get('/usuarios/:id', function(req, res){
   // Recebendo os parâmetros de um query string
   var id = req.params.id;
   // Fazendo uma consulta no banco de dados
   var params = {usuario : {id: id}};
   collection.find(params).toArray(function(err, result){
      res.render('ver', { usuario : result.usuario });	
   });
});

// Rota POST para cadastrar um usuário
app.post('/usuarios', function(req, res){
   // Recebendo os parâmetros da requisição
   var usuario = req.body.usuario;
   // Persistindo o novo usuário
   collection.insert({usuario : usuario});
   res.redirect('/usuarios');	
});

// Rota PUT para atualizar um usuário
app.put('/usuarios/:id', function(req, res){
   // Recebendo os parâmetros de um query string
   var id = req.params.id;
   // Recebendo os parâmetros da requisição
   var usuario = req.body.usuario;
   // Atualizando dados do usuário que possuir este id
   collection.update({usuario: {id: id }}, {usuario : usuario});
       res.redirect('/usuarios');
   });

// Rota DELETE para excluir um usuário
app.del('/usuarios/:id', function(req, res){
   // Recebendo os parâmetros de um query string
   var id = req.params.id;
   // Excluindo o usuário do banco de dados
   collection.remove({usuario : {id: id }});
   res.redirect('/usuarios');
});
var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
