export class QRViewer
{
    constructor()
    {
        this.qrWindowElement = document.getElementById('qr-menu')
        this.crossButtonElement = document.getElementById('qr-cross')
        this.crossButtonElement.addEventListener('click', e=>this.hide())
        this.crossButtonElement.addEventListener('mouseenter', e=>{this.crossButtonElement.src = 'icons/cross-white.png'})
        this.crossButtonElement.addEventListener('mouseleave', e=>{this.crossButtonElement.src = 'icons/cross.png'})
        this.qrContainerElement = document.getElementById('qr')
        new QRCode(this.qrContainerElement, this.extractOrigin(window.location.href))
        document.body.removeChild(this.qrWindowElement)
        this.isVisible = false
    }

    show()
    {
        if (!this.isVisible)
        {
            document.body.appendChild(this.qrWindowElement)
            this.isVisible = true
        }
    }

    hide()
    {
        if (this.isVisible)
        {
            document.body.removeChild(this.qrWindowElement)
            this.crossButtonElement.src = 'icons/cross.png'
            this.isVisible = false
        }
    }

    extractOrigin(url)
    {
        let urlParts = url.split('/')
        let origin = urlParts[0]
        for (let i=1; i<urlParts.length; i++)
        {
            if (urlParts[i] != 'app')
                origin += '/' + urlParts[i] 
            else
                break
        }
        return origin
    }
}