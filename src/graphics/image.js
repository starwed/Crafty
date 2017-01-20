var Crafty = require('../core/core.js');


//
// Define some variables required for webgl
var fs = require('fs');

Crafty.defaultShader("Image", new Crafty.WebGLShader(
    fs.readFileSync(__dirname + '/shaders/sprite.vert', 'utf8'),
    fs.readFileSync(__dirname + '/shaders/sprite.frag', 'utf8'),
    [
        { name: "aPosition",     width: 2 },
        { name: "aOrientation",  width: 3 },
        { name: "aLayer",        width: 2 },
        { name: "aTextureCoord", width: 2 }
    ],
    function(e, _entity) {
        var pos = e.pos;
        // Write texture coordinates
        e.program.writeVector("aTextureCoord",
            0, 0,
            0, pos._h,
            pos._w, 0,
            pos._w, pos._h
        );
    }
));

/**@
 * #Image
 * @category Graphics
 * @kind Component
 * 
 * Draw an image with or without repeating (tiling).
 */
Crafty.c("Image", {
    _repeat: "repeat",
    ready: false,

    init: function () {
        this.bind("Draw", this._drawImage);
        this.bind("LayerAttached", this._setupImage);
    },

    remove: function() {
        this.unbind("LayerAttached", this._setupImage);
        this.unbind("Draw", this._drawImage);
    },

    /**@
     * #.image
     * @comp Image
     * @kind Method
     * 
     * @trigger Invalidate - when the image is loaded
     * @sign public this .image(String url[, String repeat])
     * @param url - URL of the image
     * @param repeat - If the image should be repeated to fill the entity.  This follows CSS syntax: (`"no-repeat", "repeat", "repeat-x", "repeat-y"`), but defaults to `no-repeat`.
     *
     * Draw the specified image.
     *
     * @note The default value of repeat is `no-repeat`, which is different than the standard CSS default
     *
     * If the width and height are `0` and repeat is set to `no-repeat` the width and
     * height will automatically assume that of the image. This is an
     * easy way to create an image without needing sprites.
     *
     * If set to `no-repeat` and given dimensions larger than that of the image,
     * the exact appearance will depend on what renderer (WebGL, DOM, or Canvas) is used.
     *
     * @example
     * Will default to no-repeat. Entity width and height will be set to the images width and height
     * ~~~
     * var ent = Crafty.e("2D, DOM, Image").image("myimage.png");
     * ~~~
     * Create a repeating background.
     * ~~~
     * var bg = Crafty.e("2D, DOM, Image")
     *              .attr({w: Crafty.viewport.width, h: Crafty.viewport.height})
     *              .image("bg.png", "repeat");
     * ~~~
     *
     * @see Crafty.sprite
     */
    _imageScale: 1,
    _preImage: null,
    image: function (url, repeat, scale) {
        delete this._scaledImage;
        this.__image = url;
        this._repeat = repeat || "no-repeat";
        this._imageScale = scale || 1;
        this._baseImg = Crafty.asset(url);
        if (!this._baseImg) {
            this._baseImg = new Image();
            this._baseImg.src = url;
            Crafty.asset(url, this._baseImg);
            var self = this;

            this._baseImg.onload = function () {
                self._setupImage(self._drawLayer);
            };
        } else {
            this._setupImage(this._drawLayer);
        }

        this.trigger("Invalidate");

        return this;
    },

    _createScaledImage: function(img, scale) {
        var tempCanvas = document.createElement("canvas");
        var ctx = tempCanvas.getContext("2d");
        var w = tempCanvas.width = img.width * scale;
        var h = tempCanvas.height = img.height * scale;
        ctx.drawImage(img,0,0,w, h);
        var scaledImage = new Image();
        scaledImage.src = tempCanvas.toDataURL();
        scaledImage.width = w;
        scaledImage.height = h;
        return scaledImage;
    },

    // called on image change or layer attachment
    _setupImage: function(layer){
        if (!this._baseImg || !layer) return;
        if (this._imageScale === 1) {
            this.img = this._baseImg;
        } else {
            // Right now, generate this every time
            // In the future, 
            this.img = this._createScaledImage(this._baseImg, this._imageScale);
        }
        if (layer.type === "Canvas") {
            this._pattern = this._drawContext.createPattern(this.img, this._repeat);
        } else if (layer.type === "WebGL") {
            var prefix = "image-scale(" + this._imageScale + "):";
            console.log("made, ", prefix);
            this._establishShader(prefix + this.__image, Crafty.defaultShader("Image"));
            var texture = this._drawLayer.makeTexture(this.__image, this.img, (this._repeat!=="no-repeat"), prefix);
            this.program.setTexture(texture);
        }

        if (this._repeat === "no-repeat") {
            this.w = this.w || this.img.width;
            this.h = this.h || this.img.height;
        }

        this.ready = true;
        this.trigger("Invalidate");
    },

    _drawImage: function(e){
        if (e.type === "canvas") {
            //skip if no image
            if (!this.ready || !this._pattern) return;

            var context = e.ctx;

            context.fillStyle = this._pattern;

            context.save();
            context.translate(e.pos._x, e.pos._y);
            context.fillRect(0, 0, e.pos._w, e.pos._h);
            context.restore();
        } else if (e.type === "DOM") {
            if (this.img.src) {
              e.style.backgroundImage = "url(" + this.img.src + ")";
              e.style.backgroundRepeat = this._repeat;
            }
        } else if (e.type === "webgl") {
          e.program.draw(e, this);
        }

    }
});
