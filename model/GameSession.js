const GameSessionStatus = require('./GameSessionStatus')

//TODO
let words = [
  'apple',
  'banana',
  'cherry'
]

//TODO actual model object
class GameSession {

  constructor(userId) {
    //TODO
    this.id = 0
    this.userId = userId
    this.status = GameSessionStatus.IN_PROGRESS
    this.word = this.getRandomWord()
    this.tries = 0
    this.hangman = 0
    this.foundLetters = []
    this.failingLetters = []
  }

  getRandomWord() {
    return words[Math.floor(Math.random() * words.length)].toUpperCase()
  }

}
// export class to use with require
module.exports = GameSession;