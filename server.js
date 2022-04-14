// Get express and database
const express = require('express')

// create app
const app = express()

// create database
const db = require("./database.js")

// Encode URL
app.use(express.urlencoded({ extended: true }))

// Use express
app.use(express.json())

// Get morgan
const morgan = require('morgan')

// Get fs
const fs = require('fs')




// Get minimist
const args = require("minimist")(process.argv.slice(2))

// Set up port
const port = args.port || process.env.PORT || 5555



// Start an app server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%', port))
});

// Set up help
const help = (`
    server.js [options]
    --port, -p	Set the port number for the server to listen on. Must be an integer
                between 1 and 65535.
    --debug, -d If set to true, creates endlpoints /app/log/access/ which returns
                a JSON access log from the database and /app/error which throws 
                an error with the message "Error test successful." Defaults to 
                false.
    --log		If set to false, no log files are written. Defaults to true.
                Logs are always written to database.
    --help, -h	Return this message and exit.
`)

// echo help
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}



// log using fs
if (args.log == true) {
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}

// Set Up MiddleWare
app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers["referer"],
        useragent: req.headers["user-agent"],
    };

    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)

    next();
});





// ------------------------------------------------------------------------------
// -------------------------------- COIN STUFF ----------------------------------
// ------------------------------------------------------------------------------
function coinFlip() {
    return Math.random() < 0.5 ? 'heads' : 'tails'
}

function coinFlips(flips) {
    const arr = []
    for(let i = 0; i<flips; i++) {
      arr[i] = coinFlip()
    }
    return arr
}


function countFlips(flips) {
    let hCnt = 0
    let tCnt = 0
    for(let i=0; i<flips.length; i++) {
      if(flips[i] == 'heads') {
        hCnt++;
      } else {
        tCnt++;
      }
    }
    if(hCnt == 0 && tCnt == 0) {
      return {}
    }
    if(hCnt == 0) {
      return {tails: tCnt}
    }
    if(tCnt == 0) {
      return {heads: hCnt}
    }
    return { heads: hCnt, tails: tCnt }
}


function flipACoin(call) {
    let res = coinFlip()
    var result;
    if(call == res) {
      result = 'win'
    } else {
      result = 'lose'
    }
    return { call: call, flip: res, result: result }
}

// ------------------------------------------------------------------------------
// -------------------------------- ENDPOINTS ----------------------------------
// ------------------------------------------------------------------------------



app.get('/app/', (req, res) => {
    res.status(200).end('OK')
    res.type("text/plain")
})

app.get('/app/flip/', (req, res) => {
    var temp = coinFlip()
    res.status(200).json({'flip' : temp})
})

app.get('/app/flips/:number/', (req, res) => {
    var temp = coinFlips(req.params.number)
    res.status(200).json({'raw': temp, 'summary': countFlips(temp)})
})

// endpoints for heads and tails
app.get('/app/flip/call/heads/', (req, res) => {
    var temp = flipACoin('heads')
    res.status(200).json(temp)
})

app.get('/app/flip/call/tails/', (req, res) => {
  var temp = flipACoin('tails')
  res.status(200).json(temp)
})

app.use(function(req, res) {
  res.status(404).send("Endpoint does not exist")
  res.type("text/plain")
})

// Default response for any other request
app.use(function(req, res){
  res.status(404).send('404 NOT FOUND')
  res.type("text/plain")
})
  








