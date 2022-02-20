"use strict"
export const parseParam =()=>{
  const parameters = decodeURIComponent(location.search).substring(1)
  const paramMap =  parse(parameters)
  return paramMap
}

export const parseHash =()=>{
  const hash = location.hash.slice(1)
  const hashMap =  parse(hahs)
  return hashMap
}

export const parse = (text)=>{
  if(text){
    const param = text.split("&")
    const keyValues = param.map(v=>v.split("="))
    const paramMap = new Map(keyValues)
    return paramMap
  }
  else {
    return new Map();
  }
}

const convertMapToString = (paramMap)=>{
  const paramArray = [...paramMap] 
  const paramString = paramArray.map(v=>v.join("=")).join("&")
  return paramString 
}

export const setHash = (list)=>{
  const hashMap = new Map(list)
  location.hash = convertMapToString(hashMap) 
}
export const addHash = (key,value)=>{
  const hashMap= parseHash()
  hashMap.set(key,value); 
  location.hash = convertMapToString(hashMap) 
}

export const removeHash = (key) =>{
  const hashMap= parseHash()
  hashMap.delete(key) 
  location.hash = convertMapToString(hashMap) 
}

export const setParam = (list)=>{
  const paramMap = new Map(list)
  location.search = convertMapToString(paramMap) 
}

export const addParam = (key,value)=>{
  const paramMap= parseParam()
  paramMap.set(key,value) 
  location.search = convertMapToString(paramMap) 
}

export const removeParam = (key) =>{
  const paramMap= parseParam()
  paramMap.delete(key) 
  location.search = convertMapToString(paramMap) 
}

