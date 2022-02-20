const transpose = A=>A[0].map((k,i)=>A.map((v)=>v[i]))

const getThreePolylineObj = (points,color="white",closed=true) =>{ 
  const ps = points.flatMap(v=>[v[0],v[1],v[2]])
  if(closed){
    ps.push(ps[0])
    ps.push(ps[1])
    ps.push(ps[2])
  }
  const vertices = new Float32Array(ps)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))             

  const line2 = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: color}));
  return line2 
}

const makeFaces = (sec1, sec2) => {
  const N = sec1.length
  const triangles = sec1.flatMap((v,i,arr)=> 
    i>0?[[arr[i-1], v, sec2[i-1]], [v, sec2[i], sec2[i-1]]]: 
    [[arr[N-1], v, sec2[N-1]], [v, sec2[i], sec2[N-1]]      ]
  ) 
  return triangles
}


export const getThreeSurfaceObj = (sections, color="gray") => {
  
  const triangles = sections.map((v,i,arr)=>i>0?makeFaces(arr[i-1], v):null).slice(1)
  const positions = []
  for(let v of triangles){
    for(let u of v){
      for(let w of u){
        positions.push(w[0])
        positions.push(w[1])
        positions.push(w[2])
      }
    }
  }

  let id=0
  const pointIds= []
  sections.forEach((v,i)=>{
    pointIds.push([])
    v.forEach(u=>{
      pointIds[i].push(id)
      id++
    })
  })

  const idTriangles = pointIds.map((v,i,arr)=>i>0?makeFaces(arr[i-1], v):null).slice(1)
  const indices = []
  for(let v of idTriangles){
    for(let u of v){
      for(let w of u){
        indices.push(w)
      }
    }
  }

  const posBuf = new Float32Array(positions)
  const idBuf =new Uint16Array(indices)
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(posBuf, 3))
  geom.setAttribute('index', new THREE.BufferAttribute(idBuf,  1))
  const geomNew = THREE.BufferGeometryUtils.mergeVertices(geom)

  geomNew.computeVertexNormals() 
  const material = new THREE.MeshPhongMaterial( {color: color, side: THREE.DoubleSide} )
  const mesh = new THREE.Mesh(geomNew, material );
  return mesh
}


export const addLoft = (sections2) => {
  const surface = getThreeSurfaceObj(sections2)

  meshList.push(surface)
  scene.add(surface)

//  sections2.forEach(v=>{
//    const line = getThreePolylineObj(v,"black",true)   
//    meshList.push(line)
//    scene.add(line)
//  })
//  
//  const sections2T = transpose(sections2) 
//  sections2T.forEach(v=>{
//    const line = getThreePolylineObj(v,"black",false)   
//    meshList.push(line)
//    scene.add(line)
//  }) 


}

const convert = (sections2) => {
  const sections3 = sections2.map(v=>v.map(u=>[u[0],u[2],-u[1]]))
  return sections3
}


export const getCenter = (sections) => {
  const N = sections.length
  const l1 = sections[0]
  const l2 = sections[N-1]
  const Nl1 = l1.length 
  const Nl2 = l2.length 
  const C1Temp = l1.reduce((p,c)=>[p[0]+c[0], p[1]+c[1],p[2]+c[2]],[0,0,0])
  const C2Temp = l2.reduce((p,c)=>[p[0]+c[0], p[1]+c[1],p[2]+c[2]],[0,0,0])
  const C1 = C1Temp.map(v=>v/Nl1)
  const C2 = C2Temp.map(v=>v/Nl2)
  const C = C1.map((v,i)=>(v+C2[i])/2) 
  return C
}

export const move = (sections, center) => {
  const sectionsNew = sections.map(v=>v.map(u=>u.map((w,k)=>w-center[k])))
  return sectionsNew
}
