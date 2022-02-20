
export const cubicspline = (x, y, a0=0, an=0, method="M") =>{
  try{
    if(x.length !== y.length){
      throw new RangeError("length of x must be equal to length of y") 
    }
    if(method !== "M" && method !=="m"){
      throw new RangeError("method must be M or m") 
    }
  }
  catch(e){
    console.log(e.name + " : " + e.message)
    return null
  }
  const num = x.length
  
  const h = x.map((v,i,arr)=> i ?x[i]-x[i-1]:0) 

  const ramda = h.map((v,i,arr)=> 
    (i===0 || i===arr.length-1)?0:h[i+1]/(h[i]+h[i+1])
  )
  const mu = ramda.map(v=>1-v) 
  const d= y.map((v,i,arr)=>
    (i===0 || i===arr.length-1) ? 0:
    6*((arr[i+1]-arr[i])/h[i+1]-(arr[i]-arr[i-1])/h[i])/(h[i]+h[i+1])
  )
  ramda[0] = method === "M" ? 0:
    method ==="m" ? 1: 0  
    
  mu[num-1] = method === "M" ? 0:
    method ==="m" ? 1: 0  
    
  d[0] = method === "M" ? 2*a0:
    method ==="m" ? 6/h[1]*((y[1]-y[0])/h[1] -a0):0  
    
  d[d.length-1] = method === "M" ? 2*an:
    method ==="m" ? 6/h[num-1]*(an-(y[num-1]-y[num-2])/h[num-1]):0  
  
  const b = [...Array(num)].fill(2)
  const A = b.reduce((pre,current, i)=>{
    const a = i ? current - mu[i]/pre[i-1]*ramda[i-1]:current  
    pre.push(a) 
    return pre
  },[])
  const B = d.reduce((pre,current,i)=>{
    const a2 = i ? current - mu[i]/A[i-1]*pre[i-1]: current 
    pre.push(a2)
    return pre
  },[])
 
  A.reverse()
  B.reverse()
  ramda.reverse()
  const M = A.reduce((pre,current,i)=>{
    const a3 = i? (B[i] - ramda[i]*pre[i-1])/current: B[i]/current 
    pre.push(a3)
    return pre
  }, [])
  M.reverse()

  
  const integral = (x0, x1) =>{
    const F = (i, x0)=>{
      const y0= M[i]* (-((x[i+1]-x0)**4)/(24*h[i+1]) + (x[i+1]-x0)**2/12*h[i+1] ) 
        + M[i+1]* ( (x0 - x[i])**4/(24*h[i+1]) - (x0-x[i])**2/12*h[i+1] )
        - (x[i+1]-x0)**2/(2*h[i+1])*y[i]
        + (x0-x[i])**2/(2*h[i+1])*y[i+1]
      return y0
    }
    const Fs = (i)=>{
      return M[i]/24*h[i+1]**3 - h[i+1]/2*y[i]
    }
    const Fe =(i)=> {
      return -M[i+1]/24*h[i+1]**3 + h[i+1]/2*y[i+1]
    }
    const Fi = (i)=>{
      return Fe(i)-Fs(i)
    }

    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2

    const jndex = x.reduce((pre,current,j)=>current <= x1 ? j: pre,0) 
    const j = jndex <x.length-1 ? jndex : x.length-2

    const y0 = i+1<j ? Fe(i)-F(i,x0) + [...Array(j-i-1)].map((v,k)=>Fi(i+1+k)).reduce((pre,current)=>pre+current,0)+F(j,x1)-Fs(j):
      i+1===j ? Fe(i)-F(i,x0)+F(j, x1)-Fs(j):
      i===j ? F(j,x1) -F(i, x0):
      F(j,x1) -F(i, x0)
    return y0
    
  }
 
  const f = x0 => {
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2
    const y0= M[i]* ( (x[i+1]-x0)**3/(6*h[i+1]) - (x[i+1]-x0)/6*h[i+1] ) 
      + M[i+1]* ( (x0 - x[i])**3/(6*h[i+1]) - (x0-x[i])/6*h[i+1] )
      + (x[i+1]-x0)/h[i+1]*y[i]
      + (x0-x[i])/h[i+1]*y[i+1]
    return y0
  
  }
 
  const df = x0 => {
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2
    const y0d = M[i]* ( -1*(x[i+1]-x0)**2/(2*h[i+1]) + h[i+1]/6)
      + M[i+1]* ( (x0-x[i])**2/(2*h[i+1]) - h[i+1]/6)
      + (y[i+1]-y[i])/h[i+1]
    return y0d
  
  }
  const d2f = x0 => {
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2
    const y0d2 = M[i]* (x[i+1]-x0)/h[i+1]
      + M[i+1]* (x0 - x[i])/h[i+1]
    return y0d2
  }
  const d3f = x0 => {
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2
    const y0d3 = (-M[i]+M[i+1])/h[i+1]
    return y0d3
  }

  const obj = {
    F : integral,
    f : f,
    df : df,
    d2f : d2f,
    d3f : d3f,
    h: h,
    M: M
  }
  return obj
}


export const cubicsplineLinear = (x, y, a0=0, an=0, method="M")=>{
  const splineObj = cubicspline(x, y, a0, an, method)
  const spline = splineObj.f
  const splineDiff1 = splineObj.df
  const x0 = x[0]
  const xN = x[x.length-1]

  const y0 = y[0]
  const yN = y[y.length-1]

  const diff0 = splineDiff1(x0)
  const diffN = splineDiff1(xN)

  const minX = Math.min(...x)
  const maxX = Math.max(...x)
  return x1 => x1  < minX ? (x1-x0)*diff0+y0:
    x1 > maxX ? (x1-xN)*diffN+yN:
    spline(x1)
}


export const cyclicCubicspline = (x, y) =>{
  try{
    if(x.length !== y.length){
      throw new RangeError("length of x must be equal to length of y") 
    }
  }
  catch(e){
    console.log(e.name + " : " + e.message)
    return null
  }
  const num = x.length
  const N = num-1
  
  const h = x.map((v,i,arr)=> i >0?arr[i]-arr[i-1]:0)  //0,1,2, ..., N

  const ramda = h.map((v,i,arr)=> 
    i === 0 ?0:
    i === N ? h[1]/(h[N]+h[1]):
    h[i+1]/(h[i]+h[i+1])
  )
  
  const mu = ramda.map(v=>1-v) 
  const d= y.map((v,i,arr)=>
    i ===0 ? 0:
    i ===N ? 6*((arr[1]-arr[i])/h[1] -(arr[i]-arr[i-1])/h[i])/(h[i]+h[1]) :
    6*((arr[i+1]-arr[i])/h[i+1]-(arr[i]-arr[i-1])/h[i])/(h[i]+h[i+1])
  )
 
  const b = [...Array(num)].fill(2)  //0,1, ... ,N
  const alpha = []
  const A = []
  const P = []
  const Q = []
  const R = []
  for(let i=0;i<num;i++){
    if(i===0){
      alpha[0]=0
      A[0]=0
      P[0]=0
      Q[0]=0
      R[0]=0
    }
    else if(i===1){
      const al = 0
      const AA = b[i]
      const PP  = -ramda[i]/AA
      const QQ = -mu[i]/AA
      const RR = d[i]/AA

      alpha[i]=al
      A[i]=AA
      P[i]=PP
      Q[i]=QQ
      R[i]=RR
    }
    else{
      const al = mu[i]/A[i-1]
      const AA = b[i]-al*ramda[i-1]
      const PP  = -ramda[i]/AA
      const QQ = -mu[i]*Q[i-1] /AA
      const RR = (d[i] - mu[i]*R[i-1])/AA

      alpha[i]=al
      A[i]=AA
      P[i]=PP
      Q[i]=QQ
      R[i]=RR
    }
  }
  const t = []
  const v = []

  for(let i=N; i>-1;i--){
    if(i===num-1){
      t[i]=1
      v[i]=0
    }
    else{
      const ti = P[i]*t[i+1]+Q[i]
      const vi = P[i]*v[i+1]+R[i]
      t[i]=ti
      v[i]=vi
    }
  }
  
  const zn = (d[N] - ramda[N]*v[1]-mu[N]*v[N-1])/(ramda[N]*t[1]+mu[N]*t[N-1]+b[N])
  const M = [...Array(num)].map((u,i)=>i === 0 ? zn: t[i]*zn +v[i] )


  const integral = (x0, x1) => {
    const F = (i, x0)=>{
      const y0= M[i]* (-((x[i+1]-x0)**4)/(24*h[i+1]) + (x[i+1]-x0)**2/12*h[i+1] ) 
        + M[i+1]* ( (x0 - x[i])**4/(24*h[i+1]) - (x0-x[i])**2/12*h[i+1] )
        - (x[i+1]-x0)**2/(2*h[i+1])*y[i]
        + (x0-x[i])**2/(2*h[i+1])*y[i+1]
      return y0
    }
    const Fs = (i)=>{
      return M[i]/24*h[i+1]**3 - h[i+1]/2*y[i]
    }
    const Fe =(i)=> {
      return -M[i+1]/24*h[i+1]**3 + h[i+1]/2*y[i+1]
    }
    const Fi = (i)=>{
      return Fe(i)-Fs(i)
    }
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2

    const jndex = x.reduce((pre,current,j)=>current <= x1 ? j: pre,0) 
    const j = jndex <x.length-1 ? jndex : x.length-2

    const y0 = i+1<j ? Fe(i)-F(i,x0) + [...Array(j-i-1)].map((v,k)=>Fi(i+1+k)).reduce((pre,current)=>pre+current,0)+F(j,x1)-Fs(j):
      i+1===j ? Fe(i)-F(i,x0)+F(j, x1)-Fs(j):
      i===j ? F(j,x1) -F(i, x0):
      F(j,x1) -F(i, x0)
    return y0
    
  }

  const f =  (x0)=>{
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2
    const y0= M[i]* ( (x[i+1]-x0)**3/(6*h[i+1]) - (x[i+1]-x0)/6*h[i+1] ) 
      + M[i+1]* ( (x0 - x[i])**3/(6*h[i+1]) - (x0-x[i])/6*h[i+1] )
      + (x[i+1]-x0)/h[i+1]*y[i]
      + (x0-x[i])/h[i+1]*y[i+1]


    return y0
  }

  const df =  (x0)=>{
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2
    const y0d = M[i]* ( -1*(x[i+1]-x0)**2/(2*h[i+1]) + h[i+1]/6)
      + M[i+1]* ( (x0-x[i])**2/(2*h[i+1]) - h[i+1]/6)
      + (y[i+1]-y[i])/h[i+1]
    return y0d
  }
  const d2f = x0 => {
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2
    const y0d2 = M[i]* (x[i+1]-x0)/h[i+1]
      + M[i+1]* (x0 - x[i])/h[i+1]
    return y0d2
  }
  const d3f = x0 => {
    const index = x.reduce((pre,current,i)=>current <= x0 ? i: pre,0) 
    const i = index <x.length-1 ? index : x.length-2
    const y0d3 = (-M[i]+M[i+1])/h[i+1]
    return y0d3
  }

  const obj = {
    F : integral,
    f : f,
    df : df,
    d2f : d2f,
    d3f : d3f,
    h: h,
    M: M
  }
  return obj

}

const dist = (p1, p2)=> Math.sqrt((p1[0]-p2[0])**2+(p1[1]-p2[1])**2)

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


export const normalizedCubicspline = (list, cyclicFlag=false )=>{
  /* input : double array of float */
  /* output: function args from 0 to 1, return [x, y]  */

  const x = list.map(v=>v[0])
  const y = list.map(v=>v[1])
  const ds = list.map((v,i,arr)=>i>0 ? dist(v,arr[i-1]) : 0) 
  const total = ds.reduce((p,c)=>p+c,0)
  const s = ds.reduce((p,c)=>{
    const pre = p.length > 0 ?  p[p.length-1] :0
    const sum = pre+c
    const l = p.concat(sum)
    return l 
  },[]).map(v=>v/total) 

  const splineXObj = cyclicFlag ? cyclicCubicspline(s, x) : cubicspline(s, x, 0, 0, "M")
  const splineYObj = cyclicFlag ? cyclicCubicspline(s, y) : cubicspline(s, y, 0, 0, "M")

  
  const X =  splineXObj.f 
  const Y =  splineYObj.f 
  const DX = splineXObj.df
  const DY = splineYObj.df 
  const D2X = splineXObj.d2f
  const D2Y = splineYObj.d2f 
  const D3X = splineXObj.d3f
  const D3Y = splineYObj.d3f 

  return {
    X: X,
    Y: Y,
    DX: DX,
    DY: DY,
    D2X: D2X,
    D2Y: D2Y,
    D3X: D3X,
    D3Y: D3Y,
  }
}

export const areaOfClosedCurve = (points, coincidentFlag=true)=>{
  /* input : double array of float */
  /* output: area inside of cyclic spline curve */
  const list =  coincidentFlag ? [].concat(points): [].concat(points, [points[0]])
  const x = list.map(v=>v[0])
  const y = list.map(v=>v[1])

  const ds = list.map((v,i,arr)=>i>0 ? dist(v,arr[i-1]) : 0) 
  const total = ds.reduce((p,c)=>p+c,0)
  const s = ds.reduce((p,c)=>{
    const pre = p.length > 0 ?  p[p.length-1] :0
    const sum = pre+c
    const l = p.concat(sum)
    return l 
  },[]).map(v=>v/total) 
 
  const XObj =  cyclicCubicspline(s, x) 
  const YObj =  cyclicCubicspline(s, y) 

  const Fi = (i)=>{
    const h = XObj.h
    const Mx = XObj.M  
    const My = YObj.M
    const value = (My[i]*Mx[i]-My[i+1]*Mx[i+1])*h[i+1]**4/36
      +(My[i]*Mx[i+1]+My[i+1]*Mx[i])*h[i+1]**4/720
      -(My[i]+My[i+1])*h[i+1]**2/24*(x[i+1]-x[i])
      +(Mx[i]+Mx[i+1])*h[i+1]**2/24*(y[i+1]-y[i])
      +(y[i+1]+y[i])*(x[i+1]-x[i])/2
    return value
  }
  const N = s.length
  const integration = s.map((v,i)=>i<N-1 ? Fi(i):0).reduce((p,c)=>p+c,0)
  const area = Math.abs(integration)
  return area 
 
}

export const normalize = (X, Y) => (t)=>[X(t), Y(t)]

export const renormalize = (t0, t1, normalizedFunc) => {
  return t => {
    const s = t0+(t1 -t0)*t
    const p = normalizedFunc(s)
    return p
  } 
} 
 
