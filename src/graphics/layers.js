var Crafty = require('../core/core.js');

Crafty.extend({
    _drawLayerTemplates: {},
    
    _registerLayerTemplate: function(type, layerTemplate) {
        this._drawLayerTemplates[type] = layerTemplate;
    },
    
    /**@
     * #Crafty.createLayer
     * @category Graphics
     *
     * @sign public void Crafty.createLayer(string name, string type[, object options])
     * @param name - the name that will refer to the layer
     * @param type - the type of the draw layer to create ('DOM', 'Canvas', or 'WebGL')
     * @param options - this will override the default values of each layer
     * 
     * Creates a new instance of the specified type of layer.  The options (and their default values) are
     * 
     * ```
     * {
     *   xResponse: 1,  // How the layer will pan in response to the viewport x position
     *   yResponse: 1,  // How the layer will pan in response to the viewport y position
     *   scaleResponse: 1, // How the layer will scale in response to the viewport scale.  (Layer scale will be scale^scaleResponse.)
     *   z: 0 // The zIndex of the layer relative to other layers
     * }
     * ```
     * 
     * Crafty will automatically define three built-in layers: "DefaultDOMLayer", DefaultCanvasLayer",  and "DefaultWebGLLayer".
     * They will have `z` values of `30`, `20`, and `10` respectively, and will be initialized if a "DOM", "Canvas" or "WebGL" component
     * is added to an element not attached to any user-specified layer.
     * 
     * @example
     * ```
     * Crafty.s("MyCanvasLayer", "Canvas")
     * Crafty.e("2D, MyCanvasLayer, Color");
     * ```
     * Define a custom canvas layer, then create an entity that uses the custom layer to render.
     * 
     * * @example
     * ```
     * Crafty.s("UILayer", "DOM", {scaleResponse: 0, xResponse: 0, yResponse: 0})
     * Crafty.e("2D, UILayer, Text");
     * ```
     * Define a custom DOM layer that will not move with the camera.  (Useful for static UI elements!)
     */
    createLayer: function createLayer(name, type, options) {
        var layerTemplate = this._drawLayerTemplates[type];
        Crafty.s(name, layerTemplate, options);
        Crafty.c(name, {
            init: function() {
                this.requires("Renderable");
                
                // Flag to indicate that the base component doesn't need to attach a layer
                this._customLayer = true;
                this.requires(layerTemplate.type);
                this._attachToLayer(Crafty.s(name));
            },
            
            remove: function() {
                this._detachFromLayer();
            }
        });
    }
});