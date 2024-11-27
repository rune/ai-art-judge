import type { RuneClient } from "rune-sdk"

export interface GameState {
  images: Record<string, string>
  prompts: Record<string, string>
  selectedPromptPlayerId: string
  selectedPrompt: string
  critiques: Record<string, string>
  winner: string
}

type GameActions = {
  prompt: (text: string) => void
  image: (url: string) => void
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 2,
  setup: () => {
    return {
      images: {},
      prompts: {},
      selectedPromptPlayerId: "",
      selectedPrompt: "",
      critiques: {},
      winner: ""
    }
  },
  actions: {
    prompt: (text, { game, playerId }) => {
      game.prompts[playerId] = text
    },
    image: (url, { game, playerId }) => {
      game.images[playerId] = url
    },
  },
})
