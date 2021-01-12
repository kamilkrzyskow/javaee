const express = require('express');
const path = require('path');
const app = express();

// Serve static files....
app.use(express.static(__dirname + '/src/main/webapp'));

// Send all requests to index.html
app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname + '/src/main/webapp/index.html'));
});

// default Heroku PORT
app.listen(process.env.PORT || 3000);