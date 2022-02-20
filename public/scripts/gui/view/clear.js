import {clear} from "../viewModel.js"

const elements = {
  clear: document.getElementById("clear"),
}

export const initialize = () => {
  elements.clear.onclick = click
}

const click = async (e) => {
  console.log("click")
  clear()
}


