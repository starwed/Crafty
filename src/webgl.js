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

// Vertex shader source, unformatted
/*
attribute vec2 a_position;
uniform float uViewportWidth;
uniform float uViewportHeight;
uniform float uViewportX;
uniform float uViewportY;

uniform float uEntityWidth;
uniform float uEntityHeight;
uniform float uEntityX;
uniform float uEntityY;
uniform float uEntityZ;

uniform float uOriginX;
uniform float uOriginY;
uniform float uEntityRotation;


mat4 viewportScale = mat4(2.0 / uViewportWidth,0,0,0, 0,-2.0 / uViewportHeight, 0,0, 0,0,1,0, -1, +1.0,0,1);
vec4 viewportTranslation = vec4(uViewportX, uViewportY, 0, 0);

mat2 entityScale = mat2( uEntityWidth, 0, 0, uEntityHeight);
vec2 entityTranslation = vec2(uEntityX, uEntityY);
vec2 entityOrigin = vec2(uOriginX, uOriginY);
mat2 entityRotationMatrix = mat2(cos(uEntityRotation), sin(uEntityRotation), -sin(uEntityRotation), cos(uEntityRotation));

void main() {
  vec2 pos = entityScale * a_position;
  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin + entityTranslation;
  gl_Position = viewportScale * (viewportTranslation + vec4(pos, uEntityZ, 1) );
}
*/


var VERTEX_SHADER_SRC = 
"\r\nattribute vec2 a_position;\r\nuniform float uViewportWidth;\r\nuniform float uViewportHeight;\r\nuniform float uViewportX;\r\nuniform float uViewportY;\r\n\r\nuniform float uEntityWidth;\r\nuniform float uEntityHeight;\r\nuniform float uEntityX;\r\nuniform float uEntityY;\r\nuniform float uEntityZ;\r\n\r\nuniform float uOriginX;\r\nuniform float uOriginY;\r\nuniform float uEntityRotation;\r\n\r\n\r\nmat4 viewportScale = mat4(2.0 \/ uViewportWidth,0,0,0, 0,-2.0 \/ uViewportHeight, 0,0, 0,0,1,0, -1, +1.0,0,1);\r\nvec4 viewportTranslation = vec4(uViewportX, uViewportY, 0, 0);\r\n\r\nmat2 entityScale = mat2( uEntityWidth, 0, 0, uEntityHeight);\r\nvec2 entityTranslation = vec2(uEntityX, uEntityY);\r\nvec2 entityOrigin = vec2(uOriginX, uOriginY);\r\nmat2 entityRotationMatrix = mat2(cos(uEntityRotation), sin(uEntityRotation), -sin(uEntityRotation), cos(uEntityRotation));\r\n\r\nvoid main() {\r\n  vec2 pos = entityScale * a_position;\r\n  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin + entityTranslation;\r\n  gl_Position = viewportScale * (viewportTranslation + vec4(pos, uEntityZ, 1) );\r\n}"



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
    + "uniform float uRed;"
    + "uniform float uBlue;"
    + "uniform float uGreen;"
    + "void main(void) {"
    + "  gl_FragColor = vec4(uRed, uGreen, uBlue, 1.0);"
    + "}",

  _drawColor: function(drawVars){
    var gl = drawVars.gl, shaderProgram = drawVars.program;
    var r = gl.getUniformLocation(shaderProgram, "uRed");
    var g = gl.getUniformLocation(shaderProgram, "uGreen");
    var b = gl.getUniformLocation(shaderProgram, "uBlue");
    gl.uniform1f(r, this._red);
    gl.uniform1f(g, this._green);
    gl.uniform1f(b, this._blue);


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

    // Cache the various objects and arrays used in draw:
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

        //console.log("Beginning draw")



        var pos = this.drawVars.pos;
        pos._x = (this._x + (x || 0));
        pos._y = (this._y + (y || 0));
        pos._w = (w || this._w);
        pos._h = (h || this._h);

        // FIXME defaults to z=0
        // Shouldn't actually be calculated every time!
        //this._calculateVertices()



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

        

        var w = gl.getUniformLocation(shaderProgram, "uEntityWidth");
        var h = gl.getUniformLocation(shaderProgram, "uEntityHeight");
        var x = gl.getUniformLocation(shaderProgram, "uEntityX");
        var y = gl.getUniformLocation(shaderProgram, "uEntityY");
        var z = gl.getUniformLocation(shaderProgram, "uEntityZ");
        gl.uniform1f(w, pos._w);
        gl.uniform1f(h, pos._h);
        gl.uniform1f(x, pos._x);
        gl.uniform1f(y, pos._y);
        gl.uniform1f(z, 1/this._globalZ);

        x = gl.getUniformLocation(shaderProgram, "uOriginX");
        y = gl.getUniformLocation(shaderProgram, "uOriginY");
        var rot = gl.getUniformLocation(shaderProgram, "uEntityRotation");

        gl.uniform1f(x, this._origin.x);
        gl.uniform1f(y, this._origin.y);
        gl.uniform1f(rot, this._rotation);


        this.trigger("Draw", this.drawVars);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._vertexBuffer.numItems);
        
        return this;
    },


    // Create a vertex buffer for a rectangular entity
    _calculateVertices: function(){
    	gl = Crafty.webgl.context;
      //this._vertexBuffer = gl.createBuffer();
    	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer)
    	var vertices = [
        0, 0,
        0, 1,
        1, 0,
        1, 1
      ];
    	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    	this._vertexBuffer.itemSize = 2;
    	this._vertexBuffer.numItems = 4;
    },

    _calculateEntityMatrix: function(){
    	// Create a matrix representing the transformations necessary before rendering this entity
    	

    },

    // v_src is optional, there's a default vertex shader that works for regular rectangular entities
    _establishShader: function(compName, f_src, v_src){
        var wgl = Crafty.webgl;
        if (typeof wgl.programs[compName] === "undefined"){
          wgl.programs[compName] = wgl.makeProgram(f_src, v_src);
        }
          
        this._shaderProgram = wgl.programs[compName];

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
            return shaderProgram;
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

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
            
            

      

            //Bind rendering of canvas context (see drawing.js)
            Crafty.uniqueBind("RenderScene", Crafty.webgl.render);

        },

        setViewportUniforms: function(shaderProgram){
            gl = Crafty.webgl.context;
            var w = gl.getUniformLocation(shaderProgram, "uViewportWidth");
            var h = gl.getUniformLocation(shaderProgram, "uViewportHeight");
            var x = gl.getUniformLocation(shaderProgram, "uViewportX");
            var y = gl.getUniformLocation(shaderProgram, "uViewportY");
            gl.uniform1f(w, Crafty.viewport.width);
            gl.uniform1f(h, Crafty.viewport.height);
            gl.uniform1f(x, Crafty.viewport._x);
            gl.uniform1f(y, Crafty.viewport._y);

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
            var shaderProgram = Crafty.webgl._shaderProgram;
            
            


            for (; i < l; i++) {
                current = q[i];
                if (current._visible && current.__c.WebGL) {
                    //console.log("rendering a thing #" + current[0])
                    
                    shaderProgram = current._shaderProgram;
                    gl.useProgram(shaderProgram);
                    Crafty.webgl.setViewportUniforms(shaderProgram);
                    current.draw();
                    current._changed = false;
                }
            }
        }

        

    }
});

