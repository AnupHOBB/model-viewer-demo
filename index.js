import * as THREE from 'three'
import { OrbitControls } from 'orbit'
import { GLTFLoader } from 'gltf-loader'
import { FontLoader } from 'font-loader'
import { QRViewer } from './QRViewer.js'
import { WidthDimension, HeightDimension, DepthDimension } from './Dimension.js'

const MODEL_PATH = 'assets/SparklingSpringWater01234_28oz_M.glb'

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

    let widthDimension = new WidthDimension(scene, cameraPos.z)
    let heightDimension = new HeightDimension(scene, cameraPos.z)
    let depthDimension = new DepthDimension(scene, cameraPos.z)

    let gltfLoader = new GLTFLoader()
    gltfLoader.load(MODEL_PATH, model=>{
        hasModelLoaded = true
        const loader = new FontLoader();
        loader.load( 'Roobert_Medium_Regular.json', function (font) {
            status = 100
            scene.add(model.scene)
            let bound = new THREE.Box3()
            bound.setFromObject(model.scene)
            positionCamera(bound)
            
            widthDimension.setSize(bound.max.x - bound.min.x)
            let width = (bound.max.x - bound.min.x).toFixed('2')
            widthDimension.setText(width+'')
            widthDimension.setZ(bound.max.z)

            heightDimension.setSize(bound.max.y - bound.min.y)
            let height = (bound.max.y - bound.min.y).toFixed('2')
            heightDimension.setText(height+'')
            heightDimension.setX(bound.min.x - (heightDimension.endLineSize * 2))
            heightDimension.setY((bound.max.y - bound.min.y)/2)

            depthDimension.setSize(bound.max.z - bound.min.z)
            let depth = (bound.max.z - bound.min.z).toFixed('2')
            depthDimension.setText(depth+'')
            depthDimension.setX(bound.max.x + (depthDimension.endLineSize * 2))
            depthDimension.setY(bound.min.y)

            document.body.removeChild(loadingScreen)
        })
    }, p=>{
        status = (p.loaded/p.total) * 99
        status = Math.trunc(status)
        if (status > 99)
            status = 99
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
        widthDimension.updateDimensionTextPosition(camera)
        heightDimension.updateDimensionTextPosition(camera)
        depthDimension.updateDimensionTextPosition(camera)
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

    function positionCamera(bound)
    {
        if (bound != undefined)
        {
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