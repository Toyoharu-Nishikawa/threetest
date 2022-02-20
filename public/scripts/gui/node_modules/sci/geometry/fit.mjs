import * as solve from "../solve/index.mjs"
import * as interpolate from "../interpolate/index.mjs"
import * as basic from "./basic.mjs"

const makeGetRFunc = (p, pSpline, sSpline)=>{
  const pObj = basic.getPointObject(p,pSpline)
  const P = pObj.point
  const nP = pObj.normal
  
  return (s)=>{
    const sObj = basic.getPointObject(s,sSpline)
 
    const S = sObj.point
    const nS = sObj.normal
    const dS = sObj.tangent
    const M = [(P[0]+S[0])/2, (P[1]+S[1])/2]
    const nM = [-(S[1]-P[1]), S[0]-P[0] ]
    const PM = [P[0]-M[0], P[1]-M[1]] 
    const t = - (PM[0]*nM[1]- PM[1]*nM[0])/(nP[0]*nM[1]-nP[1]*nM[0])
    const C = [P[0]+t*nP[0],P[1]+t*nP[1] ]
    const radius = Math.abs(t)*Math.sqrt(nP[0]**2+nP[1]**2)
    return {
      radius: radius, 
      center: C, 
    }   
  }
}

const makedRdsFunc = (p, pSpline, sSpline)=>{
  const pObj = basic.getPointObject(p,pSpline)
  const P = pObj.point
  const nP = pObj.normal
  
  return (s)=>{
    const sObj = basic.getPointObject(s,sSpline)
 
    const S = sObj.point
    const nS = sObj.normal
    const dS = sObj.tangent
    const M = [(P[0]+S[0])/2, (P[1]+S[1])/2]
    const nM = [-(S[1]-P[1]), S[0]-P[0] ]
    const dMds = [dS[0]/2, dS[1]/2]
    const dnMds = [-dS[1], dS[0]]
    const PM = [P[0]-M[0], P[1]-M[1]] 
    const dRds = (PM[0]*nP[1] - PM[1]*nP[0]) * (dnMds[0]*nM[1] - dnMds[1]*nM[0])
      + (nM[0]*nP[1] - nM[1]*nP[0]) * (dMds[0]*nM[1] - dMds[1]*nM[0])
    return dRds 
  }
}

export const getFittingCircle=(p, pSpline, sSpline,N, maxIteration, tolerance)=>{
  const pObj = basic.getPointObject(p,pSpline)
 
  const getRFunc = makeGetRFunc(p, pSpline, sSpline)
  const rObj = [...Array(N+1)].map((v,i)=>getRFunc(i/N)) 

  const radiusList = rObj.map(v=>v.radius)
  const I = radiusList.indexOf(Math.min(...radiusList))
  const sIni = I/N

  const f = makedRdsFunc(p, pSpline, sSpline)
  const x0 = sIni
  const x1 = x0+tolerance
  const y0 = f(x0)
  const y1 = f(x1)
  const dfdx0 = (y1-y0)/tolerance
  const res = solve.lineSplitMethod(x0, f, dfdx0, maxIteration, tolerance)
  if(!res.converged){
    return {
      converged: false
    }
  }
  const s = res.value
  const rObj2 = getRFunc(s)
  const sObj = basic.getPointObject(s,sSpline)
 
  return {
    converged:true,
    P: pObj.point,
    S: sObj.point,
    center: rObj2.center,
    radius: rObj2.radius,
    p: p,
    s: s
  }
}
export const getFittingCircles=(pSpline, sSpline,divisions, N, maxIteration, tolerance)=>{
  const pList =[...Array(divisions+1)].map((v,i)=>i/divisions)
  const fcs = pList.map(p=>getFittingCircle(p,pSpline, sSpline,N, maxIteration, tolerance))
  return fcs 
}

const getMinMax = (x, y, minmax,maxIteration, tolerance)=>{
  if(x.length !==y.length){
    console.log(x.length, y.length)
    throw new Error("x and y must have equal length of array")
    return null
  }
  const N = y.length
  const minmaxTmp = minmax ==="min" ? Math.min(...y): Math.max(...y)
  const index = y.indexOf(minmaxTmp)
  if(index===0 || index===y.length-1 ){
    const minmax = minmaxTmp  
    const t = x[index]
    return {
      converged: true,
      value: minmax,
      t: t
    }
  }
  else{
    const F = interpolate.cubicspline(x, y,0,0,"M")
    const f = F.df 
    const x0 = index/N
    const y0 = f(x0)
    const y1 = f(x0+tolerance)
    const dfdx0 = (y1-y0)/tolerance
    const res = solve.lineSplitMethod(x0, f, dfdx0, maxIteration, tolerance)
    if(!res.converged){
      return {
        converged: false,
        t: null ,
        value: null, 
      }      
    }
    const t = res.value
    
    const g = F.f
    const value = g(t) 
    return {
      converged: true,
      value: value,
      t: t
    }
  } 
}

export const getMinMaxOfList = (list, minmax, maxIteration, tolerance )=>{
  const divisions = list.length-1
  const tList =[...Array(divisions+1)].map((v,i)=>i/divisions)
  const obj = getMinMax(tList, list, minmax, maxIteration, tolerance )
  return obj
}


