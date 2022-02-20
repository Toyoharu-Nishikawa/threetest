export const linear = (x, y)=>{
  return (x0)=>{
    const index= x.reduce((pre,current,i)=>current <= x0 ? i : pre, 0)
    const i = index === x.length-1 ? x.length-2 : index

    return (y[i+1]-y[i])/(x[i+1]-x[i])*(x0-x[i])+y[i]
  } 
}


export const stepLinear = (x,y) => {
  const f = (t, lim="left") =>{
    const N = x.length
    let j =0
    if(t>x[0]){
      for(let i=0;i<N-1;i++){
        j=i
        const flag = lim ==="left" ? x[i] < t && t <= x[i+1] :  
          x[i] <= t && t < x[i+1]
        if(flag){
          break
        }
      } 
    }
    const s = (y[j+1]-y[j])/(x[j+1]-x[j])*(t-x[j])+y[j]
    return s
  }
  
  return f
}