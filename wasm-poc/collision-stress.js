function startScene(n, m) {
    Crafty.stage.fullscreen = true
    Crafty.viewport.clampToEntities = false;
    //Crafty.timer.steptype("variable");

    var SIZE = 15;
    var MAX_X = n * SIZE * 1.5;
    var MAX_Y = m * SIZE * 1.5;

    var results_holder = [];
    
    // Define the collider component
    Crafty.c("Collider", {
        init: function () {
            var angle = 2 * Math.PI * Math.random();
            var speed = 50;
            this.color('red');
            this.vx = speed * Math.cos(angle);
            this.vy = speed * Math.sin(angle);
            this.w = SIZE;
            this.h = SIZE;
        },
        required: "2D, WebGL, Color, Motion",
        events: {
            "EnterFrame": function updateColliders() {
                results_holder.length = 0;
                var results = Crafty.map.search(this, results_holder);
                if (results.length > 1) {
                    this.vx = -this.vx;
                    this.vy = -this.vy;
                } else {
                    if (this._x > MAX_X || this._x < 0) {
                        this.vx = -this.vx;
                    }
                    if (this._y > MAX_Y || this._y < 0) {
                        this.vy = -this.vy;
                    }
                }
            }
        }
    });

    // place n*m colliders
    var position_factor = SIZE * 1.4;
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < m; j++) {
            Crafty.e("Collider").attr({
                x: i * position_factor,
                y: j * position_factor
            });
        }
    }

    // Measure the FPS of the scene
    var timings = [];
    var lastTime = undefined;
    var fps_text = Crafty.e("2D, DOM, Text")
        .attr({ x: 1000, y: 0, w: 200, h: 50 })
        .textColor("black")
        .textFont({ size: '20px' })
        .text('???');

    function updateTimings() {
        var currentTime = performance.now();
        if (lastTime) {
            timings.push(currentTime - lastTime);
            // 
            if (timings.length > 10) {
                timings.shift();
            }
            var averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
            fps_text.text((1000 / averageTime).toFixed(1));
        }
        lastTime = currentTime;
    }

    Crafty.bind("PreRender", updateTimings);
}

function go() {
    var n = document.getElementById('n').value;
    var m = document.getElementById('m').value;
    var use_wasm = document.getElementById('wasm').checked;

    document.body.innerHTML = "";
    var crafty_modules = [];

    if (use_wasm) {
        crafty_modules.push(loadMapModule);
    }

    Crafty
        .initAsync(crafty_modules)
        .then(() => startScene(n, m));
}