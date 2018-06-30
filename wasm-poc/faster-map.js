// Maintain a list of js functions that will be called into by the rust module
var callback_stack = [];
function register_callback(cb) {
    return callback_stack.push(cb) - 1;
}
function remove_callback() {
    callback_stack.pop();
}

// The callback invocation wrapper and a couple of simple logging hooks
function generate_imports_for_rust(Crafty) {

    

    return {
        env: {
            invoke_traversal_callback: function invoke_traversal_callback(
                callback_id,
                entity_id,
                set_number
            ) {
                var e = Crafty(entity_id);
                return !!callback_stack[callback_id](e, set_number);
            },

            // It's *possible* to log strings from rust, but...
            // it's much easier to log types that can be passed directly
            logInt: function(number) {
                console.log('Logged rust i32: ', number);
            },
            logFloat: function(number) {
                console.log("Logged rust f32: ", number);
            }
        }
    };
}

function loadMapModule(Crafty) {
    // Load the wasm blob, create a js wrapper for it, and assign to crafty
    return fetchAndInstantiate("./rust-module/target/wasm32-unknown-unknown/release/wasm_test.wasm", generate_imports_for_rust(Crafty))
        .then(mod =>  makeMapModule(mod.exports, Crafty))
        .then(map => {
            Crafty.map = map;
            return Crafty;
        });
};

// This creates an object that fufills the existing contract of Crafty.map, but calls through to the wasm module
// TODO: might be missing some method signatures (i.e. optional arguments)
function makeMapModule(exports, Crafty)  {
    // Tell the wasm module to create a map object, and store a reference to it
    // In rust terms, we now own the map, so TODO we should allow the js code to release it when done
    var $map = exports.new_map();

    // Get a reference to the result buffer, which we'll use to write lists of results
    // For this POC we set the maximum number of entitites at 2000
    var BUFFER_SIZE = 2000;
    var $buffer_ptr = exports.get_result_buffer(BUFFER_SIZE);

    // Sadly, the buffer view (along with the underlying buffer) becomes 'detached' when wasm memory resizes
    // So define a helper function that hands you an up-to-date buffer view, reusing the existing one if attached
    var $buffer_view = new Int32Array(exports.memory.buffer, $buffer_ptr, BUFFER_SIZE);
    function get_buffer_view() {
        if ($buffer_view.byteLength === 0) {
            $buffer_view = new Int32Array(exports.memory.buffer, $buffer_ptr, BUFFER_SIZE);
        }
        return $buffer_view;
    }

    // methods exported by the wasm module
    var update_map_raw =  exports.update_map;
    var check_cell_raw = exports.check_cell;
    var search_raw = exports.search;
    var unfiltered_search_raw = exports.unfiltered_search;
    var remove_raw = exports.remove_from_map;
    var traverse_ray_raw = exports.traverse_ray;

    var mapModule = {};
    mapModule.check_cell = function(id, i, j) {
        return check_cell_raw($map, id, i, j);
    }

    mapModule.search = function(rect, results) {
        var l = search_raw($map, $buffer_ptr, +rect._x, +rect._y, +rect._w, +rect._h);
        results = results || [];
        var $buffer = get_buffer_view();
        for (var i =0; i < l; i++) {
            results.push(Crafty($buffer[i]));
        }
        return results;
    };

    mapModule.unfilteredSearch = function(rect, results) {
        var l = unfiltered_search_raw($map, $buffer_ptr, +rect._x, +rect._y, +rect._w, +rect._h);
        var $buffer = get_buffer_view();
        results = results || [];
        for (var i =0; i < l; i++) {
            results.push(Crafty($buffer[i]));
        }
        return results;
    };

    // For the underlying implementation, update and insert are the same
    mapModule.updateEntry = mapModule.insert = function (obj, id) {
        update_map_raw($map, id|0, +obj._x, +obj._y, +obj._w, +obj._h);
    };

    mapModule.remove = function (id) {
        remove_raw($map, id);
    };

    // TODO probably needs to handle missing arguments on both this and the rust side
    mapModule.traverseRay = function(origin, direction, callback, maxDistance) {
        var callback_id = register_callback(callback);
        traverse_ray_raw($map, callback_id|0, origin._x, origin._y, direction.x, direction.y, maxDistance);
        remove_callback();
    };

    // Just hardcode this for now
    var staticBounds =  {
        min: {
            x: 0,
            y: 0
        },
        max: {
            x: 1200,
            y: 1200
        }
    };
 
    mapModule.boundaries = function() {
        return staticBounds;
    }

    return mapModule;
}


