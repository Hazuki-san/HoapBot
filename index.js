const util = require('util')
const cp = require('child_process')
const path = require('path')

// Config
const fs = require('fs')
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8')
const altsfiles = data["alt_txt"];

function startBot (botName) {
  const command = 'node ' + path.join(__dirname, 'hoapbot') + ' ' + botName
  cp.exec(command, (err, stdout, stderr) => {
    if (err) {
      console.log(`Error: ${err}`)
      console.log(`Bot broken: ${botName}`)
      console.log(`Restarting bot ${botName}...`)
      setTimeout(() => startBot(botName), 1000)
      return
    }

    if (stdout) {
      console.log(`Stdout: ${stdout}`)
    }

    if (stderr) {
      console.log(`Stderr: ${stderr}`)
    }
  })
}

const accounts = fs.readFileSync(altsfiles).toString().split(/\r?\n/)

let i = 0
function runNextBot () {
  const botToStart = accounts[i]
  i++
  if (i <= accounts.length) {
    setTimeout(() => {
      //console.log(accounts[i-1])
      startBot(accounts[i-1])
      runNextBot()
    }, 0)
  }
};

runNextBot()