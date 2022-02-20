import {importFiles} from "../../filereader/index.js"
import {setFiles} from "../viewModel.js"

const elements = {
  importModel: document.getElementById("importModel"),
  importModelFile: document.getElementById("importModelFile"),
}

export const initialize = () => {
  elements.importModel.onclick = click
}

const click = async (e) => {
  console.log("click")
  const elem = elements.importModelFile
  const files = await importFiles(elem,"url")
  setFiles(files)
}


