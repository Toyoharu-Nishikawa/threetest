import * as matrix from "../matrix/index.mjs"
import * as solve from "../solve/index.mjs"

export const getPointObject = (p, pSpline) =>{
  const px = pSpline.X(p)
  const py = pSpline.Y(p)
  const pdx = pSpline.DX(p)
  const pdy = pSpline.DY(p)
  const pnx = -pdy
  const pny = pdx 
  const P = [px, py]
  const tP = [pdx, pdy]
  const dP = [pnx, pny]
 
  const obj= {
    point: P,  
    tangent: tP,
    normal: dP,  
  }
  return obj 
}

//distance form vector to point
export const getDistance =(P,dP,S) =>{
  const abs = dP.reduce((p,c)=>p+c**2,0) 
  if(abs>0){
    const delta = matrix.subVec(P, S) 
    const dot = matrix.innerProductVec(delta, dP)
    const t = -dot/abs
    const C = matrix.addVec(P, matrix.mulScalarVec(t,dP))
    const CS = matrix.subVec(C, S) 
    const distance = matrix.absVec(CS) 
    return distance 
  }
  else{
    const PS = matrix.subVec(P, S) 
    const distance = matrix.absVec(PS)
    return distance 
  }
}

export const checkCrossOfVectorAndCurve = (P, dP, sSpline)=>{
  const sx0 = sSpline.X(0)  
  const sy0 = sSpline.Y(0)  
  const SP0 = [sx0 -P[0], sy0-P[1]]
  
  const sx1 = sSpline.X(1)  
  const sy1 = sSpline.Y(1)  
  const SP1 = [sx1 -P[0], sy1-P[1]]
  const vectorProduct0 = SP0[0]*dP[1] - SP0[1]*dP[0]
  const vectorProduct1 = SP1[0]*dP[1] - SP1[1]*dP[0]
  const mul = vectorProduct0 * vectorProduct1
  const flag = mul <0 ? true :false 
  return flag
}

export const getCrossPointOfVectorAndCurve=(P, dP, sSpline, sIni=0, maxIteration=30, tolerance=1E-5)=>{
    /*
  const flag = checkCrossOfVectorAndCurve(P, dP, sSpline)
  console.log(flag) 
  if(!flag){
    const obj ={
      crossFlag: false 
    }
    return obj
  }
 */ 
  const f = (s)=>{
    const sx = sSpline.X(s)  
    const sy = sSpline.Y(s)  
    const S = [sx, sy]
    const distance = getDistance(P, dP, S)
    return distance
  }
  const x0 = sIni
  const y0 = f(x0)
  const y1 = f(x0+tolerance)
  const dfdx0 = (y1-y0)/tolerance

  const res = solve.lineSplitMethod(x0, f, dfdx0, maxIteration, tolerance)
  const s = res.value

  if(s<0 || 1<s){
    const obj = {
      crossFlag: false,
    }
    return obj
  }
  const sx = sSpline.X(s)
  const sy = sSpline.Y(s)
  const S = [sx, sy]
  const SP = matrix.subVec(S, P) 
  const SPdotdP = matrix.innerProductVec(SP, dP)
  const magVec = matrix.absVec(SP)/matrix.absVec(dP)*Math.sign(SPdotdP) 
 
  const obj ={
    crossFlag: true,
    t: s,
    C: S,
    P: P,
    dP: dP,
    magVec: magVec
  }
  return obj
}

export const getPerdendicularFootOfCurves=(p,pSpline, sSpline, sIni=0, maxIteration=30, tolerance=1E-5)=>{
  const pointObj = getPointObject(p, pSpline)
  const P = pointObj.point 
  const dP = pointObj.normal 
  const pF = getCrossPointOfVectorAndCurve(P, dP, sSpline, sIni, maxIteration, tolerance) 
  return pF
} 

export const getCrossPointOfVectors=(P,dP,S,dS)=>{
   const A = [
    [dP[0], -dS[0]], 
    [dP[1], -dS[1]], 
  ]
  const detA = A[0][0]*A[1][1]  -A[0][1]*A[1][0]
  if(Math.abs(detA)<1E-5){
    const PS = [P[0]-S[0], P[1]-S[1]]
    const sine = (PS[0]*dP[1] - PS[1]*dP[0])/(matrix.absVec(PS)*matrix.absVec(dP))
    if(Math.abs(sine)<Math.sin(0.01/180*Math.PI)){
      const C = [(P[0]+S[0])/2, (P[1]+S[1])/2]
      const CP = [C[0]-P[0], C[1]-P[1]]
      const CS = [C[0]-S[0], C[1]-S[1]]
      const CPdotdP = matrix.innerProductVec(CP, dP)
      const CSdotdS = matrix.innerProductVec(CS, dS)
      const tp = matrix.absVec(CP)/matrix.absVec(dP)*Math.sign(CPdotdP) 
      const ts = matrix.absVec(CS)/matrix.absVec(dS)*Math.sign(CSdotdS) 
      const mag = [tp, ts]
      const obj = {
        crossFlag: true,
        C: C,
        mag:mag   
      }    
      return obj
    }
    else{
      const obj = {
        crossFlag: false,
      }    
      return obj     
    }
  }
  const V = [-P[0]+S[0], -P[1]+S[1]]
  const sol = solve.linEqGauss(A, V)
  const cx = P[0]+sol[0]*dP[0]
  const cy = P[1]+sol[0]*dP[1]
  const C = [cx, cy] 
  const obj =  {
    crossFlag: true,
    C: C,
    mag: sol
  }
  return obj  
} 

export const getCrossPointOfCurveNormals =(p,pSpline,s,sSpline) =>{
  const pointObjOfP = getPointObject(p, pSpline)
  const P = pointObjOfP.point 
  const dP = pointObjOfP.normal 
  
  const pointObjOfS = getPointObject(s, sSpline)
  const S = pointObjOfS.point 
  const dS = pointObjOfS.normal 
  const crossPoint = getCrossPointOfVectors(P,dP,S,dS)
  if(!crossPoint.crossFlag){
    return {
      crossFlag :false,
      Rp: 0,
      Rs: 0,
      C: [0,0],
      S:S,
      dS:dS,
      P:P,
      dP:dP,
      mag: [0, 0]
    }  
  }
  const C = crossPoint.C 
  const rp = Math.sqrt((P[0]-C[0])**2+(P[1]-C[1])**2)
  const rs = Math.sqrt((S[0]-C[0])**2+(S[1]-C[1])**2)
  return {
    crossFlag: true,
    Rp:rp,
    Rs:rs,
    C:C,
    S:S,
    P:P,
    dS:dS,
    dP:dP,
    mag:crossPoint.mag
  }
} 

const makeCalcDistanceFunc = (P,sSpline)=>{
  return s =>{
    const Sx = sSpline.X(s)
    const Sy = sSpline.Y(s)
    const d = Math.sqrt((P[0]-Sx)**2+(P[1]-Sy)**2)
    return d
  }
}

const makeMiniDistanceFunc = (P, sSpline) => {
  return s =>{
    const Sx = sSpline.X(s)
    const Sy = sSpline.Y(s)
    const Dx = sSpline.DX(s)
    const Dy = sSpline.DY(s)
    const dLds = (P[0]-Sx)*Dx + (P[1]-Sy)*Dy
    return dLds
  } 
}

export const minDistanceFromPointToCurve = (P, sSpline, N=10, 
                            maxIteration=30, tolerance=1E-5) =>{

  const sTemps = [...Array(N+1)].map((v,i)=>i/N)
  const calcDistance = makeCalcDistanceFunc(P, sSpline)
  const distances = sTemps.map(v=>calcDistance) 
  const min = Math.min(...distances)
  const index = distances.indexOf(min)
  const x0 = index/N
  const f = makeMiniDistanceFunc(P, sSpline)
  const y0 = f(x0)
  const y1 = f(x0+tolerance)
  const dfdx0 = (y1-y0)/tolerance
  const res = solve.lineSplitMethod(x0, f, dfdx0, maxIteration, tolerance)
  if(!res.converged){
    return {
      converged: false
    }
  }
  const s = res.value
  const distance = calcDistance(s)
  const S = [sSpline.X(s), sSpline.Y(s)]
  return {
    converged: true,
    distance: distance,
    S: S,
    s: s,
  }
}

