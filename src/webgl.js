var Crafty = require('./core.js'),
    document = window.document;

// test fragment shader -- everything is white!
var FRAGMENT_SHADER_SRC = 
  "precision mediump float;"

  +"void main(void) {"
  +"gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);"
  +"}";

// test vertex shader
var VERTEX_SHADER_SRC_OLD = 
  "attribute vec2 aVertexPosition;"
  + "uniform mat2 uGlobalScaleMatrix;"
  + "void main(void) {"
  + " gl_Position = vec4(aVertexPosition, 0, 1);"
  + "}";

var VERTEX_SHADER_SRC = 
"attribute vec2 a_position;\r\nuniform float uViewportWidth;\r\nuniform float uViewportHeight;\r\nuniform float uViewportX;\r\nuniform float uViewportY;\r\n\r\nuniform float uEntityWidth;\r\nuniform float uEntityHeight;\r\nuniform float uEntityX;\r\nuniform float uEntityY;\r\n\r\nuniform float uOriginX;\r\nuniform float uOriginY;\r\nuniform float uEntityRotation;\r\n\r\n\r\nmat4 viewportScale = mat4(2.0 \/ uViewportWidth,0,0,0, 0,-2.0 \/ uViewportHeight, 0,0, 0,0,1,0, -1, +1.0,0,1);\r\nvec4 viewportTranslation = vec4(uViewportX, uViewportY, 0, 0);\r\n\r\nmat2 entityScale = mat2( uEntityWidth, 0, 0, uEntityHeight);\r\nvec2 entityTranslation = vec2(uEntityX, uEntityY);\r\nvec2 entityOrigin = vec2(uOriginX, uOriginY);\r\nmat2 entityRotationMatrix = mat2(cos(uEntityRotation), sin(uEntityRotation), -sin(uEntityRotation), cos(uEntityRotation));\r\n\r\nvoid main() {\r\n  vec2 pos = entityScale * a_position;\r\n  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin + entityTranslation;\r\n  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 0, 1) );\r\n}"




// This will totally assume, for now, that gl-matrix is available
Crafty.c("WebGL", {

    init: function () {
        if (!Crafty.webgl.context) {
            Crafty.webgl.init();
        }

        gl = Crafty.webgl.context;

        //increment the amount of canvas objs
        Crafty.webgl.entities++;
        
        this._changed = true;
        Crafty.webgl.add(this);


        this._vertexBuffer = gl.createBuffer();


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
        this._calculateVertices()


        //console.log("Vertices calculated")


        // Set rotation around origin
        if (this._rotation !== 0) {
            
        }

        // Handle flipX, flipY
        if (this._flipX || this._flipY) {
           
        }


        //set alpha
        if (this._alpha < 1.0) {
           
        }

        //Draw entity

        //Just draw a white square for now!

        //Set the mvMatrix to just be the identity!  No viewport translations yet.
        // TODO switch to explicitly 2D representation?
 
        var shaderProgram = Crafty.webgl._shaderProgram;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this._vertexBuffer.itemSize, gl.FLOAT, false, 0, 0) 


        // Set all the crazy uniform variables for the entity

        

        var w = gl.getUniformLocation(shaderProgram, "uEntityWidth");
        var h = gl.getUniformLocation(shaderProgram, "uEntityHeight");
        var x = gl.getUniformLocation(shaderProgram, "uEntityX");
        var y = gl.getUniformLocation(shaderProgram, "uEntityY");
        gl.uniform1f(w, pos._w);
        gl.uniform1f(h, pos._h);
        gl.uniform1f(x, pos._x);
        gl.uniform1f(y, pos._y);

        x = gl.getUniformLocation(shaderProgram, "uOriginX");
        y = gl.getUniformLocation(shaderProgram, "uOriginY");
        var rot = gl.getUniformLocation(shaderProgram, "uEntityRotation");

        gl.uniform1f(x, this._origin.x);
        gl.uniform1f(y, this._origin.y);
        gl.uniform1f(rot, this._rotation);


        //console.log("About to draw arrays")
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._vertexBuffer.numItems);

        //this.drawVars.ctx = context;
        //this.trigger("Draw", this.drawVars);

        //console.log("Draw complete?")
        
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

            var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragment_shader, FRAGMENT_SHADER_SRC);
            gl.compileShader(fragment_shader);
            if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
              alert(gl.getShaderInfoLog(fragment_shader));
              return;
            };
            this._fragment_shader = fragment_shader;

            var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertex_shader, VERTEX_SHADER_SRC);
            gl.compileShader(vertex_shader);
            if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
              alert(gl.getShaderInfoLog(vertex_shader));
            };
            this._vertex_shader = vertex_shader;

            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertex_shader);
            gl.attachShader(shaderProgram, fragment_shader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
              alert("Could not initialise shaders");
            }
            this._shaderProgram = shaderProgram;



            gl.useProgram(shaderProgram);

            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "a_position");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
            //shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            //shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

            //
            // End temp program!

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
            
            

      

            //Bind rendering of canvas context (see drawing.js)
            Crafty.uniqueBind("RenderScene", Crafty.webgl.render);

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
            var w = gl.getUniformLocation(shaderProgram, "uViewportWidth");
            var h = gl.getUniformLocation(shaderProgram, "uViewportHeight");
            var x = gl.getUniformLocation(shaderProgram, "uViewportX");
            var y = gl.getUniformLocation(shaderProgram, "uViewportY");
            gl.uniform1f(w, Crafty.viewport.width);
            gl.uniform1f(h, Crafty.viewport.height);
            gl.uniform1f(x, Crafty.viewport._x);
            gl.uniform1f(y, Crafty.viewport._y);



            for (; i < l; i++) {
                current = q[i];
                if (current._visible && current.__c.WebGL) {
                    //console.log("rendering a thing #" + current[0])
                    current.draw();
                    current._changed = false;
                }
            }
        }

        

    }
});

