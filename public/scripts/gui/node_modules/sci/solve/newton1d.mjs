export const newtonMethod1D = (x0,f,df, maxIteration,tolerance)=>{
  let x=x0
  let y = f(x)
  let dfdx = df(x0) 
  let count=0
  while(count<maxIteration){
    const dx = -y/dfdx
    x +=dx
    y = f(x)
    if(Math.abs(y)<tolerance){
      break
    }
    dfdx = df(x) 
    count++
  }
  const result = {
    converged: count < maxIteration ? true: false,
    error : Math.abs(y),
    count :count,
    value: x,
  }
  return result 
}


export const asyncNewtonMethod1D = async (x0,f,df,maxIteration,tolerance)=>{
  let x=x0
  let y = await f(x)
  let dfdx = await df(x0) 
  let count=0
  while(count<maxIteration){
    const dx = -y/dfdx
    x +=dx
    y = f(x)
    if(Math.abs(y)<tolerance){
      break
    }
    dfdx = df(x) 
    count++
  }
  const result = {
    converged: count < maxIteration ? true: false,
    error : Math.abs(y),
    count :count,
    value: x,
  }
  return result 
}


