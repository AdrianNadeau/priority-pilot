/*
 Template Name: Admiria - Bootstrap 4 Admin Dashboard
 Author: Themesbrand
 File: Animation demo js
 */

function testAnim(x) {
  $("#animationSandbox")
    .removeClass()
    .addClass(x + " animated")
    .one(
      "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",
      function () {
        $(this).removeClass();
      },
    );
}

$(document).ready(function () {
  $(".js--triggerAnimation").click(function (e) {
    e.preventDefault();
    var anim = $(".js--animations").val();
    testAnim(anim);
  });

  $(".js--animations").change(function () {
    var anim = $(this).val();
    testAnim(anim);
  });
});
