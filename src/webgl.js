var Crafty = require('./core.js'),
    document = window.document;






// New fragmetn/vertex for color


/*
attribute vec2 aPosition;
attribute vec3 aOrientation;
attribute vec2 aDepth;
attribute vec4 aColor;

varying lowp vec4 vColor;

uniform  vec4 uViewport;

mat4 viewportScale = mat4(2.0 / uViewport.z, 0, 0, 0,    0, -2.0 / uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);
vec4 viewportTranslation = vec4(uViewport.xy, 0, 0);

vec2 entityOrigin = aOrientation.xy;
mat2 entityRotationMatrix = mat2(cos(aOrientation.z), sin(aOrientation.z), -sin(aOrientation.z), cos(aOrientation.z));

void main() {
  vec2 pos = aPosition;
  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin ;
  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 1.0/(1.0+exp(aDepth.x) ), 1) );
  vColor = aColor;
}

*/


var COLOR_VERTEX_SHADER = 
  "attribute vec2 aPosition;\r\nattribute vec3 aOrientation;\r\nattribute vec2 aDepth;\r\nattribute vec4 aColor;\r\n\r\nvarying lowp vec4 vColor;\r\n\r\nuniform  vec4 uViewport;\r\n\r\nmat4 viewportScale = mat4(2.0 \/ uViewport.z, 0, 0, 0,    0, -2.0 \/ uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);\r\nvec4 viewportTranslation = vec4(uViewport.xy, 0, 0);\r\n\r\nvec2 entityOrigin = aOrientation.xy;\r\nmat2 entityRotationMatrix = mat2(cos(aOrientation.z), sin(aOrientation.z), -sin(aOrientation.z), cos(aOrientation.z));\r\n\r\nvoid main() {\r\n  vec2 pos = aPosition;\r\n  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin ;\r\n  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 1.0\/(1.0+exp(aDepth.x) ), 1) );\r\n  vColor = aColor;\r\n}\r\n";


var COLOR_FRAGMENT_SHADER = "";


/*
attribute vec2 aPosition;
attribute vec3 aOrientation;
attribute vec2 aDepth;
attribute vec2 aTextureCoord;

varying mediump vec2 vTextureCoord;

uniform vec4 uViewport;
uniform mediump vec2 uTextureDimensions;

mat4 viewportScale = mat4(2.0 / uViewport.z, 0, 0, 0,    0, -2.0 / uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);
vec4 viewportTranslation = vec4(uViewport.xy, 0, 0);

vec2 entityOrigin = aOrientation.xy;
mat2 entityRotationMatrix = mat2(cos(aOrientation.z), sin(aOrientation.z), -sin(aOrientation.z), cos(aOrientation.z));

void main() {
  vec2 pos = aPosition;
  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin ;
  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 1.0/(1.0+exp(aDepth.x) ), 1) );
  vTextureCoord = aTextureCoord;
}

*/

var SPRITE_VERTEX_SHADER = 
  "attribute vec2 aPosition;\r\nattribute vec3 aOrientation;\r\nattribute vec2 aDepth;\r\nattribute vec2 aTextureCoord;\r\n\r\nvarying mediump vec2 vTextureCoord;\r\n\r\nuniform vec4 uViewport;\r\nuniform mediump vec2 uTextureDimensions;\r\n\r\nmat4 viewportScale = mat4(2.0 \/ uViewport.z, 0, 0, 0,    0, -2.0 \/ uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);\r\nvec4 viewportTranslation = vec4(uViewport.xy, 0, 0);\r\n\r\nvec2 entityOrigin = aOrientation.xy;\r\nmat2 entityRotationMatrix = mat2(cos(aOrientation.z), sin(aOrientation.z), -sin(aOrientation.z), cos(aOrientation.z));\r\n\r\nvoid main() {\r\n  vec2 pos = aPosition;\r\n  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin ;\r\n  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 1.0\/(1.0+exp(aDepth.x) ), 1) );\r\n  vTextureCoord = aTextureCoord;\r\n}";

/*
    varying mediump vec2 vTextureCoord;
      
    uniform sampler2D uSampler;
    uniform mediump vec2 uTextureDimensions;

    void main(void) {
      highp vec2 coord =   vTextureCoord / uTextureDimensions;
      gl_FragColor = texture2D(uSampler, coord);
    }
*/


var SPRITE_FRAGMENT_SHADER = 
  "    varying mediump vec2 vTextureCoord;\r\n      \r\n    uniform sampler2D uSampler;\r\n    uniform mediump vec2 uTextureDimensions;\r\n\r\n    void main(void) {\r\n      highp vec2 coord =   vTextureCoord \/ uTextureDimensions;\r\n      gl_FragColor = texture2D(uSampler, coord);\r\n    }";



RenderProgram = function(context, shader){
    this.shader = shader;
    this.context = context;
    this._bufferArray = new Float32Array(4000);
    this._kingBuffer = context.createBuffer();
    this.index = new Uint16Array(600);
    this._indexBuffer = context.createBuffer();
    this._attribute_table = {};
    this._elementCount = 0;
}

RenderProgram.prototype = {
    setAttributes: function(attributes){
        this.attributes = attributes;
        var offset = 0;
        for (var i=0; i<attributes.length; i++){
            var a = attributes[i];
            this._attribute_table[a.name] = a;

            a.bytes = a.bytes || Float32Array.BYTES_PER_ELEMENT;
            a.type = a.type || this.context.FLOAT;
            a.offset = offset;
            a.location = this.context.getAttribLocation(this.shader, a.name);

            this.context.enableVertexAttribArray(a.location);

            offset += a.width;
        }

        // Stride is the full width including the last set
        this.stride = offset;
    },

    setCurrentElement: function(el){
        this.el_offset = el._glNum*4;
        this.el = el;
    },

    switchTo: function(){
        var gl = this.context;
        gl.useProgram(this.shader);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._kingBuffer);
        var a, attributes = this.attributes;
        // Process every attribute
        for (var i=0; i<attributes.length; i++){
            a = attributes[i];
            gl.vertexAttribPointer(a.location, a.width, a.type, false, this.stride*a.bytes, a.offset*a.bytes);
        }

        this.index_pointer = 0;
    },

    bindTexture: function(texture_obj) {
        // Only needs to be done once
        if (this.texture_obj !== undefined)
            return
        var gl = this.context;
        gl.useProgram(this.shader);
        // Set the texture buffer to use
        gl.uniform1i(gl.getUniformLocation(this.shader, "uSampler"), texture_obj.sampler);
        // Set the image dimensions
        gl.uniform2f(gl.getUniformLocation(this.shader, "uTextureDimensions"), texture_obj.width, texture_obj.height);
        
        this.texture_obj = texture_obj;  
    },

    addIndices: function(offset){
        var index = this.index, l = this.index_pointer;
        console.log(offset, this.index_pointer);
        index[0+l] = 0 + offset;
        index[1+l] = 1 + offset;
        index[2+l] = 2 + offset;
        index[3+l] = 1 + offset;
        index[4+l] = 2 + offset;
        index[5+l] = 3 + offset;

        this.index_pointer+=6;
    },

    renderBatch: function(){
        var gl = this.context;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._kingBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._bufferArray, gl.STATIC_DRAW); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.index_pointer, gl.UNSIGNED_SHORT, 0);
        //console.log("Batch info\n", this.index_pointer)
        //console.log(this.index)
        

        console.log("First row of ", this.name)
        
        for(var off =0; off<12; off++){
            var rw = [];
            for (var i=0; i<this.stride; i++)
                rw.push(this._bufferArray[i+off*this.stride])
            console.log(rw);
        }

    },

    writeVector: function (name, x, y){
    //console.log(arguments);
        var a = this._attribute_table[name];
        var offset = a.offset+this.el_offset*this.stride, stride = this.stride;
        var l = (arguments.length-1);
        var data = this._bufferArray;
        //console.log("---\n", name, stride, offset, this.el_offset);

        // Fill in the attribtue with the given arguments, cycling through the data if necessary
        // If the arguments provided match the width of the attribute, that means it'll fill the same values for each of the four vertices.
        // TODO determine if this is too big a performance penalty!
        for (var r=0; r<4 ; r++)
            for (var c=0; c<a.width; c++){
                //console.log("Data info", r, c, "index", offset+stride*r+c);
                data[offset + stride*r + c] = arguments[ (a.width*r + c)%l + 1];    
            }
      }

     
}



Crafty.c("TestColor", {
  _GL_attributes:  [
        {name:"aPosition", width: 2},
        {name:"aOrientation", width: 3},
        {name:"aDepth", width:2},
        {name:"aColor",  width: 4}
  ],
  init: function(){
      if (this.has("WebGL")){
        this._establishShader("TestColor", this._fragmentShader, this._vertexShader, this._GL_attributes);
      }


      this._red = this._blue = this._green = 1.0;
      this.bind("Draw", this._drawColor);

  },



  _fragmentShader: 
    "precision mediump float;"
    + "varying lowp vec4 vColor;"
    + "void main(void) {"
    + "  gl_FragColor = vColor;"
    + "}",

  _vertexShader: COLOR_VERTEX_SHADER,

  _drawColor: function(drawVars){
    // Write the vertex data into the array
    var prog = drawVars.program;
    prog.writeVector("aColor",
        this._red,
        this._green,
        this._blue,
        1
    );

  },

 

  color: function (r, g, b){
    this._red = r;
    this._green = g;
    this._blue = b;

    return this;
  }

});





Crafty.c("GLSprite", {
  _GL_attributes:  [
        {name:"aPosition", width: 2},
        {name:"aOrientation", width: 3},
        {name:"aDepth", width:2},
        {name:"aTextureCoord",  width: 2}
  ],
  init: function(){
      if (this.has("WebGL")){
        this._establishShader(this.__image, this._fragmentShader, this._vertexShader, this._GL_attributes);
        this.program.bindTexture( this.webgl.makeTexture(this.__image, this.img) );
        

      }


      
      this.bind("Draw", this._drawSprite);

  },

  _fragmentShader: SPRITE_FRAGMENT_SHADER,

  _vertexShader: SPRITE_VERTEX_SHADER,

  _drawSprite: function(drawVars){
    var prog = drawVars.program;
    var co = drawVars.co;
    // Write texture coordinates
    prog.writeVector("aTextureCoord",
        co.x, co.y,
        co.x, co.y + co.h,
        co.x + co.w, co.y,
        co.x + co.w, co.y + co.h
    );

  }



});



// This will totally assume, for now, that gl-matrix is available
Crafty.c("WebGL", {
    init: function () {
        if (!Crafty.webgl.context) {
            Crafty.webgl.init();
        }

        var webgl = this.webgl = Crafty.webgl;
        var gl = webgl.context;

        //increment the amount of canvas objs
        webgl.entities++;
        
        this._changed = true;
        webgl.add(this);

        this.bind("Change", function (e) {
            //flag if changed
            if (this._changed === false) {
                this._changed = true;
                webgl.add(this);
            }

        });

        this.bind("Remove", function () {
            webgl.entities--;
            this._changed = true;
            webgl.add(this);
        });

    },

    /**@
     * #.draw
     * @comp WebGL
     * @sign public this .draw([[Context ctx, ]Number x, Number y, Number w, Number h])
     * @param ctx - Canvas 2D context if drawing on another canvas is required
     * @param x - X offset for drawing a segment
     * @param y - Y offset for drawing a segment
     * @param w - Width of the segment to draw
     * @param h - Height of the segment to draw
     *
     * Method to draw the entity on the canvas element. Can pass rect values for redrawing a segment of the entity.
     */

    // Cache the various objects and arrays used in draw
    drawVars: {
        type: "webgl",
        pos: {},
        ctx: null,
        coord: [0, 0, 0, 0],
        co: {
            x: 0,
            y: 0,
            w: 0,
            h: 0
        }


    },

    draw: function (ctx, x, y, w, h) {

        if (!this.ready) return;

        if (arguments.length === 4) {
            h = w;
            w = y;
            y = x;
            x = ctx;
            ctx = this.webgl.context;
        }


        var pos = this.drawVars.pos;
        pos._x = (this._x + (x || 0));
        pos._y = (this._y + (y || 0));
        pos._w = (w || this._w);
        pos._h = (h || this._h);

        var coord = this.__coord || [0, 0, 0, 0];
        var co = this.drawVars.co;
        co.x = coord[0] + (x || 0);
        co.y = coord[1] + (y || 0);
        co.w = w || coord[2];
        co.h = h || coord[3];

        // Handle flipX, flipY
        if (this._flipX || this._flipY) {
           
        }


        //set alpha
        if (this._alpha < 1.0) {
           
        }

        //Draw entity
        var gl = this.webgl.context;
        this.drawVars.gl = gl;
        var prog = this.drawVars.program = this.program;

        prog.setCurrentElement(this);
        // Write position; x, y, w, h
        prog.writeVector("aPosition",
            this._x, this._y, 
            this._x , this._y + this._h,
            this._x + this._w, this._y,
            this._x + this._w, this._y + this._h
        );

        // Write orientation and z level
        prog.writeVector("aOrientation",
            this._origin.x + this._x,
            this._origin.y + this._y,
            this._rotation
        );

        prog.writeVector("aDepth", 
            this._z,
            this._alpha
        );

        // This should only need to handle *specific* attributes!
        this.trigger("Draw", this.drawVars);

        // Register the vertex groups to be drawn, referring to this entities position in the big buffer
        var offset = this._glNum * 4;
        prog.addIndices(offset);
        
        return this;
    },

    // v_src is optional, there's a default vertex shader that works for regular rectangular entities
    _establishShader: function(compName, f_src, v_src, attributes){
        this.program = this.webgl.initProgram(compName, f_src, v_src, attributes);
        // Needs to know where in the big array we are!
        this._glNum = this.program._elementCount++;
        console.log("Established", compName, this._glNum)
        // Shader program means ready
        this.ready = true;
    }
});

/**@
 * #Crafty.webgl
 * @category Graphics
 *
 * Collection of methods to draw on canvas.
 */
Crafty.extend({

    webgl: {
        /**@
         * #Crafty.webgl.context
         * @comp Crafty.webgl
         *
         * This will return the context of the webgl canvas element.
         * FIXME The value returned from `Crafty.canvas._canvas.getContext('2d')`.
         */
        context: null,
        entities: 0,
        changed_objects: [],
        add: function(e){
        	this.changed_objects.push(e);
        },
        /**@
         * #Crafty.canvas._glCanvas
         * @comp Crafty.webgl
         *
         * WebGL Canvas element
         */

        programs: {},

        compileShader: function (src, type){
            var gl = this.context;
            var shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
              throw(gl.getShaderInfoLog(shader));
            };
            return shader;
        },

        makeProgram: function (fragment_src, vertex_src){
            
            console.log("Making program");
            console.log(fragment_src);
            var gl = this.context;
            var fragment_shader = this.compileShader(fragment_src, gl.FRAGMENT_SHADER);
            var vertex_shader = (vertex_src) ? this.compileShader(vertex_src, gl.VERTEX_SHADER) : this.defaultVertexShader;

            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertex_shader);
            gl.attachShader(shaderProgram, fragment_shader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
              throw("Could not initialise shaders");
            }
            
            shaderProgram.viewport = gl.getUniformLocation(shaderProgram, "uViewport");
            return shaderProgram;
        },

        programs: {},
        initProgram: function(name, fragment_src, vertex_src, attributes){
            if (this.programs[name] === undefined){
                var shader = this.makeProgram(fragment_src, vertex_src);
                var program = new RenderProgram(this.context, shader);
                program.name = name;
                program.setAttributes(attributes);
                this.programs[name] = program;
            }
            return this.programs[name];
        },
        
        textures: {},
        textureCount: 0,
        makeTexture: function(url, image){

            var webgl = this;

            if (typeof webgl.textures[url] !== 'undefined')
              return webgl.textures[url];
            var gl = webgl.context;
            
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).


            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            //gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);

            gl.activeTexture(gl["TEXTURE" + webgl.textureCount]);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            webgl.textures[url] = {
              t: texture,
              sampler: webgl.textureCount,
              key: "TEXTURE" + webgl.textureCount,
              width: image.width,
              height: image.height,
              url: url
            };
            webgl.textureCount++;
            gl.activeTexture(gl["TEXTURE" + (webgl.textureCount)]);
            return webgl.textures[url];
        },

        /**@
         * #Crafty.webgl.init
         * @comp Crafty.webgl
         * @sign public void Crafty.webgl.init(void)
         * @trigger NoWebGL - triggered if `Crafty.support.webgl` is false FIXME actually implement!
         *
         * Creates a `canvas` element inside `Crafty.stage.elem`. Must be called
         * before any entities with the WebGL component can be drawn.
         *
         * This method will automatically be called if no `Crafty.webgl.context` is
         * found.
         */
        init: function () {

            //check if canvas is supported
            if (!Crafty.support.webgl) {
                Crafty.trigger("NoWebGL");
                Crafty.stop();
                return;
            }

            //create an empty canvas element
            var c;
            c = document.createElement("canvas");
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;
            c.style.position = 'absolute';
            c.style.left = "0px";
            c.style.top = "0px";

            Crafty.stage.elem.appendChild(c);

            // Equivalent of initGL in sample prog
            var gl;
    		    try {
    		      gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    		      gl.viewportWidth = c.width;
    		      gl.viewportHeight = c.height;
    		    } catch(e) {
                    //Do nothing!
    		    }

    		    if (!gl) {
    		      Crafty.trigger("NoWebGL");
              return;
    		    }
            this.context = gl;
            this._canvas = c;

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            //gl.enable(gl.DEPTH_TEST);
            
            gl.disable(gl.DEPTH_TEST);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            

            //Bind rendering of canvas context (see drawing.js)
            var webgl = this;
            Crafty.uniqueBind("RenderScene", webgl.render);

            Crafty.uniqueBind("ViewportResize", webgl._resize)
            
            Crafty.uniqueBind("InvalidateViewport", function(){webgl.dirtyViewport = true;})
            this.dirtyViewport = true;

            console.log("webgl inited");

        },

        _resize: function(){
            var c = Crafty.webgl._canvas;
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;

            var gl = Crafty.webgl.context;
            gl.viewportWidth = c.widtxh;
            gl.viewportHeight = c.height;
        },

        setViewportUniforms: function(shaderProgram){
            gl = this.context;
            gl.useProgram(shaderProgram);
            var viewport = Crafty.viewport;
            gl.uniform4f(shaderProgram.viewport, viewport._x, viewport._y, viewport._width, viewport._height);
        },

        render: function(rect){
            //console.log("Rendering webgl context")
            rect = rect || Crafty.viewport.rect();
            var q = Crafty.map.search(rect),
                i = 0,
                l = q.length,
                webgl = Crafty.webgl,
                gl = webgl.context,
                current;



            // Set viewport and clear it
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //We don't set the perspective because the default is what we WANT -- no depth 

            //Set the viewport uniform variables
            var shaderProgram;            
            var programs = webgl.programs;
            if (webgl.dirtyViewport){
              for (var comp in programs){
                  webgl.setViewportUniforms(programs[comp].shader);
              }
              webgl.dirtyViewport = false;
            }


            var batchCount = 0;
            shaderProgram = null;
            for (; i < l; i++) {
                current = q[i];
                if (current._visible && current.__c.WebGL) {
                    if (shaderProgram !== current.program){
                      if (shaderProgram !== null){
                        shaderProgram.renderBatch();
                        batchCount++;
                      }
                      shaderProgram = current.program;
                      shaderProgram.index_pointer = 0;
                      shaderProgram.switchTo();
                    } 
                    current.draw();
                    current._changed = false;
                }
            }

            if (shaderProgram !== null){
              shaderProgram.renderBatch();
              batchCount++;
            }
            console.log("Batches: " + batchCount)
            
        }

    }
});

