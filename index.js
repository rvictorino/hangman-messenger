const express = require('express');
const bodyParser = require('body-parser');

const GameSession = require('./model/GameSession');
const GameSessionStatus = require('./model/GameSessionStatus');

const app = express();


//TODO db
//TODO manipulate js object as Model
let gameSessions = []

function getCurrentGameSession(userId) {
  //TODO return data from a db ?
  // for now, picking into an array
  return gameSessions.filter(s => s.userId === parseInt(userId) && s.status === GameSessionStatus.IN_PROGRESS)[0]
}

//TODO remove
function getGameSession(sessionId) {
  return gameSessions.filter(s => s.id === parseInt(sessionId))[0]
}

// json parsing middleware
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));


// serve static files in assets directory
app.use('/assets', express.static('assets'))

// serve html to have a testing client
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

// serve game session as json string
app.get('/game/:session_id', (req, res) => {
  let currentSession = getGameSession(req.params.session_id)
  console.log(`Playing with game session: ${currentSession.id}`)

  res.send(JSON.stringify(currentSession))
})


// continue an existing game sessing by user id
app.get('/continue/:user_id', (req, res) => {

  let currentSession = getCurrentGameSession(req.params.user_id)
  console.log(`Continue session for user: ${req.params.user_id}, id: ${currentSession.id}`)

  if (currentSession === undefined) {
    // if session does not exist, redirect to new
    res.redirect(`/new/${req.params.user_id}`)
  } else {
    // continue playing
    res.redirect(`/game/${currentSession.id}`)
  }
})

// new game session command
app.get('/new/:user_id', (req, res) => {
  // start new game

  let newGame = new GameSession(req.params.user_id)
  //TODO remove when db
  newGame.id = gameSessions.reduce((s1, s2) => s1 > s2.id ? s1 : s2.id, 0) + 1
  console.log(`New session for user: ${req.params.user_id}, id: ${newGame.id}`)

  gameSessions.push(newGame)

  res.redirect(`/game/${newGame.id}`)
})



// play a round, giving a letter
app.post('/guess/:session_id', (req, res) => {

  let gameSession = getGameSession(req.params.session_id)
  console.log(gameSession)

  if (gameSession.status != GameSessionStatus.IN_PROGRESS) {
    res.redirect(`/game/${gameSession.id}`)
    return
  }

  // HTTP POST data
  let letter = req.body.letter.toUpperCase()

  if (gameSession.foundLetters.includes(letter)) {
    // letter is correct but already found
    console.log(`Playing ${gameSession.id}, letter: ${letter} is already found`)
    gameSession.hangman += 1

  } else if (gameSession.word.split('').includes(letter)) {
    // letter is correct
    console.log(`Playing ${gameSession.id}, letter: ${letter} is correct!`)
    gameSession.foundLetters.push(letter)

  } else if (gameSession.failingLetters.includes(letter)) {
    // letter is not correct but already tried
    console.log(`Playing ${gameSession.id}, letter: ${letter} has already been tried`)
    gameSession.hangman += 1

  } else {
    // letter is not correct
    console.log(`Playing ${gameSession.id}, letter: ${letter} is not in the word`)
    gameSession.hangman += 1
    gameSession.failingLetters.push(letter)
  }

  gameSession.tries += 1
  if (gameSession.word.split('').every(l => gameSession.foundLetters.includes(l))) {
    // all letters have been found
    gameSession.status = GameSessionStatus.WON
    console.log(`Game won!`)
  }
  if (gameSession.hangman >= 11) {
    // = number of lines to draw a complete hangman
    gameSession.status = GameSessionStatus.LOST
    console.log(`Game lost!`)
  }


  res.redirect(`/game/${gameSession.id}`)
})








//curl -X GET "localhost:3000/webhook?hub.verify_token=123456789&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe"

//curl -H "Content-Type: application/json" -X POST "localhost:3000/webhook" -d '{"object": "page", "entry": [{"messaging": [{"message": "TEST_MESSAGE"}]}]}'

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {


    //
    // // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "123456789"
    //
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    } else {
        console.log('fail')
        res.send('fail')
    }
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        console.log('not working');
        res.sendStatus(404);
    }

});

// start server
app.listen(3000, () => console.log('Webhook server is listening, port 3000'));