/*
 Template Name: Admiria - Bootstrap 4 Admin Dashboard
 Author: Themesbrand
 File: Main js
 */

!(function ($) {
  "use strict";

  var MainApp = function () {
    (this.$body = $("body")),
    (this.$wrapper = $("#wrapper")),
    (this.$btnFullScreen = $("#btn-fullscreen")),
    (this.$leftMenuButton = $(".button-menu-mobile")),
    (this.$menuItem = $(".has_sub > a")),
    (this.$sidebarToggle = $("#sidebar-toggle"));
  };
  //scroll
  (MainApp.prototype.initSlimscroll = function () {
    $(".slimscrollleft").slimscroll({
      height: "auto",
      position: "right",
      size: "10px",
      color: "#9ea5ab",
    });
  }),
  //left menu
  (MainApp.prototype.initLeftMenuCollapse = function () {
    var $this = this;
    this.$leftMenuButton.on("click", function (event) {
      event.preventDefault();
      $this.$body.toggleClass("fixed-left-void");
      $this.$wrapper.toggleClass("enlarged");
    });
  }),
  //sidebar toggle
  (MainApp.prototype.initSidebarToggle = function () {
    var $this = this;
    var $toggleIcon = $("#sidebar-toggle-icon");

    function updateToggleIcon(isCollapsed) {
      if (isCollapsed) {
        $toggleIcon.removeClass("mdi-chevron-left").addClass("mdi-chevron-right");
      } else {
        $toggleIcon.removeClass("mdi-chevron-right").addClass("mdi-chevron-left");
      }
    }

    this.$sidebarToggle.on("click", function (event) {
      event.preventDefault();
      $this.$wrapper.toggleClass("sidebar-collapsed");
      // Save state to localStorage
      var isCollapsed = $this.$wrapper.hasClass("sidebar-collapsed");
      localStorage.setItem("sidebarCollapsed", isCollapsed);
      updateToggleIcon(isCollapsed);
    });
    // Restore state from localStorage on page load
    var savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") {
      $this.$wrapper.addClass("sidebar-collapsed");
      updateToggleIcon(true);
    }
  }),
  //left menu
  (MainApp.prototype.initComponents = function () {
    $("[data-toggle=\"tooltip\"]").tooltip();
    $("[data-toggle=\"popover\"]").popover();
  }),
  //sidebar collapse toggle
  (MainApp.prototype.initFullScreen = function () {
    // Empty - using global toggleSidebar function instead
  }),
  //full screen
  (MainApp.prototype.initMenu = function () {
    var $this = this;
    $this.$menuItem.on("click", function () {
      var parent = $(this).parent();
      var sub = parent.find("> ul");

      if (!$this.$body.hasClass("sidebar-collapsed")) {
        if (sub.is(":visible")) {
          sub.slideUp(300, function () {
            parent.removeClass("nav-active");
            $(".body-content").css({ height: "" });
            adjustMainContentHeight();
          });
        } else {
          visibleSubMenuClose();
          parent.addClass("nav-active");
          sub.slideDown(300, function () {
            adjustMainContentHeight();
          });
        }
      }
      return false;
    });

    //inner functions
    function visibleSubMenuClose() {
      $(".has_sub").each(function () {
        var t = $(this);
        if (t.hasClass("nav-active")) {
          t.find("> ul").slideUp(300, function () {
            t.removeClass("nav-active");
          });
        }
      });
    }

    function adjustMainContentHeight() {
      // Adjust main content height
      var docHeight = $(document).height();
      if (docHeight > $(".body-content").height()) {
        $(".body-content").height(docHeight);
      }
    }
  }),
  (MainApp.prototype.activateMenuItem = function () {
    // === following js will activate the menu in left side bar based on url ====
    $("#sidebar-menu a").each(function () {
      var pageUrl = window.location.href.split(/[?#]/)[0];
      if (this.href == pageUrl) {
        $(this).addClass("active");
        $(this).parent().addClass("active"); // add active to li of the current link
        $(this).parent().parent().prev().addClass("active"); // add active class to an anchor
        $(this).parent().parent().parent().addClass("active"); // add active class to an anchor
        $(this).parent().parent().prev().click(); // click the item to make it drop
      }
    });
  }),
  (MainApp.prototype.Preloader = function () {
    $(window).on("load", function () {
      $("#status").fadeOut();
      $("#preloader").delay(350).fadeOut("slow");
      $("body").delay(350).css({
        overflow: "visible",
      });
    });
  }),
  (MainApp.prototype.ToggleSearch = function () {
    $(".toggle-search").on("click", function () {
      var targetId = $(this).data("target");
      var $searchBar;
      if (targetId) {
        $searchBar = $(targetId);
        $searchBar.toggleClass("open");
      }
    });
  }),
  (MainApp.prototype.init = function () {
    this.initSlimscroll();
    this.initLeftMenuCollapse();
    this.initSidebarToggle();
    this.initComponents();
    this.initFullScreen();
    this.initMenu();
    this.activateMenuItem();
    this.Preloader();
    this.ToggleSearch();
  }),
  //init
  ($.MainApp = new MainApp()),
  ($.MainApp.Constructor = MainApp);
})(window.jQuery),
//initializing
(function ($) {
  "use strict";
  $.MainApp.init();
})(window.jQuery);

// Global function for sidebar toggle
function toggleSidebar(e) {
  e.preventDefault();
  var $wrapper = $("#wrapper");
  var $body = $("body");
  $body.toggleClass("fixed-left-void");
  $wrapper.toggleClass("enlarged");
}
