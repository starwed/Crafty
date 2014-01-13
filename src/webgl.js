var Crafty = require('./core.js'),
    document = window.document;

// test fragment shader -- everything is white!
var FRAGMENT_SHADER_SRC = 
  "precision mediump float;"

  +"void main(void) {"
  +"gl_FragColor = vec4(0.0, 1.0, 1.0, 0.5);"
  +"}";

var FRAGMENT_SHADER_SRC_2 = 
  "precision mediump float;"

  +"void main(void) {"
  +"gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);"
  +"}";

// test vertex shader
var VERTEX_SHADER_SRC_OLD = 
  "attribute vec2 aVertexPosition;"
  + "uniform mat2 uGlobalScaleMatrix;"
  + "void main(void) {"
  + " gl_Position = vec4(aVertexPosition, 0, 1);"
  + "}";


// fragment shader source for an image/etc
/*
varying highp vec2 vTextureCoord;
      
uniform sampler2D uSampler;
uniform highp vec2 uTextureDimensions;
uniform highp vec4 uSpriteCoords;

void main(void) {
  highp vec2 coord =  ( uSpriteCoords.zw * vTextureCoord + uSpriteCoords.xy) / uTextureDimensions;
  gl_FragColor = texture2D(uSampler, coord);
}
*/
var TEXTURE_FRAGMENT_SHADER_SRC = 
  "varying highp vec2 vTextureCoord;\r\n      \r\nuniform sampler2D uSampler;\r\nuniform highp vec2 uTextureDimensions;\r\nuniform highp vec4 uSpriteCoords;\r\n\r\nvoid main(void) {\r\n  highp vec2 coord =  ( uSpriteCoords.zw * vTextureCoord + uSpriteCoords.xy) \/ uTextureDimensions;\r\n  gl_FragColor = texture2D(uSampler, coord);\r\n}";


// Vertex shader source, unformatted
/*
attribute vec2 a_position;
uniform  vec4 uViewport;
uniform  vec4 uEntityPos;
uniform  vec4 uEntityExtra;


varying highp vec2 vTextureCoord;

mat4 viewportScale = mat4(2.0 / uViewport.z, 0, 0, 0,    0, -2.0 / uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);
vec4 viewportTranslation = vec4(uViewport.xy, 0, 0);

vec2 entityScale = uEntityPos.zw;
vec2 entityTranslation = uEntityPos.xy;
vec2 entityOrigin = uEntityExtra.xy;
mat2 entityRotationMatrix = mat2(cos(uEntityExtra.w), sin(uEntityExtra.w), -sin(uEntityExtra.w), cos(uEntityExtra.w));

void main() {
  vec2 pos = entityScale * a_position;
  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin + entityTranslation;
  gl_Position = viewportScale * (viewportTranslation + vec4(pos, uEntityExtra.z, 1) );
  vTextureCoord = a_position;
}
*/

// Escape using a tool like [this one](http://www.freeformatter.com/javascript-escape.html).
var VERTEX_SHADER_SRC = 
"attribute vec2 a_position;\r\nuniform  vec4 uViewport;\r\nuniform  vec4 uEntityPos;\r\nuniform  vec4 uEntityExtra;\r\n\r\n\r\nvarying highp vec2 vTextureCoord;\r\n\r\nmat4 viewportScale = mat4(2.0 \/ uViewport.z, 0, 0, 0,    0, -2.0 \/ uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);\r\nvec4 viewportTranslation = vec4(uViewport.xy, 0, 0);\r\n\r\nvec2 entityScale = uEntityPos.zw;\r\nvec2 entityTranslation = uEntityPos.xy;\r\nvec2 entityOrigin = uEntityExtra.xy;\r\nmat2 entityRotationMatrix = mat2(cos(uEntityExtra.w), sin(uEntityExtra.w), -sin(uEntityExtra.w), cos(uEntityExtra.w));\r\n\r\nvoid main() {\r\n  vec2 pos = entityScale * a_position;\r\n  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin + entityTranslation;\r\n  gl_Position = viewportScale * (viewportTranslation + vec4(pos, uEntityExtra.z, 1) );\r\n  vTextureCoord = a_position;\r\n}";



Crafty.c("TestSquare", {
  init: function(){
      if (this.has("WebGL")){
        this._establishShader("TestSquare", this._fragmentShader)
      }

  },

  _fragmentShader: FRAGMENT_SHADER_SRC

});

Crafty.c("TestSquareWhite", {
  init: function(){
      if (this.has("WebGL")){
        this._establishShader("TestSquareWhite", this._fragmentShader)
      }

  },

  _fragmentShader: FRAGMENT_SHADER_SRC_2

});

Crafty.c("TestColor", {
  init: function(){
      if (this.has("WebGL")){
        this._establishShader("TestColor", this._fragmentShader)
      }

      this._red = this._blue = this._green = 1.0;
      this.bind("Draw", this._drawColor)
  },

  _fragmentShader: 
    "precision mediump float;"
    + "uniform lowp vec3 uColor;"
    + "void main(void) {"
    + "  gl_FragColor = vec4(uColor, 1.0);"
    + "}",

  _drawColor: function(drawVars){
    var gl = drawVars.gl, shaderProgram = drawVars.program;
    var color = gl.getUniformLocation(shaderProgram, "uColor");
    gl.uniform3f(color, this._red, this._green, this._blue);
  },

  color: function (r, g, b){
    this._red = r;
    this._green = g;
    this._blue = b;
  }

});



// This will totally assume, for now, that gl-matrix is available
Crafty.c("WebGL", {
    init: function () {
        if (!Crafty.webgl.context) {
            Crafty.webgl.init();
        }

        this.webgl = Crafty.webgl;
        var gl = Crafty.webgl.context;

        //increment the amount of canvas objs
        Crafty.webgl.entities++;
        
        this._changed = true;
        Crafty.webgl.add(this);


        this._vertexBuffer = Crafty.webgl.defaultVertexBuffer;


        this.bind("Change", function (e) {
            //flag if changed
            if (this._changed === false) {
                this._changed = true;
                Crafty.webgl.add(this);
            }

        });


        this.bind("Remove", function () {
            Crafty.webgl.entities--;
            this._changed = true;
            Crafty.webgl.add(this);
        });

          //console.log("init done");
        


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

    _entityMatrix: null,

    draw: function (ctx, x, y, w, h) {

        if (!this.ready) return;

        if (arguments.length === 4) {
            h = w;
            w = y;
            y = x;
            x = ctx;
            ctx = Crafty.webgl.context;
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
        var gl = Crafty.webgl.context;
        this.drawVars.gl = gl;
        var shaderProgram = this._shaderProgram;
        this.drawVars.program = shaderProgram;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this._vertexBuffer.itemSize, gl.FLOAT, false, 0, 0) 


        // Set all the crazy uniform variables for the entity
        gl.uniform4f(shaderProgram.entity_pos, pos._x, pos._y, pos._w, pos._h)
        gl.uniform4f(shaderProgram.entity_extra, this._origin.x, this._origin.y, 1/this._globalZ, this._rotation)

        this.trigger("Draw", this.drawVars);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._vertexBuffer.numItems);
        
        return this;
    },

    // v_src is optional, there's a default vertex shader that works for regular rectangular entities
    _establishShader: function(compName, f_src, v_src){
        var wgl = Crafty.webgl;
        if (typeof wgl.programs[compName] === "undefined"){
          wgl.programs[compName] = wgl.makeProgram(f_src, v_src);
        }
          
        this._shaderProgram = wgl.programs[compName];

        // Shader program means ready
        this.ready = true;
    },
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


            // Get uniform locations
            shaderProgram.entity_pos = gl.getUniformLocation(shaderProgram, "uEntityPos");
            shaderProgram.entity_extra = gl.getUniformLocation(shaderProgram, "uEntityExtra");
            shaderProgram.viewport = gl.getUniformLocation(shaderProgram, "uViewport");
            return shaderProgram;
        },
        
        textures: {},
        textureCount: 0,
        makeTexture: function(url, image){

            var webgl = Crafty.webgl;

            if (typeof webgl.textures[url] !== 'undefined')
              return webgl.textures[url];
            var gl = Crafty.webgl.context;
            
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
             gl.generateMipmap(gl.TEXTURE_2D);
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

        bindTexture: function(program, texture_obj) {
            if (typeof program.texture_obj !== "undefined")
              return;
            var gl = Crafty.webgl.context;
            var webgl = Crafty.webgl;
            gl.useProgram(program);
            // Set the texture buffer to use
            gl.uniform1i(gl.getUniformLocation(program, "uSampler"), texture_obj.sampler);
            // Set the image dimensions
            gl.uniform2f(gl.getUniformLocation(program, "uTextureDimensions"), texture_obj.width, texture_obj.height);
            
            program.texture_obj = texture_obj;
            program.uSpriteCoords = gl.getUniformLocation(program, "uSpriteCoords");
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
            Crafty.webgl.context = gl;
            Crafty.webgl._canvas = c;

            //Set any existing transformations
            /*var zoom = Crafty.viewport._scale;
            if (zoom != 1)
                Crafty.canvas.context.scale(zoom, zoom);*/


            // Create temp shaders and program for now
            // long term, these should somehow be compiled by each *component*, hopefully shared by all entities?
            //
            // Equivalent of initShaders in sample prog
            //

            
            this.defaultVertexShader = this.compileShader(VERTEX_SHADER_SRC, gl.VERTEX_SHADER);
            

            var shaderProgram = this.makeProgram(FRAGMENT_SHADER_SRC);
            this._shaderProgram = shaderProgram;

            gl.useProgram(shaderProgram);

            
            this.defaultVertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.defaultVertexBuffer)
            var vertices = [
              0, 0,
              0, 1,
              1, 0,
              1, 1
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            this.defaultVertexBuffer.itemSize = 2;
            this.defaultVertexBuffer.numItems = 4;


            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "a_position");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

            //
            // End temp program!

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.enable(gl.DEPTH_TEST);
            
            

      

            //Bind rendering of canvas context (see drawing.js)
            Crafty.uniqueBind("RenderScene", Crafty.webgl.render);

            Crafty.uniqueBind("ViewportResize", Crafty.webgl._resize)

            var webgl = Crafty.webgl;
            Crafty.uniqueBind("InvalidateViewport", function(){webgl.dirtyViewport = true;})
            webgl.dirtyViewport = true;

        },

        _resize: function(){
            var c = Crafty.webgl._canvas;
            c.width = Crafty.viewport.width;
            c.height = Crafty.viewport.height;
            gl.viewportWidth = c.width;
            gl.viewportHeight = c.height;
        },

        setViewportUniforms: function(shaderProgram){
            gl = Crafty.webgl.context;
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
                gl = Crafty.webgl.context,
                current;

            // Set viewport and clear it
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //We don't set the perspective because the default is what we WANT -- no depth 

            //Set the viewport uniform variables
            var shaderProgram;            
            var programs = Crafty.webgl.programs;
            if (Crafty.webgl.dirtyViewport){
              for (var comp in programs){
                  Crafty.webgl.setViewportUniforms(programs[comp]);
              }
              Crafty.webgl.dirtyViewport = false;
            }

            for (; i < l; i++) {
                current = q[i];
                if (current._visible && current.__c.WebGL) {
                    //console.log("rendering a thing #" + current[0])
                    shaderProgram = current._shaderProgram;
                    gl.useProgram(shaderProgram);
                    current.draw();
                    current._changed = false;
                }
            }
        }

        

    }
});

