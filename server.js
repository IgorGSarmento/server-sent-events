

var http = require('http');
var express = require('express');
var SSE = require('sse');
var cors = require('cors');
var app = express();
var alt = false;

app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-control","no-cache");
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static('public'));

var server = http.createServer(app);
var clients = [];

server.listen(process.env.PORT || 3000, 'cache-devel-flash.ebc', function() {
  var sse = new SSE(server);

  sse.on('connection', function(stream) {
    clients.push(stream);
    console.log('Opened connection 🎉');

    var json = JSON.stringify({ message: 'Gotcha' });
    stream.send(json);
    console.log('Sent: ' + json);

    stream.on('close', function() {
      clients.splice(clients.indexOf(stream), 1);
      console.log('Closed connection 😱');
    });
  });
});

var broadcast = function() {
  //var json = JSON.stringify({ message: 'Hello hello!' });

  if(alt){
    var json = {event: 'red', data: 'Vermelho'};
    alt = false;
  }else{
    var json = {event: 'blue', data: 'Azul'};
    alt = true;
  }

  clients.forEach(function(stream) {
    stream.send(json.event, json.data);
    console.log('Sent: ' + json.data);
  });
}
setInterval(broadcast, 10000)

// can receive from the client with standard http and broadcast

var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.post('/api', function(req, res) {
  var message = JSON.stringify(req.body);
  console.log('Received: ' + message);
  res.status(200).end();

  var json = JSON.stringify({ message: 'Something changed' });
  clients.forEach(function(stream) {
    stream.send(json);
    console.log('Sent: ' + json);
  });
});

app.post('/close', function(req, res) {
  res.status(200).end();
  clients.forEach(function(stream) {
    stream.close();
  });
});

module.exports = app;
