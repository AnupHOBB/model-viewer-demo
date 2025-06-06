import * as THREE from 'three'
import {LineMaterial} from 'line-material'
import {LineGeometry} from 'line-geometry'
import {Line2} from 'line2'

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
        this.isVisible = false
        this.type = type
        this.endLineSize = cameraZ * Math.tan(CAM_ANGLE_IN_RADIAN)
        this.dimension = new THREE.Group()
        this.lineMaterial = new LineMaterial({color: this._toGammaCorrected(new THREE.Color(0, 163/255, 1), 0.455)})
        this.lineMaterial.linewidth = 2
        this.lineMaterial.needsUpdate = true
    
        const points = this._getLinePoints(type)

        this.dimensionText = document.createElement('p')
        this.dimensionText.className = 'dimension'
        
        this.dimensionPoint = new THREE.Object3D()
        this.dimensionPoint.position.set((points[0].x + points[1].x)/2, (points[0].y + points[1].y)/2, (points[0].z + points[1].z)/2)
        this._attach(this.dimensionPoint)

        this.lineGeometry = new LineGeometry().setFromPoints(points)
        this.line = new Line2(this.lineGeometry, this.lineMaterial)
        this.line.computeLineDistances()
        this.dimension.attach(this.line)
    
        this.endPoints = this._getEndPoints(type)
        this.endLineGeometry = new LineGeometry().setFromPoints(this.endPoints)
        this.endLine1 = new Line2(this.endLineGeometry, this.lineMaterial)
        this.dimension.attach(this.endLine1)
        
        this.endLine2 = new Line2(this.endLineGeometry, this.lineMaterial)
        this.dimension.attach(this.endLine2)
        
        scene.add(this.dimension)

        this.dimension.visible = false
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

    setText(text) 
    { 
        this.dimensionText.innerText = text
        this.dimensionText.style.width = this._calculateTextWidth(text)
    }

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
        this.dimensionText.style.width = this._calculateTextWidth(this.dimensionText.innerText)
    }

    show()
    {
        if (!this.isVisible)
        {
            document.body.appendChild(this.dimensionText)
            this.dimension.visible = true
            this.isVisible = true
        }
    }

    hide()
    {
        if (this.isVisible)
        {
            document.body.removeChild(this.dimensionText)
            this.dimension.visible = false
            this.isVisible = false
        }
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
                return [new THREE.Vector3(0, 0, 0), new THREE.Vector3(this.endLineSize, 0, 0)]
            case TYPE.DEPTH:
                return [new THREE.Vector3(-this.endLineSize, 0, 0), new THREE.Vector3(0, 0, 0)]
            case TYPE.WIDTH:
                return [new THREE.Vector3(0, 0, -this.endLineSize), new THREE.Vector3(0, 0, 0)]
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

    _calculateTextWidth(value)
    {
        let valueBeforeDecimal = value.split('.')[0]
        let startWidth = (window.innerWidth/window.innerHeight) < 1.25 ? 6 : 2
        let length = valueBeforeDecimal.length == 1 ? 2 : valueBeforeDecimal.length
        let width = startWidth * length
        return width+'vw'
    }

    _toGammaCorrected(color, gamma) { return new THREE.Color(Math.pow(color.r, 1/gamma), Math.pow(color.g, 1/gamma), Math.pow(color.b, 1/gamma)) }
}

export class HeightDimension extends Dimension { constructor(scene, cameraZ) { super(TYPE.HEIGHT, scene, cameraZ) } }

export class WidthDimension extends Dimension { constructor(scene, cameraZ) { super(TYPE.WIDTH, scene, cameraZ) } }

export class DepthDimension extends Dimension { constructor(scene, cameraZ) { super(TYPE.DEPTH, scene, cameraZ) } }