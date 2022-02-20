import {DelaunayTriangulation} from "../geometry/delaunayTriangulation.mjs"
 
const estimateGradients2DGlobal = (DT, data, maxIteration , tolerance) => {
  const points = DT.points
  const N = points.length
  const y=[]
  for(let i=0;i<N;i++){
    y[i] = [0, 0]
  }

  for(let iiter=0;iiter<maxIteration;iiter++){
    let err = 0
    for(let ipoint=0;ipoint<N;ipoint++){
      const Q = [0, 0, 0, 0]
      const s = [0, 0] 

      const neighborPoints = DT.neighborPoints[ipoint]
      for(let jpoint2=0;jpoint2<neighborPoints.length;jpoint2++) {
        const ipoint2 = neighborPoints[jpoint2]
        
        const ex = points[ipoint2][0] - points[ipoint][0] 
        const ey = points[ipoint2][1] - points[ipoint][1] 
        const L = Math.sqrt(ex**2 + ey**2)
        const L3 = L**3

        const f1 = data[ipoint]
        const f2 = data[ipoint2]

        const df2 = -ex*y[ipoint2][0] -ey*y[ipoint2][1]

        Q[0] += 4*ex*ex / L3
        Q[1] += 4*ex*ey / L3
        Q[3] += 4*ey*ey / L3 

        s[0] += (6*(f1-f2) -2*df2) * ex /L3
        s[1] += (6*(f1-f2) -2*df2) * ey /L3
      }

      Q[2] = Q[1]

      const det = Q[0]*Q[3] - Q[1]*Q[2]
      const r = [
        ( Q[3]*s[0] - Q[1]*s[1])/det,
        (-Q[2]*s[0] + Q[0]*s[1])/det,
      ] 
      
      let change = Math.max(Math.abs(y[ipoint][0] +r[0]),Math.abs(y[ipoint][1] +r[1]) )
      y[ipoint][0] = -r[0]
      y[ipoint][1] = -r[1]

      change /= Math.max(1, Math.abs(r[0]), Math.abs(r[1]))
      err = Math.max(err, change)
    }
    if(err < tolerance){
      return y
    }
  }
  return 0 
}

const cloughTocher2DSingle = (DT, triangleId, b, f, df) => {
  const ids = DT.triangles[triangleId]
  const p1 = DT.points[ids[0]] 
  const p2 = DT.points[ids[1]] 
  const p3 = DT.points[ids[2]] 

  const e12x = p2[0] - p1[0]
  const e12y = p2[1] - p1[1]

  const e23x = p3[0] - p2[0]
  const e23y = p3[1] - p2[1]

  const e31x = p1[0] - p3[0]
  const e31y = p1[1] - p3[1]

  const e14x = (e12x -e31x)/3
  const e14y = (e12y -e31y)/3

  const e24x = (-e12x + e23x)/3
  const e24y = (-e12y + e23y)/3

  const e34x = (e31x - e23x)/3
  const e34y = (e31y - e23y)/3

  const f1 = f[0]
  const f2 = f[1]
  const f3 = f[2]

  const df12 = +(df[0][0]*e12x + df[0][1]*e12y)
  const df21 = -(df[1][0]*e12x + df[1][1]*e12y)
  const df23 = +(df[1][0]*e23x + df[1][1]*e23y)
  const df32 = -(df[2][0]*e23x + df[2][1]*e23y)
  const df31 = +(df[2][0]*e31x + df[2][1]*e31y)
  const df13 = -(df[0][0]*e31x + df[0][1]*e31y)

  const c3000 = f1
  const c2100 = (df12 + 3*c3000)/3
  const c2010 = (df13 + 3*c3000)/3
  const c0300 = f2
  const c1200 = (df21 + 3*c0300)/3
  const c0210 = (df23 + 3*c0300)/3
  const c0030 = f3
  const c1020 = (df31 + 3*c0030)/3
  const c0120 = (df32 + 3*c0030)/3

  const c2001 = (c2100 + c2010 + c3000)/3
  const c0201 = (c1200 + c0300 + c0210)/3
  const c0021 = (c1020 + c0120 + c0030)/3

  const neighbors = DT.neighbors[triangleId]
  const g = []
  for(let i=0;i<neighbors.length;i++){
    const neighborId = neighbors[i]
    if(neighborId<0){
      g[i] = -1/2
      continue
    }
    const nTri = DT.triangles[neighborId] 
    const nCoord = DT.getCoord(nTri)
    const y = [
      (nCoord[0][0] + nCoord[1][0] + nCoord[2][0])/3,
      (nCoord[0][1] + nCoord[1][1] + nCoord[2][1])/3,
    ]

    const c = DT.getBarycentricCoord(triangleId, y)
    if(i===0){
      g[i] = (2*c[2] + c[1] -1)/(2 - 3*c[2] - 3*c[1])
    }
    else if(i===1){
      g[i] = (2*c[0] + c[2] -1)/(2 - 3*c[0] - 3*c[2])
    }
    else if(i===2){
      g[i] = (2*c[1] + c[0] -1)/(2 - 3*c[1] - 3*c[0])
    }
  }

  const c0111 = (g[0]*(-c0300 + 3*c0210 - 3*c0120 + c0030)
    + (-c0300 + 2*c0210 -c0120 + c0021 + c0201))/2

  const c1011 = (g[1]*(-c0030 + 3*c1020 - 3*c2010 + c3000)
    + (-c0030 + 2*c1020 - c2010 + c2001 + c0021))/2

  const c1101 = (g[2]*(-c3000 + 3*c2100 - 3*c1200 + c0300)
    + (-c3000 + 2*c2100 - c1200 + c2001 + c0201))/2

  const c1002 = (c1101 + c1011 + c2001)/3
  const c0102 = (c1101 + c0111 + c0201)/3
  const c0012 = (c1011 + c0111 + c0021)/3

  const c0003 = (c1002 + c0102 + c0012)/3

  let minval = b[0]
  for(let i=0;i<b.length;i++){
    if(b[i]<minval){
      minval = b[i]
    }
  }

  const b1 = b[0] - minval
  const b2 = b[1] - minval
  const b3 = b[2] - minval
  const b4 = 3*minval
  const w = (b1**3*c3000 + 3*b1**2*b2*c2100 + 3*b1**2*b3*c2010 +
    3*b1**2*b4*c2001 + 3*b1*b2**2*c1200 +
    6*b1*b2*b4*c1101 + 3*b1*b3**2*c1020 + 6*b1*b3*b4*c1011 +
    3*b1*b4**2*c1002 + b2**3*c0300 + 3*b2**2*b3*c0210 +
    3*b2**2*b4*c0201 + 3*b2*b3**2*c0120 + 6*b2*b3*b4*c0111 +
    3*b2*b4**2*c0102 + b3**3*c0030 + 3*b3**2*b4*c0021 +
    3*b3*b4**2*c0012 + b4**3*c0003)
  
//   console.log( "g",      g) 
//   console.log( "b1",     b1) 
//   console.log( "b2",     b2)
//   console.log( "b3",     b3)
//   console.log( "b4",     b4)
//   console.log( "c3000",  c3000)
//   console.log( "c2100",  c2100)
//   console.log( "c2010",  c2010)
//   console.log( "c1200",  c1200)
//   console.log( "c1101",  c1101)
//   console.log( "c1020",  c1020)
//   console.log( "c1011",  c1011)
//   console.log( "c1002",  c1002)
//   console.log( "c0300",  c0300)
//   console.log( "c0210",  c0210)
//   console.log( "c0201",  c0201)
//   console.log( "c0120",  c0120)
//   console.log( "c0111",  c0111)
//   console.log( "c0102",  c0102)
//   console.log( "c0030",  c0030)
//   console.log( "c0021",  c0021)
//   console.log( "c0012",  c0012)
//   console.log( "c0003",  c0003)
  

  return w
}

export const cloughTocher2DInterpolator = points => {
  const maxIteration = 400
  const tolerance = 1E-6
 
  const DT = new DelaunayTriangulation(points)
  const data = []
  for(let i=0;i<points.length;i++){
    data[i] = points[i][2]
  } 
  const dfs = estimateGradients2DGlobal(DT, data, maxIteration , tolerance)
  return point => {
   const triId = DT.findTriangle(point)
    const b = DT.getBarycentricCoord(triId, point)
    const triVid = DT.triangles[triId]
    const f = [
      data[triVid[0]],  
      data[triVid[1]],  
      data[triVid[2]],  
    ]
    const df = [
      dfs[triVid[0]],
      dfs[triVid[1]],
      dfs[triVid[2]],
    ]
    const z = cloughTocher2DSingle(DT, triId, b, f, df)
 
    return z
  }
}
