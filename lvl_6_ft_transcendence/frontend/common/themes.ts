
interface IThemes {
  [ name : string ]: {
    background : string
    paddle: string
  }
}

export const themes : IThemes = {
  default: {
    background: "default.png",
    paddle: ""
  },
  fortyTwo: {
    background: "42.jpg",
    paddle: ""
  },
  anime: {
    background: "anime.jpg",
    paddle: ""
  },
  monke: {
    background: "monke.png",
    paddle: "monke.jpeg"
  },
  melo: {
    background: "melo.jpg",
    paddle: ""
  },
  miki: {
    background: "miki.png",
    paddle: ""
  },
  mikao: {
    background: "mikao.jpeg",
    paddle: ""
  }
}

export const amount : number = Object.keys(themes).length