import { REVIEW_TIMER } from "./logic"
import { share } from "./share"
import "./styles.css"
import musicUrl from "./assets/music.mp3"
import clickUrl from "./assets/click.mp3"

const MUSIC = new Audio()
MUSIC.src = musicUrl
MUSIC.loop = true
const CLICK = new Audio()
CLICK.src = clickUrl

MUSIC.play()

function div(id: string): HTMLDivElement {
  return document.getElementById(id) as HTMLDivElement
}

function img(id: string): HTMLImageElement {
  return document.getElementById(id) as HTMLImageElement
}

function textarea(id: string): HTMLTextAreaElement {
  return document.getElementById(id) as HTMLTextAreaElement
}

const canvas = document.getElementById("drawingCanvas") as HTMLCanvasElement
canvas.width = 512
canvas.height = 512

const ctx = canvas.getContext("2d")!
ctx.strokeStyle = "black"
ctx.lineWidth = 3

const isMobile = "ontouchstart" in window
let lastX = 0
let lastY = 0
let finished = false

if (isMobile) {
  canvas.addEventListener("touchstart", (e) => {
    startDraw(e.touches[0].clientX, e.touches[0].clientY)
  })
  canvas.addEventListener("touchmove", (e) => {
    drawTo(e.touches[0].clientX, e.touches[0].clientY)
  })
  canvas.addEventListener("touchend", (e) => {
    drawTo(e.touches[0].clientX, e.touches[0].clientY)
  })
} else {
  let mouseDown = false

  canvas.addEventListener("mousedown", (e) => {
    mouseDown = true
    startDraw(e.clientX, e.clientY)
  })
  canvas.addEventListener("mousemove", (e) => {
    if (mouseDown) {
      drawTo(e.clientX, e.clientY)
    }
  })
  canvas.addEventListener("mouseup", (e) => {
    drawTo(e.clientX, e.clientY)
    mouseDown = false
  })
}

function startDraw(x: number, y: number) {
  x = (x / window.innerWidth) * 512
  y -= canvas.getBoundingClientRect().top
  y = (y / window.innerWidth) * 512

  lastX = x
  lastY = y
}

function drawTo(x: number, y: number) {
  x = (x / window.innerWidth) * 512
  y -= canvas.getBoundingClientRect().top
  y = (y / window.innerWidth) * 512

  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(x, y)
  ctx.stroke()
  lastX = x
  lastY = y
}

function submitImage(finished: boolean) {
  const rescale = document.createElement("canvas")
  rescale.width = 300
  rescale.height = 300
  rescale.getContext("2d")!.drawImage(canvas, 0, 0, 300, 300)
  const url = rescale.toDataURL("image/jpeg", 0.5)

  Rune.actions.image({ url, finished })
}

setInterval(() => {
  if (currentScreen === "drawScreen") {
    if (!finished) {
      submitImage(false)
    }
  }
}, 250)

div("shareButton").addEventListener("click", () => {
  CLICK.play()
  share(winner, winningPrompt, winningImage)
})

div("readyButton").addEventListener("click", () => {
  CLICK.play()
  submitImage(true)
  finished = true
  div("readyButton").style.display = "none"
})

div("doneButton").addEventListener("click", () => {
  MUSIC.play()
  CLICK.play()

  if (textarea("promptTextArea").value.trim().length > 0) {
    div("doneButton").style.display = "none"
    textarea("promptTextArea").disabled = true
    Rune.actions.prompt(textarea("promptTextArea").value)
  }
})

let currentScreen = "startScreen"

function showScreen(screen: string) {
  if (screen !== currentScreen) {
    div(currentScreen).classList.add("disabled")
    div(currentScreen).classList.remove("enabled")

    currentScreen = screen

    div(currentScreen).classList.remove("off")
    div(currentScreen).classList.remove("disabled")
    div(currentScreen).classList.add("enabled")
  }
}

let winner = ""
let winningImage = ""
let winningPrompt = ""

Rune.initClient({
  onChange: ({ game, event, allPlayerIds }) => {
    if (event && event.name === "stateSync" && event.isNewGame) {
      showScreen("startScreen")
      div("doneButton").style.display = "block"
      div("readyButton").style.display = "block"
      textarea("promptTextArea").disabled = false
      textarea("promptTextArea").value = ""

      finished = false
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    for (const playerDiv of [...document.getElementsByClassName("player")]) {
      if (!allPlayerIds.includes(playerDiv.id)) {
        playerDiv.parentElement?.removeChild(playerDiv)
      }
    }

    for (const id of allPlayerIds) {
      let playerDiv = document.getElementById(id)
      if (!playerDiv) {
        playerDiv = document.createElement("div")
        playerDiv.id = id
        playerDiv.classList.add("player")

        const img = document.createElement("img")
        img.src = Rune.getPlayerInfo(id).avatarUrl
        img.classList.add("avatarImg")
        playerDiv.appendChild(img)

        const status = document.createElement("div")
        status.id = id + "-status"
        status.classList.add("avatarStatus")
        status.style.display = "none"
        playerDiv.appendChild(status)

        div("players").appendChild(playerDiv)
      }

      if (game.prompts[id]) {
        div(id + "-status").style.display = "block"
      }
    }

    const remaining = game.timerEndsAt - Rune.gameTime()
    const percent = (Math.max(0, remaining) / game.timerTotalTime) * 100 + "%"
    if (game.timerName === "drawing") {
      showScreen("drawScreen")
      img("promptAvatar").src = Rune.getPlayerInfo(
        game.selectedPromptPlayerId
      ).avatarUrl
      div("drawingTarget").innerHTML = game.selectedPrompt
      div("drawTimerBar").style.width = percent
    }
    if (game.timerName === "review") {
      const time = game.playerOrder.length * REVIEW_TIMER - remaining
      const index = Math.floor(time / REVIEW_TIMER)
      const playerId = game.playerOrder[index]
      showScreen("criticScreen")

      console.log(time, index, playerId)
      if (playerId) {
        img("currentAvatar").src = Rune.getPlayerInfo(playerId).avatarUrl
        img("currentImage").src = game.images[playerId]
        div("playerName").innerHTML = Rune.getPlayerInfo(playerId).displayName
        div("criticText").innerHTML = game.selectedPrompt
        div("robotText").innerHTML = game.critiques[playerId]
      }
    }
    if (game.timerName === "end") {
      showScreen("winScreen")
      img("winnerAvatar").src = Rune.getPlayerInfo(game.winner).avatarUrl
      img("winningImage").src = game.images[game.winner]
      div("winnerLabel").innerHTML = Rune.getPlayerInfo(game.winner).displayName
    }
    if (game.prompting) {
      showScreen("thinkingScreen")
    }
    winner = game.winner
    winningImage = game.images[game.winner]
    winningPrompt = game.selectedPrompt
  },
})
