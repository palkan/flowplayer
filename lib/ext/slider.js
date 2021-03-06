/* A minimal jQuery Slider plugin with all goodies */

// skip IE policies
// document.ondragstart = function () { return false; };


// execute function every <delay> ms
$.throttle = function (fn, delay) {
    var locked;

    return function () {
        if (!locked) {
            fn.apply(this, arguments);
            locked = 1;
            setTimeout(function () {
                locked = 0;
            }, delay);
        }
    };
};


$.fn.slider2 = function (rtl) {

    var IS_IPAD = /iPad/.test(navigator.userAgent) && !/CriOS/.test(navigator.userAgent);

    return this.each(function () {

        var root = $(this),
            doc = $(document),
            progress = root.children(".fp-sl-progress"),
            thumb = root.children(".fp-sl-thumb"),
            tooltip = root.children(".fp-time-tooltip"),
            tooltipHideID,
            duration, // used only for timeline api
            disabled,
            offset,
            width,
            height,
            vertical,
            size,
            maxValue,
            max,
            skipAnimation = false,

        /* private */
            calc = function () {
                offset = root.offset();
                width = root.width();
                height = root.height();

                /* exit from fullscreen can mess this up.*/
                // vertical = height > width;

                size = vertical ? height : width;
                max = toDelta(maxValue);
            },

            fire = function (value) {
                if (!disabled && value != api.value && (!maxValue || value < maxValue)) {
                    root.trigger("slide", [ value ]);
                    api.value = value;
                }
            },

            mousemove = function (e) {
                var pageX = e.pageX;
                if (!pageX && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length) {
                    pageX = e.originalEvent.touches[0].pageX;
                }
                var delta = vertical ? e.pageY - offset.top : pageX - offset.left;
                delta = Math.max(0, Math.min(max || size, delta));

                var value = delta / size;
                if (vertical) value = 1 - value;
                if (rtl) value = 1 - value;
                return move(value, 0, true);
            },

            mousemove_thumb = function (e) {

                if(tooltipHideID) clearTimeout(tooltipHideID);

                var pageX = e.pageX;

                var delta = pageX - offset.left;
                delta = Math.max(0, Math.min(max || size, delta));

                var value = delta / size;
                return thumbSetTo(value);
            },

            thumbSetTo = function(value){

                if (value > 1) value = 1;


                var to = (Math.round(value * 1000) / 10) + "%";

                if(tooltip){
                    tooltip.show();
                    tooltip.text(format(value*duration));
                    tooltip.css('left',to);
                }

                thumb.css('left', to);

                return value;

            },

            move = function (value, speed) {
                if (speed === undefined) {
                    speed = 0;
                }
                if (value > 1) value = 1;

                var to = (Math.round(value * 1000) / 10) + "%";

                if (!maxValue || value <= maxValue) {
                    if (!IS_IPAD) progress.stop(); // stop() broken on iPad
                    if (skipAnimation) {
                        progress.css('width', to);
                        !api._hover && thumb.css('left', to);
                    } else {
                        !api._hover && thumb.animate(vertical ? { top: to } : { left: to }, {duration:speed, queue: false}, "linear");
                        progress.animate(vertical ? { height: to } : { width: to }, {duration:speed, queue: false}, "linear");

                    }
                }

                return value;
            },

            toDelta = function (value) {
                return Math.max(0, Math.min(size, vertical ? (1 - value) * height : value * width));
            },

        /* public */
            api = {

                max: function (value) {
                    maxValue = value;
                },

                disable: function (flag) {
                    disabled = flag;
                },

                slide: function (value, speed, fireEvent) {
                    calc();
                    if (fireEvent) fire(value);
                    move(value, speed);
                },

                duration: function(value){

                    duration = value;

                },

                // Should animation be handled via css
                disableAnimation: function (value) {
                    skipAnimation = value !== false;
                }

            };

        calc();

        // bound dragging into document
        root.data("api", api).bind("mousedown.sld touchstart", function (e) {
            e.preventDefault();

            if (!disabled) {

                if(api._hover){

                    doc.unbind("mousemove.sld").unbind("mouseout.sld");
                    api._hover = false;

                }

                // begin --> recalculate. allows dynamic resizing of the slider
                var delayedFire = $.throttle(fire, 100);
                calc();
                api.dragging = true;
                root.addClass('is-dragging');
                fire(mousemove(e));

                doc.bind("mousemove.sld touchmove",function (e) {
                    e.preventDefault();
                    delayedFire(mousemove(e));

                }).one("mouseup touchend", function () {
                        api.dragging = false;
                        root.removeClass('is-dragging');
                        doc.unbind("mousemove.sld touchmove");
                    });

            }

        });


        if(thumb){

            root.data("api", api).bind("mouseover.sld", function (e) {
                if (!disabled) {
                   // var delayedFire = $.throttle(fire, 100);
                    calc();

                    var _old = parseInt(thumb.css('left')) / size;

                    api._hover = true;

                    if(tooltipHideID) clearTimeout(tooltipHideID);

                    doc.bind("mousemove.sld",function (e) {
                        e.preventDefault();
                        mousemove_thumb(e);

                    }).one("mouseout.sld", function () {
                            doc.unbind("mousemove.sld");
                            thumbSetTo(_old);
                            tooltipHideID = setTimeout((function(){ tooltip.hide(); api._hover = false;})(),1500);
                        });

                }

            });


        }

    });

};
