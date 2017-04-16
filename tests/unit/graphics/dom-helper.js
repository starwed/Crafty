(function() {
  var module = QUnit.module;
  var test = QUnit.test;

  module("dom-helper", {
    beforeEach: function() {
      var div = document.createElement("div");
      div.style.position = "absolute";
      div.style.top = "10000px";
      div.textContent = "test";
      div.id = "test";
      document.body.appendChild(div);

      Crafty.stage.x = 10;
      Crafty.stage.y = 10;
      Crafty.viewport.scale();
      Crafty.viewport.x = 0;
      Crafty.viewport.y = 0;

      if (document.documentElement) {
        document.documentElement.scrollTop = 100;
      }
      // 2nd condition is workaround for limitation while testing on headless browser (phantomjs)
      if (
        !document.documentElement || document.documentElement.scrollTop !== 100
      ) {
        document.body.scrollTop = 100;
      }
    },

    afterEach: function() {
      resetStage();
    }
  });

  test("translate coordinates", function(_) {
    _.strictEqual(
      Crafty.domHelper.translate(10, 10).x,
      0,
      "translates x from 10 to 0"
    );
    _.strictEqual(
      Crafty.domHelper.translate(10, 10).y,
      100,
      "translates y from 10 to 100"
    );
  });
})();
