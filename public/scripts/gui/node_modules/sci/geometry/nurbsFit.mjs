import {bsplineBasis} from "./spline.mjs"
import {linEqGauss} from "../solve/linearEquation.mjs"

const calcDistance = (p1, p2) => {
  const vec = p1.map((v,i)=>v-p2[i]) 
  const d2 = vec.reduce((p,c)=>p+c**2,0)
  const d = Math.sqrt(d2)
  return d
}

const calcSumList = (list) => {
  const sumList = list.reduce((p,c,i)=>i>0 ? p.concat(p[p.length-1]+c) : [0], [])
  return sumList
}

const transpose = A=>A[0].map((k,i)=>A.map((v)=>v[i]))

const makeParameters = (points, type) => {
  const m = points.length -1

  switch(type){
    case "uniform" : {
      const s = [...Array(m+1)].map((v,i)=>i/m)
      return s
    }
    case "chord" : {
      const l = points.map((v,i,arr) => i>0 ? calcDistance(v, arr[i-1]) : 0 )
      const sum = calcSumList(l) 
      const total = sum[sum.length-1] 
      const normalized = sum.map(v=>v/total)
      return normalized 
    }
    case "sqrt" : {
      const l = points.map((v,i,arr)=>i>0?Math.sqrt(calcDistance(v, arr[i-1])):0)
      const sum = calcSumList(l)
      const total = sum[sum.length-1] 
      const normalized = sum.map(v=>v/total)
      return normalized 
    }
  }
}

const makeKnotVector = (num, degree, parameters, knotType) => {
  const m = num - 1
  const p = degree
  const startKnot = [...Array(degree+1)].fill(0)
  const endKnot = [...Array(degree+1)].fill(1)

  let middleKnot = []

  switch(knotType){
    case "uniform": {
      middleKnot = [...Array(m-p)].map((v,i)=>(i+1)/(m-p+1)) 
      break
    }
    case "average": {
      middleKnot =  [...Array(m-p)].map((v,i)=>parameters.slice(i+1, i+p+1).reduce((p,c)=>p+c,0)/p) 
      break
    }
    case "natural":{
      middleKnot = [...Array(m-p)].map((v,i)=>parameters[i+2])
      break
    }
  }

  const knot = [].concat(startKnot, middleKnot, endKnot)
  return knot
}

const makeKnotVectorWithBoundaryConstrained = (num, degree, parameters, knotType) => {
  const m = num - 1
  const p = degree
  const startKnot = [...Array(degree+1)].fill(0)
  const endKnot = [...Array(degree+1)].fill(1)

  let middleKnot = []

  switch(knotType){
    case "uniform": {
      middleKnot = [...Array(m-p+2)].map((v,i)=>(i+1)/(m-p+1+2))
      break
    }
    case "average": {
      middleKnot =  [...Array(m-p+2)].map((v,i)=>parameters.slice(i, i+p).reduce((p,c)=>p+c,0)/p)
      break
    }
    case "natural":{
      middleKnot = [...Array(m-p+2)].map((v,i)=>parameters[i+1]) 
      break
    }
  }

  const knot = [].concat(startKnot, middleKnot, endKnot)
  return knot
}


// @points: nurbs curve fit points
// @type   : uniform, chord or sqrt 
export const getNurbsParameters = (points, parameterType="chord", knotType="natural") => {
  const degree = 3
  const num = points.length 
  const order = degree + 1

  const dimension = points[0].length

  const parameters = makeParameters(points, parameterType)
  const knots = makeKnotVector(num, degree, parameters, knotType)

  const W =  [...Array(num)].fill(1)


  const bNmatrix = bsplineBasis(knots, degree, true)
         
  const matN = parameters.map(v=>bNmatrix(v)[0]) 
  const NW = matN.map(v=>v.reduce((p,c,i)=>p+c*W[i],0))

  const pointsT = transpose(points) //[xList, yList, zList]
  const pointsTweighted = pointsT.map(v=>v.map((u,j)=>u*NW[j]))


  const fTmp = pointsTweighted.map(v=>linEqGauss(matN, v)) //[xList, yList, zList]

  const f = fTmp.map(v=>v.map((u,j)=>u/W[j]))
  const controlPoints = transpose(f) 

  const nurbs = (t, k=0)=>{  // 0 <= t <=1
    const bN = bNmatrix(t)
    const N = bN[k]

    const point = [...Array(dimension)].map((v,i)=>N.reduce((p,c,j)=>p+c*W[j]*controlPoints[j][i], 0))
    return point 
  } 

  const obj = {
    degree: degree,
    points : points,
    controlPoints: controlPoints,
    wights: W,
    knots: knots,
    bsplineFunctionMatrix: bNmatrix,
    parameters: parameters,
    nurbs: nurbs,
  }
  return obj
}

const makeMatNWithBoundaryConstraints = (num, degree, parameters, knots, bNmatrix) => {
  const m = num-1
  const p = degree
  const Nn = parameters.map(v=>bNmatrix(v)[0]) 
  const N2= [].concat(-degree/knots[p+1], degree/knots[p+1], [...Array(num)].fill(0))
  const Npenultimate = [].concat([...Array(num)].fill(0), -degree/(1-knots[m+2]), degree/(1-knots[m+2]))

  const matN = [].concat([Nn[0]], [N2], Nn.slice(1,m), [Npenultimate], [Nn[m]])
  return matN
}

// @points: nurbs curve fit points
// @type   : uniform, chord or sqrt 
export const getBoundaryConstraintedNurbsParameters = (points, e1, e2, parameterType="chord", knotType="natural", unitVectorFlag=true) => {
  const degree = 3
  const num = points.length 
  const order = degree + 1

  const dimension = points[0].length


  const parameters = makeParameters(points, parameterType)
  const knots = makeKnotVectorWithBoundaryConstrained(num, degree, parameters, knotType)

  const totalLength = points.map((v,i,arr) => i>0 ? calcDistance(v, arr[i-1]) : 0 ).reduce((p,c)=>p+c,0)
  const C1 = unitVectorFlag ? e1.map(v=>v*totalLength) : e1
  const C2 = unitVectorFlag ? e2.map(v=>v*totalLength) : e2

  const W =  [...Array(num+2)].fill(1)


  const bNmatrix = bsplineBasis(knots, degree, true)
         
  const matN =  makeMatNWithBoundaryConstraints(num, degree, parameters, knots, bNmatrix)
  const NW = matN.map(v=>v.reduce((p,c,i)=>p+c*W[i],0))

  const pointsNew = [].concat([points[0]], [C1], points.slice(1, num-1), [C2], [points[num-1]])
  const pointsT = transpose(pointsNew) //[xList, yList, zList]
  const pointsTweighted = pointsT.map(v=>v.map((u,j)=> (j !==1 && j !==num)? u*NW[j] :u))


  const fTmp = pointsTweighted.map(v=>linEqGauss(matN, v)) //[xList, yList, zList]
  const f = fTmp.map(v=>v.map((u,j)=>u/W[j]))
  const controlPoints = transpose(f) 

  const nurbs = (t, k=0)=>{  // 0 <= t <=1
    const bN = bNmatrix(t)
    const N = bN[k]

    const point = [...Array(dimension)].map((v,i)=>N.reduce((p,c,j)=>p+c*W[j]*controlPoints[j][i], 0))
    return point 
  } 

  const obj = {
    degree: degree,
    points : points,
    controlPoints: controlPoints,
    wights: W,
    knots: knots,
    bsplineFunctionMatrix: bNmatrix,
    parameters: parameters,
    nurbs: nurbs,
  }
  return obj
}

