import {innerProductVec, vectorProduct, addVec, subVec, mulScalarVec, absVec} from "../matrix/index.mjs"

const calcTriangleSpec = vertices => {
  const areaVecX2 = addVec(vectorProduct(vertices[0],vertices[1]),
                   vectorProduct(vertices[1],vertices[2]),
                   vectorProduct(vertices[2],vertices[0]))
                  
  const areaVec = mulScalarVec(1/2, areaVecX2)
  const area = absVec(areaVec)
  const centroid = mulScalarVec(1/3,addVec(addVec(vertices[0], vertices[1]), vertices[2]))
  const obj = {
    areaVec: areaVec,
    area: area,
    centroid: centroid
  }
  return obj
} 

const calcAreaSpec = vertices => {
  const n = vertices.length
  const triangles = vertices.map((v,i,arr)=>i<2 ? null: [arr[0], arr[i-1], v]).slice(2)
  const trianglesSpec = triangles.map(v=>calcTriangleSpec(v))
  const areaVec = trianglesSpec.reduce((p,c)=>addVec(p, c.areaVec), [0,0,0]) 
  const area = absVec(areaVec) 
  const centroidTmp = trianglesSpec.reduce((p,c)=>addVec(p, mulScalarVec(c.area, c.centroid)), [0,0,0])
  const centroid = mulScalarVec(1/area, centroidTmp)
  const obj = {
    area: area,
    areaVec: areaVec,
    centroid: centroid,
  }   
  return obj 
}

export const calcPolyhedronSpecFromSurfaces = surfaceVertices => {
  const surfaceArea = surfaceVertices.map(v=>calcAreaSpec(v)) 
  const partialVolume = surfaceArea.map(v=>innerProductVec(v.centroid, v.areaVec)/3)
  const volume = partialVolume.reduce((p,c)=>p+c,0)
  const centroidList = surfaceArea.map((v,i)=>mulScalarVec(partialVolume[i]*3/4, v.centroid))
  const centroidTmp = centroidList.reduce((p,c) => addVec(p, c), [0,0,0])
  const centroid = mulScalarVec(1/volume, centroidTmp)
  
  const obj = {
    volume: volume,
    centroid: centroid,
  }
  return obj 
}


export const calcTetrahedronSpecFromVertices = (vertices) => {
  const e1 = subVec(vertices[1], vertices[0])
  const e2 = subVec(vertices[2], vertices[0])
  const e3 = subVec(vertices[3], vertices[0])
  const volume = innerProductVec(vectorProduct(e1, e2), e3)/6
  const centroid= mulScalarVec(1/4, addVec(...vertices))
  const obj = {
    volume: volume,
    centroid: centroid,
  }
  return obj 
}

export const calcHexahedronSpecFromVertices = (vertices) => {
  const surfaceVertices = [
    [vertices[0], vertices[1], vertices[2], vertices[3]],
    [vertices[0], vertices[4], vertices[5], vertices[1]],
    [vertices[5], vertices[6], vertices[2], vertices[1]],
    [vertices[6], vertices[7], vertices[3], vertices[2]],
    [vertices[7], vertices[4], vertices[0], vertices[3]],
    [vertices[4], vertices[7], vertices[6], vertices[5]],
  ] 
  
  const spec = calcPolyhedronSpecFromSurfaces(surfaceVertices) 
  return spec
}
