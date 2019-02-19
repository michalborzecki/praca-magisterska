var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/test_urls', function (req, res) {
  var testDir = './public/tests';
  var isDirectory = source => fs.lstatSync(source).isDirectory()
  var urls = fs.readdirSync(testDir)
    .map(name => path.join(testDir, name))
    .filter(isDirectory)
    .map(name => path.join(name, 'index.html').slice('public/'.length));
    
  res.send(JSON.stringify({
    urls: urls,
  }));
});

app.get('/tests_config', function (req, res) {
  var testsConfig = fs.readFileSync('./tests-config.json');
  res.send(testsConfig);
});

app.post('/tests_result', function (req, res) {
  console.log(JSON.stringify(req.body))
  res.end();
});

var server = app.listen(4200, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
});
