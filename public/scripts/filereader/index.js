"user strict"

const readFile = (file,type,encoding)=>{
  const reader = new FileReader();
  return new Promise((resolve,reject)=>{
    reader.onerror = (e)=>{
      reject("error",file.name, e)
    }
    reader.onload= (e)=>{
      const filename = file.name;
      const lastDotPosition = filename.lastIndexOf('.');
      const bareFilename = filename.substr(0, lastDotPosition);
      const fileExtension = filename.substr(lastDotPosition+1).toLowerCase();
      const fileData = e.target.result;
      const data = {
        file: file,
        filename: filename,
        barefilename: filename,
        ext: fileExtension,
        fileData: fileData,
      }         
      resolve(data)
    }
    switch(type){
      case "url":
      case "Url":
      case "URL":{
        reader.readAsDataURL(file)
        break
      }
      case "text":
      case "Text":
      case "TEXT":
      default :{
        reader.readAsText(file, encoding)
        break
      }
    }
  })
}//end of readFile

const stop = (e)=>{
  e.stopPropagation()
  e.target.value =null
}
      
export const importFiles = (elem, type="text", encoding="UTF-8")=> {
  return new Promise((resolve, reject)=>{
    elem.onchange = async (e)=>{
      const startEvent = new Event("read.start")
      elem.dispatchEvent(startEvent)
      const filelist = [...e.target.files]
      const fileData = await Promise.all(filelist.map(async (v)=>await readFile(v,type,encoding)))
      const endEvent = new CustomEvent("read.finish",{detail:fileData})
      elem.dispatchEvent(endEvent)
      resolve(fileData)
    }
    elem.onclick= stop 
    elem.click(); //fire click event
  })
}
