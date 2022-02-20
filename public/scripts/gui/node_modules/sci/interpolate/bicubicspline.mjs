import * as matrix from "../matrix/index.mjs"

const derivative = (n, c) => c ? [...Array(c)].map((v,i)=>n+i+1).reduce((pre,cur)=>pre*cur,1): 1

export const bicubicspline = (x, y, f) => {
  const nx = x.length
  const ny = y.length

  if(nx<2){
    console.log("length of x must be lager than 2")
    return null
  }
  if(ny<2){
    console.log("length of y must be lager than 2")
    return null
  } 
  
  const p = [...Array(nx)]
  const q = [...Array(nx)]
  const s = [...Array(nx)]
  
  const xramda = [...Array(nx)]
  const xmyu = [...Array(nx)]
  const xA = [...Array(nx)]
  const xalpha = [...Array(nx)]


  const yramda = [...Array(ny)]
  const ymyu = [...Array(ny)]
  const yA = [...Array(ny)]
  const yalpha = [...Array(ny)]
 


  for(let i=0;i<nx;i++){
    p[i] = [...Array(ny)] 
    q[i] = [...Array(ny)]
    s[i] = [...Array(ny)]
  }

  for(let j=0;j<ny;j++){
    p[0][j] = (f[1][j] - f[0][j]) / (x[1] - x[0])
    p[nx-1][j] = (f[nx-1][j] - f[nx-2][j]) / (x[nx-1] - x[nx-2])
  } 
  for(let i=0; i<nx; i++){
    q[i][0] = (f[i][1] - f[i][0]) / (y[1] - y[0])
    q[i][ny-1] = (f[i][ny-1] - f[i][ny-2]) / (y[ny-1] - y[ny-2])
  } 
  s[0][0] = (p[0][1] - p[0][0]) / (y[1] - y[0])
  s[0][ny-1] = (p[0][ny-1] - p[0][ny-2]) / (y[ny-1] - y[ny-2])
  s[nx-1][0] = (p[nx-1][1] - p[nx-1][0]) / (y[1] - y[0])
  s[nx-1][ny-1] = (p[nx-1][ny-1] - p[nx-1][ny-2]) / (y[ny-1] - y[ny-2])

  for(let i=0;i<nx;i++){
    if(0< i  && i <nx-1){ 
      xramda[i] = (x[i+1] - x[i]) / (x[i+1] - x[i-1])
      xmyu[i] = 1 - xramda[i]
    } 
  } 
  xramda[nx-1] = 0
  xmyu[0] = 0    
    
  for(let j=0;j<ny;j++){
    if(0< j  && j <ny-1){ 
      yramda[j] = (y[j+1] - y[j]) / (y[j+1] - y[j-1])
      ymyu[j] = 1 - yramda[j]
    } 
  } 
  yramda[ny-1] = 0
  ymyu[0] = 0


  xA[0] = 2
  for(let i =1;i<nx;i++){
    xalpha[i] = xramda[i] / xA[i-1]
    xA[i] = 2 - xalpha[i] * xmyu[i-1]
  } 
   
  yA[0] = 2
  for(let j=1;j<ny;j++){
    yalpha[j] = yramda[j] / yA[j-1]
    yA[j] = 2 - yalpha[j] * ymyu[j-1]
  }

  const d1 = [...Array(nx)]
  const B1 = [...Array(nx)]
  
  for(let j=0;j<ny;j++){
    d1[0] = 2 * p[0][j] 
    for(let i=1;i<nx-1;i++){
      d1[i] = 3 * ( xramda[i] * (f[i][j] - f[i-1][j]) / (x[i] - x[i-1]) + xmyu[i] * (f[i+1][j] - f[i][j]) / (x[i+1] - x[i]) )
    } 
    d1[nx-1]= 2 * p[nx-1][j]
    B1[0] = d1[0]
    for(let i=1;i<nx;i++){
      B1[i] = d1[i] - xalpha[i] * B1[i-1]
    } 
    p[nx-1][j] = B1[nx-1] / xA[nx-1]
    for(let i=nx-2;i>-1;i--){ 
      p[i][j] = (B1[i] - xmyu[i] * p[i+1][j]) / xA[i]
    } 
  } 

  const d2 = [...Array(ny)]
  const B2 = [...Array(ny)]
  
  for(let i=0;i<nx;i++){
  	d2[0] = 2.0*q[i][0]
  	for(let j=1;j<ny-1;j++){
  		d2[j] = 3.0*(( yramda[j]*(f[i][j]-f[i][j-1])/(y[j]-y[j-1])+ymyu[j]*(f[i][j+1]-f[i][j])/(y[j+1]-y[j])) )
	  }
	  d2[ny-1] = 2.0*q[i][ny-1]
	  B2[0] = d2[0];
	  for(let j=1;j<ny;j++){
		  B2[j] = d2[j]-yalpha[j]*B2[j-1]
	  }       
	  q[i][ny-1] = B2[ny-1]/yA[ny-1]
	  for(let j=ny-2;j>-1;j--){
		  q[i][j]=(B2[j]-ymyu[j]*q[i][j+1])/yA[j]
	  }
  }
               
  const d3 = [...Array(nx)]
  const B3 = [...Array(nx)]
  const d4 = [...Array(nx)]
  const B4 = [...Array(nx)]
  
	d3[0] = 2.0*s[0][0]
	d4[0] = 2.0*s[0][ny-1]

  for(let i=1;i<nx-1;i++){
 	  d3[i] = 3.0*( xramda[i]*(q[i][0]-q[i-1][0])/(x[i]-x[i-1])+xmyu[i]*(q[i+1][0]-q[i][0])/(x[i+1]-x[i]) )
    d4[i] = 3.0*( xramda[i]*(q[i][ny-1]-q[i-1][ny-1])/(x[i]-x[i-1])+xmyu[i]*(q[i+1][ny-1]-q[i][ny-1])/(x[i+1]-x[i]) )
	}
	d3[nx-1] = 2.0*s[nx-1][0]
	d4[nx-1] = 2.0*s[nx-1][ny-1]

	B3[0] = d3[0]
	B4[0] = d4[0]

	for(let i=1;i<nx;i++){
		B3[i] = d3[i]-xalpha[i]*B3[i-1]
		B4[i] = d4[i]-xalpha[i]*B4[i-1]
	}
	s[nx-1][0] = B3[nx-1]/xA[nx-1]
	s[nx-1][ny-1] = B4[nx-1]/xA[nx-1]

	for(let i=nx-2;i>-1;i--){
		s[i][0]=(B3[i]-xmyu[i]*s[i+1][0])/xA[i]
		s[i][ny-1]=(B4[i]-xmyu[i]*s[i+1][ny-1])/xA[i]
	}
 
  const d5 = [...Array(ny)]
  const B5 = [...Array(ny)]
  for(let i=0;i<nx;i++){
  	d5[0] = 2.0*s[i][0]
  	for(let j=1;j<ny-1;j++){
  		d5[j] = 3.0*( yramda[j]*(p[i][j]-p[i][j-1])/(y[j]-y[j-1])+ymyu[j]*(p[i][j+1]-p[i][j])/(y[j+1]-y[j]) )
	  }
	  d5[ny-1] = 2.0*s[i][ny-1]
	  B5[0] = d5[0]
	  for(let j=1;j<ny;j++){
		  B5[j] = d5[j]-yalpha[j]*B5[j-1]
	  }
	  s[i][ny-1] = B5[ny-1]/yA[ny-1]
	  for(let j=ny-2;j>-1;j--){
		  s[i][j]=(B5[j]-ymyu[j]*s[i][j+1])/yA[j]
	  }
  }
  
  return (X, Y, cx=0, cy=0) => {
    if(cx>3){
      console.log("cx must be less than 3")
      return null
    }
    if(cy>3){
      console.log("cy must be less than 3")
      return null
    }

    let i=0
    if(X>=x[0]){
  	  while(i<nx){
		    if(x[i]<=X && X<x[i+1])break
	      else i++
	    }
    }
    if(i>=nx-1)i=nx-2
  
    let j=0
    if(Y>=y[0]){
  	  while(j<ny){                                                      
		    if(y[j]<=Y && Y<y[j+1])break
	      else j++
	    }
    }
    if(j>=ny-1)j=ny-2

    const A = [...Array(4)].map(v=>[...Array(4)])
    const At = [...Array(4)].map(v=>[...Array(4)])
    const K = [...Array(4)].map(v=>[...Array(4)])

   
    const hx = x[i+1]-x[i]
    A[0][0]=1.0;         A[0][1]=0.0;        A[0][2]=0.0;          A[0][3]=0.0;
    A[1][0]=0.0;         A[1][1]=1.0;        A[1][2]=0.0;          A[1][3]=0.0;
    A[2][0]=-3.0/(hx*hx);A[2][1]=-2.0/hx;    A[2][2]=3.0/(hx*hx);  A[2][3]=-1.0/hx;
    A[3][0]=2.0/hx;      A[3][1]=1.0/(hx*hx);A[3][2]=-2.0/hx;      A[3][3]=1.0/(hx*hx);
  
    const hy = y[j+1]-y[j]
    At[0][0]=1.0;      At[0][1]=0.0;         At[0][2]=-3.0/(hy*hy);At[0][3]=2.0/hy;
    At[1][0]=0.0;      At[1][1]=1.0;         At[1][2]=-2.0/hy;     At[1][3]=1.0/(hy*hy);
    At[2][0]=0.0;      At[2][1]=0.0;         At[2][2]=3.0/(hy*hy); At[2][3]=-2.0/hy;
    At[3][0]=0.0;      At[3][1]=0.0;         At[3][2]=-1.0/hy;     At[3][3]=1.0/(hy*hy);
  
    K[0][0]=f[i][j];   K[0][1]=q[i][j];      K[0][2]=f[i][j+1];    K[0][3]=q[i][j+1];
    K[1][0]=p[i][j];   K[1][1]=s[i][j];      K[1][2]=p[i][j+1];    K[1][3]=s[i][j+1];
    K[2][0]=f[i+1][j]; K[2][1]=q[i+1][j];    K[2][2]=f[i+1][j+1];  K[2][3]=q[i+1][j+1];
    K[3][0]=p[i+1][j]; K[3][1]=s[i+1][j];    K[3][2]=p[i+1][j+1];  K[3][3]=s[i+1][j+1];

  
    const AK = matrix.mulMatMat(A,K)
    const Gamma = matrix.mulMatMat(AK,At)

    let value =  0 
    for(let m=0;m<4-cx;m++){
  	  for(let n=0;n<4-cy;n++){
		    value += Gamma[m+cx][n+cy] * derivative(m,cx)*(X-x[i])**m *derivative(n,cy)*(Y-y[j])**n
	    }
    }
    
    return value
  }  
}
