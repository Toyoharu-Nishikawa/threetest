import {newtonMethod1D} from "../solve/newton1d.mjs"
import {transpose, absVec, subVec, addVec,mulScalarVec, normalizeVec,
        innerProductVec,vectorProduct} from "../matrix/matrix.mjs"

import {makeQuaternion, invQuaternion, mulQQ} from "../quaternion/quaternion.mjs"
import {cubicspline, cyclicCubicspline} from "../interpolate/cubicspline.mjs"

const divideMinMax = (min, max, N) => {
  const list = [...Array(N)].map((v,i)=>min+(max-min)*i/(N-1))
  return list
}

const cartesianToCylindrical = xyz => {
  const x = xyz[0]
  const y = xyz[1]
  const z = xyz[2]
  
  const r = Math.sqrt(y**2+z**2)
  const rt = r*Math.atan2(-y, z)
  const xrtr = [x, rt, r]
  return xrtr
}

const cylindricalToCartesian = xrtr => {
  const x = xrtr[0]
  const rt = xrtr[1]
  const r = xrtr[2]
  
  const theta = rt/r 
  const y = -r*Math.sin(theta)
  const z = r*Math.cos(theta) 
  const xyz = [x,y,z] 
  return xyz
}


const offsetPath = (path, offset) => {
  const P1 = path[0] 
  const P2 = path[1] 
  const dP = [P2[0]-P1[0], P2[1]-P1[1]]
  const l = Math.sqrt(dP[0]**2+dP[1]**2)
  const dp = [dP[0]/l, dP[1]/l] 
  const dt = [-dp[1], dp[0]]
  
  const Q1 = [P1[0]+offset*dt[0], P1[1]+offset*dt[1]]
  const Q2 = [P2[0]+offset*dt[0], P2[1]+offset*dt[1]]
  const newPath = [Q1, Q2]
  return newPath
}


const getAngle = (a,b) => {
  const c = innerProductVec(a,b)
  const absA = absVec(a) 
  const absB = absVec(b) 
  const cos = c/(absA*absB)
  const theta = Math.acos(cos)
  return theta
}




const reverseVec = a => {
  const u = a.map(v=>-v) 
  return u
}

const getCrossPointsOfSplineAndCone = (ribCSplineRX,  path, rIni=0,maxIteration=30, tolerance=1E-5) => {

  const pathT = path.map(v=> [v[1], v[0]])
  
  const flag = Math.abs(pathT[1][0] - pathT[0][0]) >1E-12
  if(flag){
    const tan = (pathT[1][1] - pathT[0][1]) /(pathT[1][0] - pathT[0][0])
    const lineF = r =>  tan*(r-pathT[0][0]) + pathT[0][1]
    const getR = (func) => {
      const f = r => func.f(r) - lineF(r) 
      const df = r => func.df(r) - tan 
      const x0 =rIni
      const ans = newtonMethod1D(x0, f, df, maxIteration, tolerance)
      const R = ans.value
      return R
    }
    
    const R = getR(ribCSplineRX)
    return R
  }
  else{
    const R = pathT[0][0]  
    return R
  }
}

const getPerpendicularHootFromPoint = (ribSplineZX,ribSplineZY,P, iniZ, maxIteration,tolerance) => {
  const f = z => {
    const x = ribSplineZX.f(z)
    const y = ribSplineZY.f(z)
    const dx = ribSplineZX.df(z)
    const dy = ribSplineZY.df(z)
    const Q = [x,y,z]
    const PQ = subVec(P, Q)
    const dQ = [dx, dy, 1]
    const c = innerProductVec(PQ,dQ)
    return c
  } 
  const df = z => {
    const x = ribSplineZX.f(z)
    const y = ribSplineZY.f(z)
    const dx = ribSplineZX.df(z)
    const dy = ribSplineZY.df(z)
    const d2x = ribSplineZX.d2f(z)
    const d2y = ribSplineZY.d2f(z)
    const Q = [x,y,z]
    const PQ = subVec(P, Q)
    const dQ = [dx, dy, 1]
    const d2Q = [d2x, d2y, 0]
    const c1 = innerProductVec(dQ,dQ)
    const c2 = innerProductVec(Q,d2Q)
    const c = c1+c2
    return c
  } 
  
  const res = newtonMethod1D(iniZ, f, df, maxIteration, tolerance)
  const z = res.value 
  const x = ribSplineZX.f(z)
  const y = ribSplineZY.f(z)
  const Q = [x, y, z]
  const d = absVec(subVec(P,Q))
  
  return Q
}

const getNormalVecByThreePoints = (P, Q, R) => {
  const dpq = normalizeVec(subVec(Q,P)) 
  const dpr = normalizeVec(subVec(R,P)) 
  const dn = vectorProduct(dpq, dpr) 
  return dn
}

const getNormalVecOfSurface = loftObj => {
  const sections = loftObj.sections

  const dns = sections.map((v,i)=>v.map((u,j)=>{
      const splineObj = loftObj.sectionsSplines[i]
      const x = u[0]
      const y = u[1]
      const z = u[2]
      //along section
      const t = splineObj.t[j]
      const dxdt = splineObj.XSpline.df(t)
      const dydt = splineObj.YSpline.df(t)
      const dzdt = splineObj.ZSpline.df(t)
      const du = normalizeVec([dxdt, dydt, dzdt])

      //along rib
      const ribSplineZX = loftObj.ribsSplineZX[j]
      const ribSplineZY = loftObj.ribsSplineZY[j]
 
      const dxdz = ribSplineZX.df(z)
      const dydz = ribSplineZY.df(z)
      const dzdz = 1
      const dv = normalizeVec([dxdz, dydz, dzdz])
      const dn = normalizeVec(vectorProduct(du, dv))
      return dn
    })
  ) 
  return dns  
}

const getOffsetSurface = (loftObj, fillet) => {
  const sections = loftObj.sections
  const dn = getNormalVecOfSurface(loftObj) 
  const offsetSurface = sections.map((v,i)=>v.map((u,j)=>addVec(u, mulScalarVec(fillet,dn[i][j])) )) 
  return offsetSurface
}

const getPerpendicularFooForCone = (path, P) => {
  const x0 = P[0] 
  const y0 = P[1] 
  const z0 = P[2] 
  const r0 = Math.sqrt(y0**2+z0**2)
  const theta0 = Math.atan2(-y0,z0)
  
  const A = path[0]
  const B = path[1]
  const C = [x0, r0]
  
  const BA = subVec(B,A)
  const CA = subVec(C,A)
  const t = (BA[0]*CA[0]+BA[1]*CA[1])/(BA[0]**2+BA[1]**2)
  const Q = [A[0]+t*BA[0],A[1]+t*BA[1]]
  const x1 = Q[0]
  const r1 = Q[1]
  const y1 = -r1*Math.sin(theta0)
  const z1 = r1*Math.cos(theta0)
  const H = [x1, y1, z1]

  return H
}


const getFilletPolyline = (center, contact, foot, fillet, N=9) => {
  const CC = subVec(contact, center)
  const cc = normalizeVec(CC)
  const CC2 = mulScalarVec(fillet, cc)
  const contact2 = addVec(center, CC2)
  const FC = subVec(foot, center)
  const fc = normalizeVec(FC)
  const n = vectorProduct(cc, fc)
  
  const phi = getAngle(cc, fc) 
  const theta = [...Array(N)].map((v,i)=>phi*i/(N-1))
  
  const q = theta.map(v=>makeQuaternion(n, v))
  const p = [...CC2,0]
  const q2 = q.map(v=>mulQQ(v,p,invQuaternion(v)))
  
  const vec = q2.map(v=>[v[0],v[1],v[2]]) 
  
  const polyline = vec.map(v=>addVec(center,v)).reverse()
  
  return polyline 
}



const divideZ = (mainZ, bottomXYZ, topXYZ, Ns) => {
  const min = bottomXYZ.length !==0 ? bottomXYZ[bottomXYZ.length-1][2] : mainZ[0]
  const max = topXYZ.length !==0 ? topXYZ[topXYZ.length-1][2] : mainZ[mainZ.length-1]
  const list = divideMinMax(min, max, Ns)
  return list
}

const makeSplineObj = section => {
  const section2 = [].concat(section, [section[0]])
  const x = section2.map(v=>v[0])
  const y = section2.map(v=>v[1])
  const z = section2.map(v=>v[2])
  const dist = (p1, p2) => absVec(subVec(p1, p2))
  const list = section2.map((v,i,arr)=>i>0?dist(v, arr[i-1]):0) 
  const s = list.reduce((p,c,i)=>i>0 ? [].concat(p,p[p.length-1]+c):[c],[] )
  const total = s[s.length-1]
  const t = s.map(v=>v/total) 
  const XSpline = cyclicCubicspline(t,x)
  const YSpline = cyclicCubicspline(t,y)
  const ZSpline = cyclicCubicspline(t,z)
  const obj = {
    XSpline: XSpline,
    YSpline: YSpline,
    ZSpline: ZSpline,
    t: t,
  }
  return obj
}

const makeLoftObj = sections => {
  const ribs = transpose(sections)
  
  const ribsX = ribs.map(v=>v.map(u=>u[0])) 
  const ribsY = ribs.map(v=>v.map(u=>u[1])) 
  const ribsZ = ribs.map(v=>v.map(u=>u[2])) 
  const ribsSplineZX = ribsZ.map((v,i)=>cubicspline(v,ribsX[i]))
  const ribsSplineZY = ribsZ.map((v,i)=>cubicspline(v,ribsY[i]))
 
  const ribsC = ribs.map(v=>v.map(u=>cartesianToCylindrical(u)))
  
  const ribsCX = ribsC.map(v=>v.map(u=>u[0]))
  const ribsCRT = ribsC.map(v=>v.map(u=>u[1])) 
  const ribsCR = ribsC.map(v=>v.map(u=>u[2])) 
  const ribsCSplineRX = ribsCR.map((v,i)=>cubicspline(v,ribsCX[i]))
  const ribsCSplineRRT = ribsCR.map((v,i)=>cubicspline(v,ribsCRT[i]))

  const sectionsSplines = sections.map(v=>makeSplineObj(v))
  
  const loftObj = {
    sections: sections,  
    ribs: ribs,  
    ribsX: ribsX,
    ribsY: ribsY,
    ribsZ: ribsZ,
    ribsSplineZX: ribsSplineZX,
    ribsSplineZY: ribsSplineZY,
    ribsC: ribsC,
    ribsCX: ribsCX,
    ribsCRT: ribsCRT,
    ribsCR: ribsCR,
    ribsCSplineRX: ribsCSplineRX,
    ribsCSplineRRT: ribsCSplineRRT,
    sectionsSplines: sectionsSplines
  } 

  return loftObj
}

const getCrossPointsOfLoftAndCone = (loftObj, path) => {
  const {ribsCR, ribsCSplineRX,ribsCSplineRRT} = loftObj
  const rIni =  ribsCR.map(v=>v[0])
  const crossPointsR = ribsCSplineRX.map((v,i)=>getCrossPointsOfSplineAndCone(v,  path, rIni[i], 30, 1E-5))
  const crossPointsXRTR = crossPointsR.map((v,i)=>[ribsCSplineRX[i].f(v), ribsCSplineRRT[i].f(v), v]) 
  
  const crossPointsXYZ =  crossPointsXRTR.map(v=>cylindricalToCartesian(v))
  return crossPointsXYZ
}

const getFilletPolylines = (loftObj, path, fillet, filletDivisions, upside) => {
  const {sections,ribsCR, ribsZ,ribsSplineZX,ribsSplineZY} = loftObj
  
  const offsetSections = getOffsetSurface(loftObj, fillet) 
  const offsetRibs = transpose(offsetSections) 
  const offsetRibsZ = offsetRibs.map(v=>v.map(u=>u[2]))
  
  const convertZfunc = ribsZ.map((v,i)=>cubicspline(offsetRibsZ[i],v))
  
  const offsetRibsC = offsetRibs.map(v=>v.map(u=>cartesianToCylindrical(u)))
  const offsetRibsCX = offsetRibsC.map(v=>v.map(u=>u[0]))
  const offsetRibsCRT = offsetRibsC.map(v=>v.map(u=>u[1])) 
  const offsetRibsCR = offsetRibsC.map(v=>v.map(u=>u[2])) 
  const offsetRibsCSplineRX = offsetRibsCR.map((v,i)=>cubicspline(v,offsetRibsCX[i]))
  const offsetRibsCSplineRRT = offsetRibsCR.map((v,i)=>cubicspline(v,offsetRibsCRT[i]))


  const rIni =  ribsCR.map(v=>v[0])
  const offset_Path = upside ? offsetPath(path, fillet) : offsetPath(path, -fillet)
  const filletCenterR =offsetRibsCSplineRX.map((v,i)=>getCrossPointsOfSplineAndCone(v, offset_Path, rIni[i], 30,1E-5))
  const filletCenterXRTR = filletCenterR.map((v,i)=>[offsetRibsCSplineRX[i].f(v), offsetRibsCSplineRRT[i].f(v), v])
  const filletCenterXYZ = filletCenterXRTR.map(v=>cylindricalToCartesian(v))
  
 
 
  const contactRibsZTmp = filletCenterXYZ.map((v,i)=>convertZfunc[i].f(v[2]))  
  
  //const contactXYZ = filletCenterXYZ.map(
  //  (v,i)=>getPerpendicularHootFromPoint(ribSplineZX[i],ribSplineZY[i],v,contactRibsZTmp[i],1E-5)
  //)
  const contactXYZ = contactRibsZTmp.map((v,i)=>[ribsSplineZX[i].f(v),ribsSplineZY[i].f(v), v])
  
  const footXYZ = filletCenterXYZ.map(v=>getPerpendicularFooForCone(path, v))
  
  const filletPolylines = filletCenterXYZ.map((v,i)=>getFilletPolyline(v,contactXYZ[i],footXYZ[i], fillet, filletDivisions))
  if(!upside){
    filletPolylines.forEach(v=>v.reverse())
  }
  
  return filletPolylines  
}


export const cutLoftByConeAndMakeFillet = (sections, paths, fillet, config) => {
  const bottomPath = paths?.bottom
  const topPath = paths?.top
  const bottomFillet = fillet?.bottom
  const topFillet = fillet?.top
  const bottomFilletDivisions = config?.bottomFilletDivisions || 16
  const topFilletDivisions = config?.topFilletDivisions ||16
  const Ns = config?.mainDivisions || sections.length
  
  const bottomCutFlag = bottomPath != undefined
  const topCutFlag = topPath != undefined 
  const bottomFilletFlag = bottomFillet !=undefined
  const topFilletFlag = topFillet !=undefined
  
  if(bottomFilletFlag===true && bottomCutFlag ===false){
    throw new Error("bottom path has to be defined for bottom fillet.")
  }
  if(topFilletFlag===true && topCutFlag ===false){
    throw new Error("top path has to be defined for top fillet.")
  } 

  const loftObj = makeLoftObj(sections) 
  
  const obj = {} 
  if(bottomCutFlag){
    const path = bottomPath
    const crossPointsXYZ = getCrossPointsOfLoftAndCone(loftObj, path)
    obj.bottomXYZ = transpose([crossPointsXYZ])
  }
  else{
    obj.bottomXYZ =loftObj.ribs.map(v=>[])
  }
  
  if(topCutFlag){
    const path = topPath
    const crossPointsXYZ = getCrossPointsOfLoftAndCone(loftObj, path)
    obj.topXYZ = transpose([crossPointsXYZ])
  } 
  else{
    obj.topXYZ = loftObj.ribs.map(v=>[])
  }
  
   
  if(bottomFilletFlag){
    const path = bottomPath
    const fillet = bottomFillet
    const filletDivisions = bottomFilletDivisions
 
    const filletPolylines = getFilletPolylines(loftObj, path, fillet, filletDivisions, true)
    obj.bottomXYZ = filletPolylines 
  }
    
  if(topFilletFlag){
    const path = topPath
    const fillet = topFillet
    const filletDivisions = topFilletDivisions
 
    const filletPolylines = getFilletPolylines(loftObj, path, fillet, filletDivisions, false)
    
   
    obj.topXYZ = filletPolylines
  }

  const {ribsZ, ribsSplineZX, ribsSplineZY} = loftObj
  const ribsZCut = ribsZ.map((v,i)=>divideZ(v, obj.bottomXYZ[i], obj.topXYZ[i], Ns))
  const newRibs = ribsZCut.map((v,i)=>v.map(u=>[ribsSplineZX[i].f(u),ribsSplineZY[i].f(u), u]))
  const mergedRibs = newRibs.map((v,i)=>
    (obj.bottomXYZ[i].length !== 0 && obj.topXYZ[i].length !== 0) ? [].concat(obj.bottomXYZ[i], v.slice(1, -1), obj.topXYZ[i]) :
    (obj.bottomXYZ[i].length === 0 && obj.topXYZ[i].length !== 0) ? [].concat(v.slice(0, -1), obj.topXYZ[i]) :
    (obj.bottomXYZ[i].length !== 0 && obj.topXYZ[i].length === 0) ? [].concat(obj.bottomXYZ[i], v.slice(1)) :
    v
  )
  
  const newSections = transpose(mergedRibs) 
  
  return newSections
}


