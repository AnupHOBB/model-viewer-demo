import * as THREE from 'three'
import { OrbitControls } from 'orbit'
import { LineMaterial } from 'lineMaterial'
import { GLTFLoader } from 'gltf-loader'
import { QRViewer } from './QRViewer.js'

const MODEL_PATH = 'bottle.glb'

window.onload = () =>
{
    let cameraPos = new THREE.Vector3(0.01, 0.05, 0.4)
    let cameraLookAt = new THREE.Vector3()
    const scene = new THREE.Scene();
    let bgColor = 0.75
    scene.background = new THREE.Color(bgColor, bgColor, bgColor)
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#000000', 6)
    scene.add(hemiLight)
    const directLight = new THREE.DirectionalLight('#ffffff', 1)
    directLight.position.set(0, 0.05, 0.5)
    const directLightTarget = new THREE.Object3D()
    directLightTarget.position.set(0, 0.5, 0)
    scene.add(directLightTarget)
    directLight.target = directLightTarget
    scene.add(directLight)
    let canvas = document.querySelector('canvas')
    const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true})
    renderer.setPixelRatio(2)
    const controls = new OrbitControls(camera, renderer.domElement )
    
    controls.update()
    controls.enablePan = false
    controls.enableZoom = false

    let hasModelLoaded = false
    let progressDots = 1
    let status = 0
    let qrViewer = new QRViewer()
    
    let m = document.querySelector('model-viewer')
    m.src = MODEL_PATH
     
    let arButton = document.getElementById('ar-button')
    arButton.addEventListener('click', e=>{
        if (m.canActivateAR)
            m.activateAR()
        else
            qrViewer.show()
    })

    let loadingScreen = document.getElementById('loading-screen')
    let loadingText = document.getElementById('loading-text')

    let gltfLoader = new GLTFLoader()
    gltfLoader.load(MODEL_PATH, model=>{
        hasModelLoaded = true
        scene.add(model.scene)
        positionCamera(model.scene)
        status = 100
        document.body.removeChild(loadingScreen)
    }, p=>{
        status = (p.loaded/p.total) * 50
        status = Math.trunc(status)
        if (status > 50)
            status = 50
    }, e=>{})

    showProgress()

    animate()
    function animate() 
    {
        requestAnimationFrame(animate)
        camera.aspect = window.innerWidth/window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.render(scene, camera)
        controls.update()
        directLight.position.set(camera.position.x, camera.position.y, camera.position.z)
        directLight.lookAt(new THREE.Vector3())

    }

    function showProgress()
    {
        if (!hasModelLoaded)
        {
            setTimeout(()=>{
                let dots = ''
                for (let i=0; i<progressDots; i++)
                    dots += '.'
                progressDots++
                if (progressDots > 3)
                    progressDots = 1
                loadingText.innerText = 'LOADING'+dots+' '+status+'%'
                showProgress()
            }, 100)
        }
    }

    function positionCamera(model)
    {
        if (model != undefined)
        {
            let bound = new THREE.Box3()
            bound.setFromObject(model)
            let distanceVector = new THREE.Vector3(bound.max.x - bound.min.x, bound.max.y - bound.min.y, bound.max.z - bound.min.z)
            let midPoint = new THREE.Vector3((bound.max.x + bound.min.x)/2, (bound.max.y + bound.min.y)/2, (bound.max.z + bound.min.z)/2)
            let factor = (distanceVector.length()/2) * Math.cos(THREE.MathUtils.degToRad(camera.fov/2))
            cameraPos = new THREE.Vector3(0, midPoint.y, factor * 4)
            camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
            cameraLookAt = new THREE.Vector3(0, midPoint.y, 0)
            controls.target = cameraLookAt
        }
    }
}