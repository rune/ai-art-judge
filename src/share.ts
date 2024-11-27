import shareBackgroundUrl from "./assets/sharebackground.png"
import runeImageUrl from "./assets/runelogo.png"
import logoImageUrl from "./assets/logo.png"

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image()
    image.src = src
    image.crossOrigin = "anonymous"
    image.addEventListener("load", () => {
      resolve(image)
    })
  })
}

export async function share(winnerId: string, text: string, image: string) {
  const backgroundImage = await loadImage(shareBackgroundUrl)
  const logoImage = await loadImage(logoImageUrl)
  const runeLogo = await loadImage(runeImageUrl)
  const playerAvatar = await loadImage(Rune.getPlayerInfo(winnerId).avatarUrl)
  const name = Rune.getPlayerInfo(winnerId).displayName
  const winningImage = await loadImage(image)

  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext("2d")

  if (ctx) {
    ctx.drawImage(backgroundImage, 0, 0)
    ctx.drawImage(logoImage, (canvas.width - logoImage.width) / 2, 200)

    const scale = 1.5
    ctx.drawImage(
      runeLogo,
      canvas.width - runeLogo.width / scale - 100,
      1750,
      runeLogo.width / scale,
      runeLogo.height / scale
    )
    ctx.drawImage(
      playerAvatar,
      100,
      1750,
      runeLogo.height / scale,
      runeLogo.height / scale
    )

    ctx.font = runeLogo.height / (scale * 2) + "px Roboto"
    ctx.fillStyle = "white"
    ctx.fillText(name, 100 + runeLogo.height / scale + 50, 1780)
    ctx.fillStyle = "#F981FF"
    ctx.fillText(
      "is the best artist!",
      100 + runeLogo.height / scale + 50,
      1780 + runeLogo.height / (scale * 2)
    )

    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.roundRect(100, 700, 880, 880, 25)
    ctx.fill()
    ctx.drawImage(winningImage, 190, 790, 680, 680)
    ctx.fillStyle = "black"
    ctx.textAlign = "center"
    ctx.fillText(text, 1080 / 2, 1550)

    Rune.showShareImage(canvas.toDataURL("image/png", 1))
  }
}
