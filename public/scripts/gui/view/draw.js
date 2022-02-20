import * as THREE from 'three';
//import Stats from "Stats" 
import { GUI } from "GUI" 
import { TrackballControls } from "TrackballControls"
import {getThreeSurfaceObj, getCenter,move} from "./drawTools/tools.js"

import { Rhino3dmLoader } from '../node_modules/three/examples/jsm/loaders/3DMLoader.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../node_modules/three/examples/jsm/loaders/RGBELoader.js';

const elements = {
  draw: document.getElementById("draw"),
  gui: document.getElementById("gui"),
  main: document.querySelector("main"),
}

//let scene, camera, renderer
let perspectiveCamera, orthographicCamera, controls, scene, renderer, stats
let initialWidth, initialHeight, initialWindowWidth, initialWindowHeight
let resizeFlg

const meshList = new Set()


export const initialize = () => {
  init()
  animate();
  window.onresize = windowResizeFunc

}
const frustumSize = 400
const params = {
  orthographicCamera: false
}
export const init = () => {
  //element
  const mainElem = elements.main
  const drawElem = elements.draw
  const width = drawElem.clientWidth
  const height = drawElem.clientHeight
  initialWindowWidth = window.innerWidth 
  initialWindowHeight =  window.innerHeight 
  initialWidth = width 
  initialHeight =  height 
  const aspect = width / height

  
  //clock
  const clock = new THREE.Clock()

  //secne
  scene = new THREE.Scene();

  //camera
  perspectiveCamera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
  orthographicCamera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );

  perspectiveCamera.up.set( 0, 0, 1 );
  perspectiveCamera.position.set( 100, 100, 100 );

  orthographicCamera.up.set( 0, 0, 1 );
  orthographicCamera.position.set( 100, 100, 100 );


  //renderer
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  })
  renderer.setSize(width, height);
  drawElem.appendChild(renderer.domElement);


  //objects
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry( 50, 50, 50 ),
    new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } )
  );
  scene.add(mesh)
  meshList.add(mesh)

  //axes
  const axes = new THREE.AxesHelper(100);
  scene.add(axes);
  meshList.add(axes)

  //grid helper
  const gridHelper = new THREE.GridHelper( 50, 50 );
  gridHelper.rotation.x=Math.PI/2
  scene.add( gridHelper );
  meshList.add(gridHelper)


  //lights
  const directionalLightP = new THREE.DirectionalLight(0xffffff)
  const directionalLightO = new THREE.DirectionalLight(0xffffff)
  directionalLightP.position.set(100,100,100)
  directionalLightO.position.set(100,100,100)
  directionalLightP.visible = true
  directionalLightO.visible = false
  perspectiveCamera.add(directionalLightP)
  orthographicCamera.add(directionalLightO)
  scene.add(perspectiveCamera)
  scene.add(orthographicCamera)
 
  //gui
	const gui = new GUI({autoPlace:false});
	gui.add( params, 'orthographicCamera' ).name( 'use orthographic' ).onChange( value=> {
	  controls.dispose()
    if(value){
      directionalLightP.visible = false 
      directionalLightO.visible = true 
      createControls(orthographicCamera)
    }
    else{
      directionalLightP.visible = true 
      directionalLightO.visible = false 
      createControls(perspectiveCamera)
    }
	})
  elements.gui.appendChild(gui.domElement);

  //camera contorl
	createControls(perspectiveCamera)

}


const	createControls = camera => {
  controls = new TrackballControls( camera, renderer.domElement );
  controls.rotateSpeed = 3.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];
}

const animate = () => {
  requestAnimationFrame( animate )
	controls.update()
	render();
}

const render = () => {
	const camera = ( params.orthographicCamera ) ? orthographicCamera : perspectiveCamera;
	renderer.render( scene, camera );
}

export const clear = () => {
  meshList.forEach(v=>scene.remove(v))
  meshList.clear()
}



const resizeElement = () => {
  const windowWidth = window.innerWidth 
  const windowHeight =  window.innerHeight 
  const deltaWidth = windowWidth - initialWindowWidth
  const deltaHeight = windowHeight - initialWindowHeight

  const width = initialWidth + deltaWidth
  const height = initialHeight + deltaHeight

  const aspect = width/height
  perspectiveCamera.aspect = aspect;
  perspectiveCamera.updateProjectionMatrix();
  orthographicCamera.left = - frustumSize * aspect / 2;
  orthographicCamera.right = frustumSize * aspect / 2;
  orthographicCamera.top = frustumSize / 2;
  orthographicCamera.bottom = - frustumSize / 2;
  orthographicCamera.updateProjectionMatrix();
  renderer.setSize(width, height);
  controls.handleResize();

}


const windowResizeFunc = () =>{
  if (resizeFlg !== false) {
    clearTimeout(resizeFlg)
  }
  resizeFlg = setTimeout(()=> {
    resizeElement()
  }, 100);
}


export const import3DM = () => {
 	const loader = new Rhino3dmLoader()
	loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@7.11.1/' )
	loader.load( 'models/3dm/Rhino_Logo.3dm',  (object) => {
	  scene.add(object)
    initGUI( object.userData.layers )
  })
}

export const importGLTF = (url) =>{
  const loader = new GLTFLoader()
  loader.load(url, ( gltf )=> {
    scene.add( gltf.scene )
    meshList.add(gltf.scene)
    render()
  })
}
