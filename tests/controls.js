(function() {
  var module = QUnit.module;
  var keysUp = global.keysUp;
  var keysDown = global.keysDown;
  module("Controls");
  
  test("Multiway and Fourway", function() {
    var e = Crafty.e("2D, Fourway")
                  .attr({ x: 0, y: 0});

    
    e.multiway(50, { W: -90 });
    keysDown(Crafty.keys.W);
    Crafty.timer.simulateFrames(1);
    equal(e._vy, -50, "Speed is 50 in -y direction");
    equal(e._vx, 0, "Speed is 0 in x direction");

    // Change the key's direction and speed while it's held down
    e.attr({x:0, y:0});
    e.multiway(100, { W: 90 });
    Crafty.timer.simulateFrames(1, 20);
    equal(e._vy, 100, "Speed is 100 in +y direction");
    equal(e._vx, 0, "Speed is 0 in x direction");

    // Change the speed with fourway, (W is negative for fourway)
    e.attr({x:0, y:0});
    e.fourway(50);
    Crafty.timer.simulateFrames(1, 20);
    equal(e._vy, -50, "Speed is 50 in -y direction");
    equal(e._vx, 0, "Speed is 0 in x direction");

    // Test two keys down at the same time
    keysDown(Crafty.keys.UP_ARROW);
    Crafty.timer.simulateFrames(1);
    equal(e._vy, -50, "Still speed 50 in -y direction after up arrow");

    keysUp('W');
    equal(e._vy, -50, "Still speed 50 in -y direction after W is released");
    e.isDown = function(key) {
        return false;
    };
   keysUp(Crafty.keys.UP_ARROW);
   Crafty.timer.simulateFrames(1);
    equal(e._vy, 0, "Speed is 0 once both keys are released");

    // Diagonal
    keysDown(Crafty.keys.DOWN_ARROW, Crafty.keys.LEFT_ARROW);
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 50, "Speed is 50 in +y direction when DOWN & LEFT are pressed");
    equal(e._vx, -50, "Speed is 50 in -x direction when DOWN & LEFT are pressed");

    keysUp(Crafty.keys.DOWN_ARROW);
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 0, "Speed is 0 in y direction after DOWN is released");
    equal(e._vx, -50, "Speed is still 50 in -x direction");

    e.removeComponent("Multiway");
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 0, "Speed set to 0 when component removed");
    equal(e._vx, 0, "Speed set to 0 when component removed");

    keysUp(Crafty.keys.LEFT_ARROW);
    Crafty.timer.simulateFrames(1);
    equal(e._vy, 0, "No change when key released after component removed");
    equal(e._vx, 0, "No change when key released after component is removed");

    Crafty.resetKeyDown(); 

    e.destroy();
  });

  test("disableControl and enableControl and speed", function() {
    var e = Crafty.e("2D, Twoway")
      .attr({ x: 0 })
      .twoway();

    equal(e._vx, 0, "vx starts equal to 0");

    e.enableControl();
    e.speed({ x: 50, y: 50 });
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0, "No change in speed after Twoway speed is set");

    e.disableControl();
    keysDown(Crafty.keys.D);    
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0, "vx = 0 when key D pressed while control is disabled");

    e.enableControl();
    Crafty.timer.simulateFrames(1);    
    equal(e._vx, 50, "vx = 50 once control is enabled while D key is down");

    e.disableControl();
    keysUp(Crafty.keys.D);
    Crafty.timer.simulateFrames(1); 
    equal(e._vx, 50, "vx = 50 when key is released while control disabled"); // TODO is this what we want?

    e._vx = 17;
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 17, "vx = 17 after being explicitly set while control disabled"); // TODO is this what we want?

    e.enableControl();
    Crafty.timer.simulateFrames(1);
    equal(e._vx, 0, "vx = 0 once control is enabled and no key is held");

    // keysUp(Crafty.keys.D);
    // Crafty.timer.simulateFrames(1);

    // equal(e._vx, 0, "vx = 0 when key is released while control is disabled");

    // e.disableControl();
    // equal(e._vx, 0, "vx = 0 if control disabled a second time");

    // e.enableControl();
    // equal(e._vx, 0, "vx = 0 once control re-enabled");

    // keysDown(Crafty.keys.D);
    // equal(e._vx, 50, "vx = 50 once D key pressed again");

    // keysUp(Crafty.keys.D);
    // equal(e._vx, 0, "vx = 0 once key released");


    // keysDown(Crafty.keys.D, Crafty.keys.RIGHT_ARROW);
    
    // equal(e._vx, 50, "vx = 50 when both RIGHT and D pressed");

    // e.disableControl();
    // e.speed({ x: 100, y: 100 });
    // equal(e._vx, 0, "vx = 0 when control disabled and speed set");

    // e.enableControl();
    // equal(e._vx, 100, "vx = 100 when control re-enabled while keys are still held down");

    // e.speed({ x: 150, y: 150 });
    // equal(e._vx, 150, "vx = 150 when speed updated");

    // Crafty.trigger('KeyUp', {
    //   key: Crafty.keys.D
    // });
    // equal(e._vx, 150, "vx = 150 when D is released but RIGHT is still down");

    // Crafty.trigger('KeyUp', {
    //   key: Crafty.keys.RIGHT_ARROW
    // });
    // equal(e._vx, 0, "vx = 0 once both keys are released");

    e.destroy();
  });

})();