//	Cross-Browser Mousewheel Support:

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
* Licensed under the MIT License (LICENSE.txt).
*
* Version: 3.0.6
*
* Requires: 1.2.2+
*/

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail ) { delta = -orgEvent.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);



/************************************************************************************
*                                                                                   *
*    ### Begin Scrolling Menu ### (last chance to turn around and go back, haha)    *
*                                                                                   *
************************************************************************************/

//	Really Ugly State Variables... Need to Clean Up!!!
	var scrollButtonFadeTimer = 0, scrollState = false, scrollBuffer = false, scrollBufferDelta = 0, scrollHoverState, loadmenu;
//	Scrolling Menu Widget
	$.widget("custom.scrollmenu", $.ui.menu, {
	
	//	### Begin modification to inherited widget functions ###
		options: {
			icons: {
				submenu: "ui-icon-carat-1-e"
			},
			menus: "ul",
			position: {
				my: "left top",
				at: "right top"
			},
			role: "menu",
			
			// Scrolling Menu Options
			maxItemsShown: 5,
			maxItemsShownExtra: 0,    // this could be removed and simply use maxItemsShown numbers such as 5.5 or 5.75 so on...
			scrollButton: {
				effect: "drop",
				optionsButtonTop: {
					direction: "down"
				},
				optionsButtonBottom: {
					direction: "up"
				},
				duration: 400
			},
			menuDepthPosition: {	// this is so that every depthInterval(n'th) menu we switch positioning type, either the default or alt.
				depthInterval: 3,	// !set this to 0 to disable position switching on menu depth!
				altPosition: {
					my: "right top",
					at: "left top"
				}
			},
			
			// Ajax Options
			unloadedClass: "unloaded",
			
			blur: null,
			focus: null,
			select: null
		},
		_create: function () {
			var e = this;
			this.activeMenu = this.element;
			this.mouseHandled = false;
			this.element.uniqueId()
				.addClass("ui-menu ui-widget ui-widget-content ui-corner-all")
				.toggleClass("ui-menu-icons", !! this.element.find(".ui-icon")
				.length)
				.attr({
				role: this.options.role,
				tabIndex: 0
			})
				.bind("click" + this.eventNamespace, $.proxy(function (e) {
				if(this.options.disabled) {
					e.preventDefault();
				}
			}, this))
				.append($("<div>")
				.attr("class", "ui-menu-scroll-container")
				.data("scrollposition", "top")
				.bind("mousewheel", function (t, n, r, i) {
					if(!scrollState) {
						return e.onScroll(this, n, 150);
					} else if(!scrollBuffer) {
						scrollBuffer = true;
						scrollBufferDelta = n;
						return false;
					} else {
						scrollBufferDelta = n;
						return false;
					}
				})
				.append(this.element.children()))
				.prepend($("<div>")
				.attr("class", "ui-menu-scroll-button up")
				.append($("<button>")
						.attr("class", "scroll-up")
						.button({
							icons: {
								primary: "ui-icon-triangle-1-n"
							},
							text: false
						})
						.hide()
						.hover(function () {
							return e.scrollButtonHover(this, 1, "on");
						}, function () {
							return e.scrollButtonHover(this, 1, "off");
						})
						.click(function () {
							scrollHoverState = false;
							return e.scrollButtonHover(this, 1, "on");
						})
					)
				)
				.append($("<div>")
					.attr("class", "ui-menu-scroll-button down")
					.append($("<button>")
						.attr("class", "scroll-down")
						.button({
							icons: {
								primary: "ui-icon-triangle-1-s"
							},
							text: false
						})
						.hide()
						.hover(function () {
							return e.scrollButtonHover(this, -1, "on");
						}, function () {
							return e.scrollButtonHover(this, -1, "off");
						})
						.click(function () {
							scrollHoverState = false;
							return e.scrollButtonHover(this, -1, "on");
						})
					)
				)
				.mouseenter(function () {
					return e.toggleScrollButtons(this, "on");
				})
				.mouseleave(function () {
					return e.toggleScrollButtons(this, "off");
				})
				.mousemove(function () {
				if(scrollButtonFadeTimer !== 0) {
					clearTimeout(scrollButtonFadeTimer);
					scrollButtonFadeTimer = 0;
				}
				var t = $(this)
					.children(".ui-menu-scroll-button")
					.children(".scroll-up");
				var n = $(this)
					.children(".ui-menu-scroll-button")
					.children(".scroll-down");
				if(t.css("display") === "none" || n.css("display") === "none") {
					e.toggleScrollButtons(this, "on");
				}
				return false;
			});
			if(this.options.disabled) {
				this.element.addClass("ui-state-disabled")
					.attr("aria-disabled", "true");
			}
			this._on({
				// Prevent focus from sticking to links inside menu after clicking
				// them (focus should always stay on UL during navigation).
				"mousedown .ui-menu-item > a": function( event ) {
					event.preventDefault();
				},
				"click .ui-state-disabled > a": function( event ) {
					event.preventDefault();
				},
				"click .ui-menu-item:has(a)": function( event ) {
					var target = $( event.target ).closest( ".ui-menu-item" );
					if ( !this.mouseHandled && target.not( ".ui-state-disabled" ).length ) {
						this.mouseHandled = true;
	
						this.select( event );
						// Open submenu on click
						if ( target.has( ".ui-menu" ).length ) {
							this.expand( event );
						} else if ( !this.element.is( ":focus" ) ) {
							// Redirect focus to the menu
							this.element.trigger( "focus", [ true ] );
	
							// If the active item is on the top level, let it stay active.
							// Otherwise, blur the active item since it is no longer visible.
							if ( this.active && this.active.parents( ".ui-menu" ).length === 1 ) {
								clearTimeout( this.timer );
							}
						}
					}
				},
				"mouseenter .ui-menu-item": function( event ) {
					var target = $( event.currentTarget );
					// Remove ui-state-active class from siblings of the newly focused menu item
					// to avoid a jump caused by adjacent elements both having a class with a border
					target.siblings().children( ".ui-state-active" ).removeClass( "ui-state-active" );
					this.focus( event, target );
				},
				mouseleave: "collapseAll",
				"mouseleave .ui-menu": "collapseAll",
				focus: function( event, keepActiveItem ) {
					// If there's already an active item, keep it active
					// If not, activate the first item
					var item = this.active || this.element.children( ".ui-menu-item" ).eq( 0 );
	
					if ( !keepActiveItem ) {
						this.focus( event, item );
					}
				},
				blur: function( event ) {
					this._delay(function() {
						if ( !$.contains( this.element[0], this.document[0].activeElement ) ) {
							this.collapseAll( event );
						}
					});
				},
				keydown: "_keydown"
			});
			this.refresh();
			this._on(this.document, {
				click: function (e) {
					if(!$(e.target)
						.closest(".ui-menu")
						.length) {
						this.collapseAll(e);
					}
					this.mouseHandled = false;
				}
			});
			this.element.css("position","relative")
				.show();
				var cssstyle = ".ui-menu-scroll-container {max-height:"+((this.element.children(".ui-menu-scroll-container")
				.children("li")
				.height() * this.options.maxItemsShown) + (this.element.children(".ui-menu-scroll-container")
				.children("li")
				.height() * this.options.maxItemsShownExtra)) + "px"+"}";
				$("<style>").attr("type","text/css").html(cssstyle).appendTo("head");
		},
		
		_destroy: function() {
			// Destroy scroll buttons
			this.element
				.find(".ui-menu-scroll-button")
				.remove();
				
			// Destroy (sub)menus
			this.element
				.removeAttr( "aria-activedescendant" )
				.find( ".ui-menu" )
					.removeAttr("style")
					.addBack()
					.removeClass( "ui-menu ui-widget ui-widget-content ui-corner-all ui-menu-icons" )
					.removeAttr( "role" )
					.removeAttr( "tabIndex" )
					.removeAttr( "aria-labelledby" )
					.removeAttr( "aria-expanded" )
					.removeAttr( "aria-hidden" )
					.removeAttr( "aria-disabled" )
					.removeUniqueId()
					.show();

	
			// Destroy menu items
			this.element.find( ".ui-menu-item" )
				.removeClass( "ui-menu-item ui-state-disabled" )
				.removeAttr( "role" )
				.removeAttr( "aria-disabled" )
				.removeAttr("style")
				.unwrap()
				.children( "a" )
					.removeUniqueId()
					.removeClass( "ui-corner-all ui-state-hover ui-state-focus ui-state-active" )
					.removeAttr( "tabIndex" )
					.removeAttr( "role" )
					.removeAttr( "aria-haspopup" )
					.children().each( function() {
						var elem = $( this );
						if ( elem.data( "ui-menu-submenu-carat" ) ) {
							elem.remove();
						}
					});
	
			// Destroy menu dividers
			this.element.find( ".ui-menu-divider" ).removeClass( "ui-menu-divider ui-widget-content" );
		},

		refresh: function (callback) {
			var t, n = this,
				r = this.options.icons.submenu,
				i = this.element.find(this.options.menus);
			i.filter(":not(.ui-menu)")
				.addClass("ui-menu ui-widget ui-widget-content ui-corner-all")
				.hide()
				.attr({
				role: this.options.role,
				"aria-hidden": "true",
				"aria-expanded": "false"
			}).each(function () {
				var e = $(this),
					t = e.prev("a"),
					i = $("<span>")
						.addClass("ui-menu-icon ui-icon " + r)
						.data("ui-menu-submenu-carat", true);
				t.children("span")
					.remove();
				t.removeClass(n.options.unloadedClass)
					.attr("aria-haspopup", "true")
					.prepend(i);
				e.attr("aria-labelledby", t.attr("id"));
				e.append($("<div>")
					.attr("class", "ui-menu-scroll-container")
					.data("scrollposition", "top")
					.bind("mousewheel", function (e, t, r, i) {
					if(!scrollState) {
						return n.onScroll(this, t, 150);
					} else if(!scrollBuffer) {
						scrollBuffer = true;
						scrollBufferDelta = t;
						return false;
					} else {
						scrollBufferDelta = t;
						return false;
					}
				})
					.append(e.children()))
					.prepend($("<div>")
					.attr("class", "ui-menu-scroll-button up")
					.append($("<button>")
					.attr("class", "scroll-up")
					.button({
					icons: {
						primary: "ui-icon-triangle-1-n"
					},
					text: false
				})
					.hide()
					.hover(function () {
					return n.scrollButtonHover(this, 1, "on");
				}, function () {
					return n.scrollButtonHover(this, 1, "off");
				})
					.click(function () {
					scrollHoverState = false;
					return n.scrollButtonHover(this, 1, "on");
				})
				))
					.append($("<div>")
					.attr("class", "ui-menu-scroll-button down")
					.append($("<button>")
					.attr("class", "scroll-down")
					.button({
					icons: {
						primary: "ui-icon-triangle-1-s"
					},
					text: false
				})
					.hide()
					.hover(function () {
					return n.scrollButtonHover(this, -1, "on");
				}, function () {
					return n.scrollButtonHover(this, -1, "off");
				})
					.click(function () {
					scrollHoverState = false;
					return n.scrollButtonHover(this, -1, "on");
				})
				))
					.mouseenter(function () {
					return n.toggleScrollButtons(this, "on");
				})
					.mouseleave(function () {
					return n.toggleScrollButtons(this, "off");
				})
					.mousemove(function () {
					if(scrollButtonFadeTimer !== 0) {
						clearTimeout(scrollButtonFadeTimer);
						scrollButtonFadeTimer = 0;
					}
					var e = $(this)
						.children(".ui-menu-scroll-button")
						.children(".scroll-up");
					var t = $(this)
						.children(".ui-menu-scroll-button")
						.children(".scroll-down");
					if(e.css("display") === "none" || t.css("display") === "none") {
						n.toggleScrollButtons(this, "on");
					}
					return false;
				})});
			t = i.add(this.element);
			t.children(".ui-menu-scroll-container")
				.children(":not(.ui-menu-item):has(a)")
				.addClass("ui-menu-item")
				.attr("role", "presentation")
				.children("a")
				.uniqueId()
				.addClass("ui-corner-all")
				.attr({
					tabIndex: -1,
					role: this._itemRole()
				})
				.filter("."+this.options.unloadedClass)
				.append(
					$("<span>")
					.css("background-image", "url(http://code.jquery.com/ui/1.10.0/themes/vader/images/ui-icons_bbbbbb_256x240.png)")
					.addClass("ui-menu-icon ui-icon " + r)
					.data("ui-menu-submenu-carat", true)
				);
			t.children(".ui-menu-scroll-container")
				.children(":not(.ui-menu-item)")
				.each(function () {
				var e = $(this);
				if(!/[^\-—–\s]/.test(e.text())) {
					e.addClass("ui-widget-content ui-menu-divider");
				}
			});
			t.children(".ui-menu-scroll-container")
				.children(".ui-state-disabled")
				.attr("aria-disabled", "true");
			if(this.active && !$.contains(this.element[0], this.active[0])) {
				this.blur();
			}
			if(callback && $.isFunction(callback)) {
				callback();
			}
		},
		
		_open: function( submenu ) {
			if (this.options.menuDepthPosition.depthInterval && this.options.menuDepthPosition.depthInterval !== 0 && Math.ceil((submenu.parents(".ui-menu").length + 1) / this.options.menuDepthPosition.depthInterval) % 2 === 0) {
				var position = $.extend({
					of: this.active
				}, this.options.menuDepthPosition.altPosition );
			}
			else {
				var position = $.extend({
					of: this.active
				}, this.options.position );
			}
			clearTimeout( this.timer );
			this.element.find( ".ui-menu" ).not( submenu.parents( ".ui-menu" ) )
				.hide()
				.attr( "aria-hidden", "true" );
	
			submenu.show()
				.removeAttr( "aria-hidden" )
				.attr( "aria-expanded", "true" )
				.position( position );
		},
		
	//	### End of modification to inherited widget functions ###
	//	### Begin extending functions ###			
		
		onScroll: function (div, t, n, r) {
			if(!scrollState || r) {
				scrollState = true;
				var i = 0,
					s = this,
					o = $(div)
						.height();
				$.map($(div)
					.children(), function (e) {
					i += $(e)
						.height()
				});
				if(i > o) {
					var u = parseInt($(div)
						.children(":first")
						.css("margin-top")
						.replace(/[a-z,A-Z]*/g, "")),
						a = o - i,
						m = a,
						f = $(div)
							.children(":first")
							.height();
					if(t === -1 && o - u < i) {
						$(div)
							.find(".ui-menu")
							.hide()
							.attr("aria-expanded","false")
							.attr("aria-hidden","true");
						$(div)
							.find("a")
							.removeClass("ui-state-focus")
							.removeClass("ui-state-active");
						var l = u - f;
						if(l + o > i) {
							a += "px";
							$(div)
								.children(":first")
								.animate({
								"margin-top": a
							}, n, function () {
								s.scrollBufferLoop(div, n, m)
							});
						} else {
							l += "px";
							$(div)
								.children(":first")
								.animate({
								"margin-top": l
							}, n, function () {
								s.scrollBufferLoop(div, n, m)
							});
						}
					} else if(t == 1 && u < 0) {
						$(div)
							.find(".ui-menu")
							.hide()
							.attr("aria-expanded","false")
							.attr("aria-hidden","true");
						$(div)
							.find("a")
							.removeClass("ui-state-focus")
							.removeClass("ui-state-active");
						var l = u + f;
						if(l > 0) {
							$(div)
								.children(":first")
								.animate({
								"margin-top": "0px"
							}, n, function () {
								s.scrollBufferLoop(div, n, m)
							});
						} else {
							l += "px";
							$(div)
								.children(":first")
								.animate({
								"margin-top": l
							}, n, function () {
								s.scrollBufferLoop(div, n, m)
							});
						} 
					} else {
						scrollState = false
					}
				} else {
					scrollState = false
				}
			}
			return false
		},
		scrollBufferLoop: function (div, t, m) {
			var c = parseInt($(div).children(":first").css('margin-top').replace(/[a-z,A-Z]*/g,""));
			if (c == m) {
				$(div).data("scrollposition","bottom" );
			}
			else if (c == 0) {
				$(div).data("scrollposition","top");
			}
			else {
				$(div).data("scrollposition","none" );
			}
			this.toggleScrollButtons($(div).parent(),"check");
			if((scrollBuffer && scrollBufferDelta !== 0) || scrollHoverState) {
				scrollBuffer = false;
				this.onScroll(div, scrollBufferDelta, t, true)
			} else {
				scrollState = false
			}
		},
		scrollButtonHover: function (e, t, n) {
			if(n == "on") {
				if(!scrollHoverState) {
					scrollHoverState = true;
					scrollBufferDelta = t;
					this.onScroll($(e)
						.parent()
						.siblings(".ui-menu-scroll-container"), t, 170)
				}
			}
			if(n == "off") {
				var r = this;
				scrollBufferDelta = 0;
				scrollHoverState = false;
				scrollButtonFadeTimer = setTimeout(function () {
					var t = $(e)
						.parent()
						.parent();
					if(t.attr("class") == "ui-menu-scroll-button down" || t.attr("class") == "ui-menu-scroll-button up") {
						t = $(t)
							.parent()
							.parent(".ui-menu")
					}
					r.toggleScrollButtons(t, "off")
				}, 10)
			}
			return false
		},
		toggleScrollButtons: function (e, t) {
			var r = $(e)
				.children(".ui-menu-scroll-container"),
				i = 0;
			if(t == "on") {
				var s = $(".ui-menu")
					.not(e);
				s.children(".ui-menu-scroll-button.up")
					.children(".scroll-up")
					.hide(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonTop, this.options.scrollButton.duration);
				s.children(".ui-menu-scroll-button.down")
					.children(".scroll-down")
					.hide(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonBottom, this.options.scrollButton.duration);
				var o = $(e)
					.parents(".ui-menu");
				$(e)
					.children(".ui-menu-scroll-container")
					.children("li")
					.children(".ui-menu")
					.find(".ui-menu")
					.attr("aria-hidden", "true")
					.hide()
			}
			$.map($(r)
				.children(), function (z) {
				i += $(z)
					.height()
			});
			if(i > $(r)
				.height()) {
				var u = $(e)
					.children(".ui-menu-scroll-button")
					.find(".scroll-up");
				var a = $(e)
					.children(".ui-menu-scroll-button")
					.find(".scroll-down");
				if(u.is(":animated") || a.is(":animated")) {
					u.stop(true, true);
					a.stop(true, true)
				}
				if(t == "on" || t == "check") {
					var m = $(e).children(".ui-menu-scroll-container").data( "scrollposition" );
					if (m === "top") {
						u.hide(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonTop, this.options.scrollButton.duration);
						a.show(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonBottom, this.options.scrollButton.duration)
					}
					if (m === "bottom") {
						u.show(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonTop, this.options.scrollButton.duration);
						a.hide(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonBottom, this.options.scrollButton.duration)
					}
					if (m ==="none") {
						u.show(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonTop, this.options.scrollButton.duration);
						a.show(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonBottom, this.options.scrollButton.duration)
					}
				}
				if(t == "off") {
					u.hide(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonTop, this.options.scrollButton.duration);
					a.hide(this.options.scrollButton.effect, this.options.scrollButton.optionsButtonBottom, this.options.scrollButton.duration)
				}
			}
			return false
		}
		
	//	### End of extending functions ### 
	})
/*	### End of Scrolling Menu Widget ### */