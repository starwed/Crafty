// Define common features available in both browser and node
module.exports = function(requireNew) {
  if (requireNew) {
    require = requireNew; // jshint ignore:line
  }

  var Crafty = require("./core/core");

  Crafty.easing = require("./core/animation");
  Crafty.extend(require("./core/extensions"));
  Crafty.c("Model", require("./core/model"));
  Crafty.extend(require("./core/scenes"));
  Crafty.storage = require("./core/storage");
  Crafty.c("Delay", require("./core/time"));
  Crafty.c("Tween", require("./core/tween"));

  require("./core/systems");

  require("./spatial/2d");
  require("./spatial/motion");
  require("./spatial/platform");
  require("./spatial/collision");
  require("./spatial/spatial-grid");
  require("./spatial/rect-manager");
  require("./spatial/math");

  require("./controls/controls-system");
  require("./controls/controls");
  require("./controls/keycodes");

  require("./debug/logging");

  return Crafty;
};
