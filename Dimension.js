import * as THREE from 'three'
import { TextGeometry } from 'text-geometry'


//text depth is 0.001 when camera is at z = 3
const CAM_ANGLE_IN_RADIAN = 0.024994793618920156

const TYPE = 
{
    HEIGHT : 0,
    WIDTH : 1,
    DEPTH : 2,
}

class Dimension
{
    constructor(type, scene, font, cameraZ)
    {
        this.type = type
        let width = cameraZ * Math.tan(CAM_ANGLE_IN_RADIAN) * 2
        let height = width/2
        this.planeSize = {width: width, height: height}
        this.fontSize = height/2
        this.dimension = new THREE.Group()
        this.font = font
        this.textDepth = (0.001 * cameraZ)/3
        let dimensionTextGeometry = new TextGeometry('40', {
            font: this.font,
            size: this.fontSize,
            depth: this.textDepth,
            curveSegments: 16,
            bevelEnabled: false,
            bevelThickness: 0.0125,
            bevelSize: 0.025,
            bevelOffset: 0,
            bevelSegments: 16
        })
        dimensionTextGeometry.center()
        this.dimensionTextMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color(1, 1, 1)})
        this.dimensionText = new THREE.Mesh(dimensionTextGeometry, this.dimensionTextMaterial)
        this._attach(this.dimensionText)
    
        this.plane = new THREE.Mesh(new THREE.PlaneGeometry(this.planeSize.width, this.planeSize.height), new THREE.MeshBasicMaterial({color: new THREE.Color(0, 0, 0), side: THREE.DoubleSide}))
        this.plane.position.set(0, 0, 0)
        this._attach(this.plane)
    
        this.lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(1, 0, 0), 
            vertexColors: true, 
            linewidth: this._isHandHeldDevice() ? 1 : 5
        })
        this.lineMaterial.linewidth = 10
        this.lineMaterial.worldUnits = true
        this.lineMaterial.needsUpdate = true
    
        const points = this._getLinePoints(type)
        
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

        if (type == TYPE.DEPTH)
        {
            this.dimensionText.position.y = this.fontSize
            this.plane.position.y = this.fontSize
        }
        
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

    setText(text)
    {
        let position = this.dimensionText.position
        this._detach(this.dimensionText)
        let geometry = new TextGeometry(text, {
            font: this.font,
            size: this.fontSize,
            depth: this.textDepth,
            curveSegments: 16,
            bevelEnabled: false,
            bevelThickness: 0.0125,
            bevelSize: 0.025,
            bevelOffset: 0,
            bevelSegments: 16
        })
        geometry.center()
        this.dimensionText = new THREE.Mesh(geometry, this.dimensionTextMaterial)
        this.dimensionText.position.set(position.x, position.y, position.z)
        this._attach(this.dimensionText)
    }

    setVisibility(visible) { this.dimension.visible = visible }
    
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
                return [new THREE.Vector3(-this.fontSize, 0, 0), new THREE.Vector3(this.fontSize, 0, 0)]
            case TYPE.WIDTH:
                return [new THREE.Vector3(0, -this.fontSize, 0), new THREE.Vector3(0, this.fontSize, 0)]
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

    _isHandHeldDevice() 
    { 
        let device = navigator.userAgent||navigator.vendor||window.opera
        return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(device)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(device.substr(0,4)))
    }
}

export class HeightDimension extends Dimension { constructor(scene, font, cameraZ) { super(TYPE.HEIGHT, scene, font, cameraZ) } }

export class WidthDimension extends Dimension { constructor(scene, font, cameraZ) { super(TYPE.WIDTH, scene, font, cameraZ) } }

export class DepthDimension extends Dimension { constructor(scene, font, cameraZ) { super(TYPE.DEPTH, scene, font, cameraZ) } }