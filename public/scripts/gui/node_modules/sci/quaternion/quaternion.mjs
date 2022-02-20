const normalizeVec = vec => {
  const l2 = vec.reduce((p,c)=>p+c**2,0) 
  const l = Math.sqrt(l2)
  const newVec = vec.map(v=>v/l)
  return newVec 
}

export const makeQuaternion = (vec, theta) => {
  const vec2 = normalizeVec(vec)
  const sin = Math.sin(theta/2)
  const cos = Math.cos(theta/2)
  const q0 = vec2[0]*sin
  const q1 = vec2[1]*sin
  const q2 = vec2[2]*sin
  const q3 = cos
  const Q = [q0, q1, q2, q3]
  return Q
}

export const invQuaternion = q => {
  const invQ = [-q[0], -q[1],-q[2],q[3]]
  return invQ
}

const multiple = (q, p) => {
  const Q = [
    q[3]*p[0] - q[2]*p[1] + q[1]*p[2] + q[0]*p[3],
    q[2]*p[0] + q[3]*p[1] - q[0]*p[2] + q[1]*p[3],
   -q[1]*p[0] + q[0]*p[1] + q[3]*p[2] + q[2]*p[3],
   -q[0]*p[0] - q[1]*p[1] - q[2]*p[2] + q[3]*p[3],
  ]  
  return Q
}

export const mulQQ = (...list) => {
  const e = [0,0,0,1]
  const res = list.reduce((p,c)=>multiple(p,c), e)
  return res
}
