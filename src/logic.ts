import type { RuneClient } from "rune-sdk"

const DRAW_TIMER = 60_000
export const REVIEW_TIMER = 15_000
const END_LENGTH = 30_000

export interface GameState {
  images: Record<string, string>
  prompts: Record<string, string>
  finished: Record<string, boolean>
  selectedPromptPlayerId: string
  selectedPrompt: string
  critiques: Record<string, string>
  winner: string
  timerTotalTime: number
  timerEndsAt: number
  timerName: string
  prompting: boolean
  promptingFor: string
  playerOrder: string[]
}

function startTimer(game: GameState, name: string, length: number) {
  game.timerName = name
  game.timerTotalTime = length
  game.timerEndsAt = Rune.gameTime() + length
}

type GameActions = {
  prompt: (text: string) => void
  image: (params: { finished: boolean; url: string }) => void
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

function checkAllPrompts(game: GameState, allPlayerIds: string[]) {
  for (const id of allPlayerIds) {
    if (!game.prompts[id]) {
      return
    }
  }

  game.selectedPromptPlayerId =
    allPlayerIds[Math.floor(Math.random() * allPlayerIds.length)]
  game.selectedPrompt = game.prompts[game.selectedPromptPlayerId]

  startTimer(game, "drawing", DRAW_TIMER)
}

function promptForNextImage(game: GameState): boolean {
  for (const id of Object.keys(game.images)) {
    if (!game.critiques[id]) {
      game.promptingFor = id
      Rune.ai.promptRequest({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Provide me an comedy arty critique of the following image that is meant to be a picture of '" +
                  game.selectedPrompt +
                  "'. Keep the output to a maximum of 200 characters. Try to make it funny but in the style of an overzealous art critic.",
              },
              {
                type: "image_data",
                image_url: game.images[id],
              },
            ],
          },
        ],
      })
      return true
    }
  }
  return false
}

Rune.initLogic({
  minPlayers: 1,
  maxPlayers: 6,
  setup: () => {
    return {
      images: {},
      prompts: {},
      selectedPromptPlayerId: "",
      selectedPrompt: "",
      critiques: {},
      winner: "",
      timerTotalTime: 0,
      timerEndsAt: 0,
      timerName: "",
      finished: {},
      prompting: false,
      playerOrder: [],
      promptingFor: "",
    }
  },
  updatesPerSecond: 10,
  update: ({ game }) => {
    if (Rune.gameTime() > game.timerEndsAt && game.timerEndsAt !== 0) {
      // clear the timer
      if (game.timerName === "drawing") {
        game.timerEndsAt = 0
        game.timerName = ""
        game.prompting = true

        promptForNextImage(game)
      }
      if (game.timerName === "review") {
        startTimer(game, "end", END_LENGTH)
      }
    }
  },
  ai: {
    promptResponse: ({ response }, { game }) => {
      console.log(response)
      game.critiques[game.promptingFor] = response
      game.playerOrder.push(game.promptingFor)
      if (!promptForNextImage(game)) {
        game.prompting = false
        // we've done all the prompts can continue now
        game.winner =
          game.playerOrder[Math.floor(Math.random() * game.playerOrder.length)]
        startTimer(game, "review", REVIEW_TIMER * game.playerOrder.length)
      }
    },
  },
  events: {
    playerLeft: (playerId, { allPlayerIds, game }) => {
      checkAllPrompts(game, allPlayerIds)
    },
  },
  actions: {
    prompt: (text, { game, playerId, allPlayerIds }) => {
      game.prompts[playerId] = text

      checkAllPrompts(game, allPlayerIds)
    },
    image: (params, { game, playerId, allPlayerIds }) => {
      game.images[playerId] = params.url
      if (params.finished) {
        game.finished[playerId] = true
        for (const id of allPlayerIds) {
          if (!game.finished[id]) {
            return
          }
        }

        game.timerEndsAt = Rune.gameTime() + 1000
      }
    },
  },
})
