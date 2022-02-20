import * as view from "./view.js"

export const initialize = () => {
  console.log("initialize")
  view.clear.initialize()
  view.draw.initialize()
  view.importModel.initialize()
}

export const clear = () => {
  view.draw.clear()
}

export const setFiles = files => {
  const file = files[0]
  const fileFullName = file.filename
  //const url = file.fileData
  const url = URL.createObjectURL(file.file)

  const fileName = fileFullName.split(".").slice(0,-1).join(".")
  const extend = fileFullName.split(".").reverse()[0]

  switch(extend){
    case "json":{
     break
    }
    case "gltf": 
    case "glb": {
     console.log("import gltf")
     view.draw.importGLTF(url)
     break
    }
    default:{
      console.log("Sorry, this file format is not supported")
      break
    }
  }
}

