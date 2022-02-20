"use strict"

const makeRotFunc = theta => P => [
  Math.cos(theta) * P[0] - Math.sin(theta) * P[1],
  Math.sin(theta) * P[0] + Math.cos(theta) * P[1],
]

export const calcAreaOfPolygon = points =>{
 const Ai = points.map( (v, i,arr)=> i>0 ? 
    (arr[i-1][0]*v[1]-arr[i-1][1]*v[0])/2:
    (arr[arr.length-1][0]*v[1]-arr[arr.length-1][1]*v[0])/2
  )  
  const A = Ai.reduce((p,c)=>p+c,0)
  
  return A
}

export const getCentroid = points => {
  const Ai = points.map( (v, i,arr)=> i>0 ? 
    (arr[i-1][0]*v[1]-arr[i-1][1]*v[0])/2:
    (arr[arr.length-1][0]*v[1]-arr[arr.length-1][1]*v[0])/2
  )  
  
  const Xi = points.map( (v, i,arr)=> i>0 ? 
    Ai[i]*(v[0]+arr[i-1][0])/3:
    Ai[i]*(v[0]+arr[arr.length-1][0])/3
  )  
  
  const Yi = points.map( (v, i,arr)=> i>0 ? 
    Ai[i]*(v[1]+arr[i-1][1])/3:
    Ai[i]*(v[1]+arr[arr.length-1][1])/3
  )  
  
  const A = Ai.reduce((p,c)=>p+c,0)
  const X = Xi.reduce((p,c)=>p+c,0)
  const Y = Yi.reduce((p,c)=>p+c,0)
  
  const x = X/A
  const y = Y/A
  
  const centroid = [x, y]
  
  return centroid
}

const calcMomentOfInteriaOfAreaOfTriangle = (P1, P2) => {
  const x1 = P1[0]  
  const y1 = P1[1]  
  const x2 = P2[0]  
  const y2 = P2[1]  
  
  const Ix = 1/4 * x1 * y1**3  
    - 1/4 * x2 * y2**3
    + 1/4 * (y2**2 + y1**2) * (y2 + y1) * (x2 - x1) 
    + 1/3 * (y2**2 + y2*y1 + y1**2) * (x1*y2 - x2*y1) 
 
  const Iy = -1/4 * x1**3 * y1  
    + 1/4 * x2**3 * y2
    - 1/4 * (x2**2 + x1**2) * (x2 + x1) * (y2 - y1) 
    + 1/3 * (x2**2 + x2*x1 + x1**2) * (x1*y2 - x2*y1)

  const Ixy = 1/24 * (
      x1**2 * y2**2 - x2**2 * y1**2
      + 2* x1 * x2 * (y2**2 - y1**2)
      - 2* y1 * y2 * (x2**2 - x1**2)
    )    
    
  const momentOfInteriaOfArea = {
    Ix: Ix,
    Iy: Iy,
    Ixy: Ixy,
  }
  return momentOfInteriaOfArea
} 

export const calcMomentOfInteriaOfArea = points => {
  const centroid = getCentroid(points)
  const relativePoints = points.map(v=>[v[0]-centroid[0], v[1]-centroid[1] ])
  
  const momentOfInteriaOfAreaOfTriangles = relativePoints.map((v,i,arr)=>{
    const P1 = i>0? arr[i-1]: arr[arr.length-1]
    const P2 = v 
    const momentOfInteriaOfArea = calcMomentOfInteriaOfAreaOfTriangle(P1, P2)
    return momentOfInteriaOfArea
  })
  
  const Ixi = momentOfInteriaOfAreaOfTriangles.map(v=>v.Ix)
  const Iyi = momentOfInteriaOfAreaOfTriangles.map(v=>v.Iy)
  const Ixyi = momentOfInteriaOfAreaOfTriangles.map(v=>v.Ixy)
  
  const Ix  = Ixi.reduce((p,c)=>p+c,0)
  const Iy  = Iyi.reduce((p,c)=>p+c,0)
  const Ixy  = Ixyi.reduce((p,c)=>p+c,0)
 
  const momentOfInteriaOfArea = {
    centroid: centroid,
    Ix: Ix,
    Iy: Iy,
    Ixy: Ixy,
  }
  return momentOfInteriaOfArea
}

export const calcPrincipalMomentOfInteriaOfArea =(Ix, Iy, Ixy) => {
  const alpha = Math.atan2(-2*Ixy, Ix - Iy)/2

  const Ixm = 1/2 * (Ix + Iy) + 1/2 * Math.sqrt((Ix - Iy)**2 + 4 * Ixy**2)
  const Iym = 1/2 * (Ix + Iy) - 1/2 * Math.sqrt((Ix - Iy)**2 + 4 * Ixy**2)
  
  const principalMomentOfInteriaOfArea = {
    alpha: alpha,    
    Ipx: Ixm,    
    Ipy: Iym,    
  }
  
  return principalMomentOfInteriaOfArea
} 

export const calcSpecOfPolygon = points => {
  const area = calcAreaOfPolygon(points)
  const momentOfInteriaOfArea = calcMomentOfInteriaOfArea(points)
  const {centroid, Ix, Iy, Ixy} = momentOfInteriaOfArea 
  const [cx, cy] = centroid
  const Imx = Ix + cy**2 * area 
  const Imy = Iy + cx**2 * area 
  const Imxy = Ixy + cx * cy * area 
  
  const principalMomentOfInteriaOfArea = calcPrincipalMomentOfInteriaOfArea(Ix, Iy, Ixy)
  const {alpha,Ipx, Ipy } = principalMomentOfInteriaOfArea
  
  const rotAlpha = makeRotFunc(alpha)
  const xaxis = [1, 0]
  const yaxis = [0, 1] 
  
  const Xaxis = rotAlpha(xaxis)
  const Yaxis = rotAlpha(yaxis)
  
  const spec = {
    area: area,
    centroid: centroid,
    Ix: Ix,
    Iy: Iy,
    Ixy: Ixy,
    Imx: Imx,
    Imy: Imy,
    Imxy: Imxy,
    Ipx: Ipx,
    Ipy: Ipy,
    alpha: alpha,
    Xaxis: Xaxis,
    Yaxis: Yaxis,
  }
  return spec
}
