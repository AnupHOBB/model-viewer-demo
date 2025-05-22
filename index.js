import * as THREE from 'three'
import { OrbitControls } from 'orbit'
import { GLTFLoader } from 'gltf-loader'
import { FontLoader } from 'font-loader'
import { QRViewer } from './QRViewer.js'
import { WidthDimension, HeightDimension, DepthDimension } from './Dimension.js'

const MODEL_PATH = 'assets/TMPL3660__KKTY3SNT.glb'
const CUBE_MAP_NAMES = ['px.png','nx.png','py.png','ny.png','pz.png','nz.png']
const CUBE_MAP_FOLDER = 'cubemaps/' 

window.onload = () =>
{
    let cameraPos = new THREE.Vector3(0.01, 0.05, 0.4)
    let cameraLookAt = new THREE.Vector3()
    const scene = new THREE.Scene();
    let bgColor = 0.75
    scene.background = new THREE.Color(bgColor, bgColor, bgColor)
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#000000', 0.975)
    scene.add(hemiLight)
    const directLight = new THREE.DirectionalLight('#ffffff', 0.025)
    directLight.position.set(0, 0.05, 100)
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
    let isDimensionSelected = false
    let progressDots = 1
    let status = 0
    let widthDimension
    let heightDimension
    let depthDimension
    let qrViewer = new QRViewer()
    
    let m = document.querySelector('model-viewer')
    m.src = MODEL_PATH

    let dimensionIcon = document.getElementById('dimension-icon')
    let dimensionButton = document.getElementById('dimension-button')
    dimensionButton.addEventListener('click', e=>{
        if (isDimensionSelected)
        {
            dimensionButton.className = 'button-dotted'
            if (widthDimension != undefined)
                widthDimension.hide()
            if (heightDimension != undefined)
                heightDimension.hide()
            if (depthDimension != undefined)
                depthDimension.hide()
        }
        else
        {
            dimensionIcon.src = 'icons/dimension-white.png'
            dimensionButton.className = 'button-dotted-selected'
            if (widthDimension != undefined)
                widthDimension.show()
            if (heightDimension != undefined)
                heightDimension.show()
            if (depthDimension != undefined)
                depthDimension.show()
        }
        isDimensionSelected = !isDimensionSelected
    })

    dimensionButton.addEventListener('mouseenter', e=>{
        if (!isDimensionSelected)
            dimensionIcon.src = 'icons/dimension-white.png' 
    })

    dimensionButton.addEventListener('mouseleave', e=>{
        if (!isDimensionSelected)
            dimensionIcon.src = 'icons/dimension.png'
    })
     
    let arIcon = document.getElementById('ar-icon')
    let arButton = document.getElementById('ar-button')
    arButton.addEventListener('click', e=>{
        if (m.canActivateAR)
            m.activateAR()
        else
            qrViewer.show()
    })

    arButton.addEventListener('mouseenter', e=>{arIcon.src = 'icons/ar-white.png'})
    arButton.addEventListener('mouseleave', e=>{arIcon.src = 'icons/ar.png'})

    let loadingScreen = document.getElementById('loading-screen')
    let loadingText = document.getElementById('loading-text')

    let gltfLoader = new GLTFLoader()
    gltfLoader.load(MODEL_PATH, model=>{
        hasModelLoaded = true
        const loader = new FontLoader();
        loader.load( 'Roobert_Medium_Regular.json', function (font) {
            status = 99
            scene.add(model.scene)
            let bound = new THREE.Box3()
            bound.setFromObject(model.scene)
            positionCamera(bound)
            new THREE.CubeTextureLoader().setPath(CUBE_MAP_FOLDER).load(CUBE_MAP_NAMES, cubeTexture => {
                status = 100
                applyEnvMap(model.scene, cubeTexture)
                widthDimension = new WidthDimension(scene, cameraPos.z)
                widthDimension.setSize(bound.max.x - bound.min.x)
                let width = (toInch(bound.max.x - bound.min.x)).toFixed('2')
                widthDimension.setText(width+' in')
                widthDimension.setX((bound.max.x + bound.min.x)/2)
                widthDimension.setZ(bound.max.z + (widthDimension.endLineSize * 2))

                heightDimension = new HeightDimension(scene, cameraPos.z)
                heightDimension.setSize(bound.max.y - bound.min.y)
                let height = (toInch(bound.max.y - bound.min.y)).toFixed('2')
                heightDimension.setText(height+' in')
                heightDimension.setX(bound.min.x - (heightDimension.endLineSize * 2))
                heightDimension.setY((bound.max.y - bound.min.y)/2)
                heightDimension.setZ((bound.max.z + bound.min.z)/2)

                depthDimension = new DepthDimension(scene, cameraPos.z)
                depthDimension.setSize(bound.max.z - bound.min.z)
                let depth = (toInch(bound.max.z - bound.min.z)).toFixed('2')
                depthDimension.setText(depth+' in')
                depthDimension.setX(bound.max.x + (depthDimension.endLineSize * 2))
                depthDimension.setY(bound.min.y)
                depthDimension.setZ((bound.max.z + bound.min.z)/2)

                document.body.removeChild(loadingScreen)
            })
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
        if (widthDimension != undefined)
            widthDimension.updateDimensionTextPosition(camera)
        if (heightDimension != undefined)
            heightDimension.updateDimensionTextPosition(camera)
        if (depthDimension != undefined)
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

    function toInch(meter) { return meter * 39.36 }

    function applyEnvMap(threeJsObject, envMap)
    {
        if (threeJsObject.isMesh)
        {    
            threeJsObject.material.envMap = envMap
            threeJsObject.material.envMapIntensity = 1
        }
        else if (threeJsObject.children.length > 0)
        {
            for (let i=0; i<threeJsObject.children.length; i++)   
                applyEnvMap(threeJsObject.children[i], envMap)
        }
    }
}