var ws           = require("websocket-server"),
    TwitterNode  = require("twitter-node").TwitterNode,
    fs           = require("fs"),
    path         = require("path"),
    EventEmitter = require('events').EventEmitter,
    config       = JSON.parse(fs.readFileSync(process.env.HOME + "/.config.ws.json")),
    socket       = ws.createServer()
;

var Tracker = function(keyword){
  EventEmitter.call(this);
  var twit = this.twit = new TwitterNode({
    user: config.user,
    password: config.password
  });
  twit.action = 'filter';
  twit.headers['User-Agent'] = 'TwitStorm 0.0.1';
  var that = this;
  twit.on('tweet', function(tweet){
    that.emit('tweet', tweet);
  })
    .on('end', function(resp){
      console.log("end");
    })
    .on('error', function(e){
      console.log("error");
    })
    .stream();
}
Tracker.prototype = Object.create(EventEmitter.prototype);

Tracker.prototype.track = function(data){
  try {
    var data = JSON.parse(data);
  } catch(e) { console.log(e); return; }
  if(data.track) {
    this.twit.trackKeywords = [data.track];
    this.tracking = data;
    socket.broadcast(JSON.stringify(data));
    this.twit.stream();
  }
}

Tracker.prototype.current = function(json){
  tracker.currentTweet = json;
}

var tracker = new Tracker("google");

socket.listen(config.ws.port, config.ws.host);
socket.on('connection', function(conn){
  conn.on('message', function(message){
    tracker.track(message);
  });
  conn.on('close', function(){
    console.log('closed connection')
  })
  conn.write(JSON.stringify(tracker.tracking));
  if(tracker.currentTweet) conn.write(tracker.currentTweet);
});

tracker.track(JSON.stringify({ track: "google" }));

tracker.on('tweet', function(tweet){
  tracker.current(JSON.stringify(tweet));
  socket.broadcast(tracker.currentTweet);
});

