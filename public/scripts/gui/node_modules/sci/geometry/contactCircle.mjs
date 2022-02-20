import {broydenMethod} from "../solve/broyden.mjs"
import {invMat} from "../matrix/matrix.mjs"

const normalize = E => {
  const l = Math.sqrt(E.reduce((p,c)=>p+c**2,0))
  const e = E.map(v=>v/l)
  return e
}

export const getContactCircle = (P1, e1, P2, e2) => {
  const d = e1[0]*e2[1] - e2[0]*e1[1]
  const m = (P1[0]-P2[0])*e2[1] - (P1[1]-P2[1])*e2[0] 
  const l = -m/d
  const Ru = e1[1]-e2[1]!==0 ? -(e1[0]+e2[0])/(e1[1]-e2[1])*l:
     (e1[1]+e2[1])/(e1[0]-e2[0])*l
  const Rd = e1[1]+e2[1]!==0 ? (e1[0]-e2[0])/(e1[1]+e2[1])*l:
    -(e1[1]-e2[1])/(e1[0]+e2[0])*l
    
  const P3u = [P1[0]+l*e1[0]+l*e2[0] ,P1[1]+l*e1[1]+l*e2[1] ]
  const P3d = [P1[0]+l*e1[0]-l*e2[0] ,P1[1]+l*e1[1]-l*e2[1] ]


  
  const Cxu = P1[0]-Ru*e1[1]
  const Cyu = P1[1]+Ru*e1[0]

  const Cxd = P1[0]+Rd*e1[1]
  const Cyd = P1[1]-Rd*e1[0]
  
  const ru = Math.abs(Ru)
  const rd = Math.abs(Rd)
  
  const obj = {
    positive:{
      radius: ru,
      center: [Cxu, Cyu],
      P1: P1,
      P3: P3u,

    },
    negative:{
      radius: rd,
      center: [Cxd, Cyd],
      P1: P1,
      P3: P3d,
    } 
  }
  return obj
}

const judgeFunc = (P1, P2, e2) => {
  const d = [ P1[0]-P2[0], P1[1]-P2[1] ]
  const T = e2[0]*d[1] - e2[1]*d[0]
  const jud = T>0 ? "positive":
              T<0 ? "negative":
              "online"
  return jud
}

export const getContactCircleOfTwoSplinesAndOneLine = (sp1, sp2, line, t1ini, t2ini, config) => {

  const maxIteration = config?.maxIteration || 30
  const tolerance = config?.tolerance || 1E-5

  const P2 = line[0]  
  const E2 = [ line[1][0]-line[0][0], line[1][1]-line[0][1] ]
  const e2 = normalize(E2) 
  
  const P1ini = [sp1.X(t1ini),sp1.Y(t1ini)]
  const P2ini = [sp2.X(t2ini),sp2.Y(t2ini)]

  const judge1ini = judgeFunc(P1ini, P2, e2)
  const judge2ini = judgeFunc(P2ini, P2, e2)
  
  if(judge1ini !== judge2ini){
    throw new Error("initial parameter error")
  }

  
  const calcCircle = (sp, P2, e2) => {
    const f = (t) => {
      const P1x = sp.X(t)
      const P1y = sp.Y(t)
      const P1 = [P1x, P1y]
      const E1x = sp.DX(t)
      const E1y = sp.DY(t)
      const E1 = [E1x, E1y]
      const e1 = normalize(E1)
      const circle = getContactCircle(P1, e1, P2, e2)
      return circle
    }
    return f
  }
 
  const sp1Circle = calcCircle(sp1, P2, e2) 
  const sp2Circle = calcCircle(sp2, P2, e2) 
 
  const F = (t) => {
    const [t1, t2] = t 
    const C1Obj =  sp1Circle(t1)
    const C2Obj =  sp2Circle(t2)
   
    const C1 = judge1ini ==="positive" ? C1Obj.positive.center:C1Obj.negative.center
    const C2 = judge2ini ==="positive" ? C2Obj.negative.center:C2Obj.positive.center
   
    const dx = C1[0] -C2[0]
    const dy = C1[1] -C2[1]
   
    const delta = [dx, dy]

    return delta 
  }

  
  const x0 = [t1ini, t2ini]
  const Yini = F(x0)
  const Y_dt1 = F([t1ini+tolerance, t2ini])
  const Y_dt2 = F([t1ini, t2ini+tolerance])
  
  const B0 = [
    [(Y_dt1[0]-Yini[0])/tolerance, (Y_dt2[0]-Yini[0])/tolerance],
    [(Y_dt1[1]-Yini[1])/tolerance, (Y_dt2[1]-Yini[1])/tolerance],
  ]
  

  const invB0 = invMat(B0)

  const res = broydenMethod(x0, F, invB0, maxIteration, tolerance)
  
  const value = res.value
  
  const t1 = value[0]
  const t2 = value[1]

  const C1Obj =  sp1Circle(t1)
  const C2Obj =  sp2Circle(t2)
  
  const C1 = judge1ini ==="positive" ? C1Obj.positive:C1Obj.negative
  const C2 = judge2ini ==="positive" ? C2Obj.negative:C2Obj.positive

  const theta1 = Math.atan2(C1.P1[1]-C1.center[1], C1.P1[0]-C1.center[0] )
  const theta2 = Math.atan2(C2.P1[1]-C1.center[1], C2.P1[0]-C1.center[0] )
  const theta3 = Math.atan2(C1.P3[1]-C1.center[1], C1.P3[0]-C1.center[0] )


  const obj = {
    center: C1.center, 
    P1: C1.P1,
    P2: C2.P1,
    P3: C1.P3,
    theta1: theta1,
    theta2: theta2,
    theta3: theta3,
    radius: C1.radius, 
    t1: t1,
    t2: t2,
    iterationStatus: {
      converged: res.converged,
      error: res.error,
      count: res.count, 
    }
  } 
  return obj
}

