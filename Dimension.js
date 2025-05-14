import * as THREE from 'three'

const CAM_ANGLE_IN_RADIAN = 0.024994793618920156

const TYPE = 
{
    HEIGHT : 0,
    WIDTH : 1,
    DEPTH : 2,
}

class Dimension
{
    constructor(type, scene, cameraZ)
    {
        this.type = type
        this.endLineSize = cameraZ * Math.tan(CAM_ANGLE_IN_RADIAN)
        this.dimension = new THREE.Group()
        this.lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(1, 0, 0), 
            vertexColors: true, 
            linewidth: 1
        })
        this.lineMaterial.linewidth = 1
        this.lineMaterial.worldUnits = true
        this.lineMaterial.needsUpdate = true
    
        const points = this._getLinePoints(type)

        this.dimensionText = document.createElement('p')
        this.dimensionText.className = 'dimension'
        document.body.appendChild(this.dimensionText)

        this.dimensionPoint = new THREE.Object3D()
        this.dimensionPoint.position.set((points[0].x + points[1].x)/2, (points[0].y + points[1].y)/2, (points[0].z + points[1].z)/2)
        this._attach(this.dimensionPoint)

        this.lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial)
        this.line.computeLineDistances()
        this.dimension.attach(this.line)
    
        this.endPoints = this._getEndPoints(type)
        this.endLineGeometry = new THREE.BufferGeometry().setFromPoints(this.endPoints)
        this.endLine1 = new THREE.Line(this.endLineGeometry, this.lineMaterial)
        this.dimension.attach(this.endLine1)
        
        this.endLine2 = new THREE.Line(this.endLineGeometry, this.lineMaterial)
        this.dimension.attach(this.endLine2)
        
        scene.add(this.dimension)
    }

    setX(x) { this.dimension.position.x = x }

    setY(y) { this.dimension.position.y = y }

    setZ(z) { this.dimension.position.z = z }

    setSize(size)
    {
        switch(this.type)
        {
            case TYPE.WIDTH:
            {    
                this.line.scale.x = size
                this.endLine1.position.x = -size/2
                this.endLine2.position.x = size/2
                break
            }
            case TYPE.HEIGHT:
            {    
                this.line.scale.y = size
                this.endLine1.position.y = -size/2
                this.endLine2.position.y = size/2
                break
            }
            case TYPE.DEPTH:
            {    
                this.line.scale.z = size
                this.endLine1.position.z = size/2
                this.endLine2.position.z = -size/2
                break
            }
        }
    }

    setText(text) { this.dimensionText.innerText = text }

    updateDimensionTextPosition(camera)
    {
        let worldPoint = new THREE.Vector3()
        this.dimensionPoint.getWorldPosition(worldPoint)
        worldPoint.project(camera)
        let rect = this.dimensionText.getBoundingClientRect()
        let left = (((worldPoint.x + 1)/2) * window.innerWidth) - (rect.width/2)
        this.dimensionText.style.left = left+'px'
        let top = (((1 - worldPoint.y)/2) * window.innerHeight) - rect.height
        if (this.type == TYPE.DEPTH)
            top -= rect.height/2
        this.dimensionText.style.top = top+'px'
    }
    
    _getLinePoints(type)
    {
        switch(type)
        {
            case TYPE.HEIGHT:
                return [new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.5, 0)]
            case TYPE.DEPTH:
                return [new THREE.Vector3(0, 0, -0.5), new THREE.Vector3(0, 0, 0.5)]
            default:
                return [new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(0.5, 0, 0)]
        }
    }

    _getEndPoints(type)
    {
        switch(type)
        {
            case TYPE.HEIGHT:
            case TYPE.DEPTH:
                return [new THREE.Vector3(-this.endLineSize, 0, 0), new THREE.Vector3(this.endLineSize, 0, 0)]
            case TYPE.WIDTH:
                return [new THREE.Vector3(0, -this.endLineSize, 0), new THREE.Vector3(0, this.endLineSize, 0)]
        }
    }

    _attach(object3D)
    {
        if (object3D != undefined)
        {
            object3D.parent = this.dimension
            this.dimension.children.push(object3D)
        }
    }

    _detach(object3D)
    {
        if (object3D != undefined)
        {
            let i = this.dimension.children.indexOf(object3D)
            if (i > -1)    
            {    
                this.dimension.children.splice(i, 1)
                object3D.parent = null
            }
        }
    }
}

export class HeightDimension extends Dimension { constructor(scene, cameraZ) { super(TYPE.HEIGHT, scene, cameraZ) } }

export class WidthDimension extends Dimension { constructor(scene, cameraZ) { super(TYPE.WIDTH, scene, cameraZ) } }

export class DepthDimension extends Dimension { constructor(scene, cameraZ) { super(TYPE.DEPTH, scene, cameraZ) } }