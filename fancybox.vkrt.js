/*!
 * FancyBox VK / RuTube
 * Optional plugin. Load after original FB links
 * ReisgnBundle
 */
(function(global) {
    "use strict";

    var Fancybox = global.Fancybox;
    if (!Fancybox || !Fancybox.Plugins) return;
    if (Fancybox.Plugins.VkRutube) return;

    var defaults = {
        rutube: {
            frameBorder: 0
        },
        vk: {
            autoplay: 1,
            hd: 2
        },
        iframeAttr: {
            allow: "autoplay; fullscreen",
            scrolling: "no",
            referrerPolicy: "strict-origin-when-cross-origin",
        },
    };

    var rutubeRe = /^.+rutube\.ru\/(?:video|play\/embed|shorts)\/(?:.*\/)?([\w-]+)(?:.*)?/i;
    var vkRe = /(?:vk\.com|vkvideo\.ru|vk\.ru)\/(?:video_ext\.php\?(?:.*&)?oid=(-?\d+)(?:&[^#]*)?&id=(\d+)(?:&[^#]*hash=([a-fA-F0-9]+))?|video(?:\/)?(-?\d+)_(\d+)(?:\/([a-fA-F0-9]+))?|clip(-?\d+)_(\d+))/i;

    function isObject(value) {
        return typeof value === "object" && !!value && value.constructor === Object && Object.prototype.toString.call(value) === "[object Object]";
    }

    function merge(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i] || {};
            Object.keys(source).forEach(function(key) {
                if (isObject(source[key])) target[key] = merge(isObject(target[key]) ? target[key] : {}, source[key]);
                else target[key] = source[key];
            });
        }
        return target;
    }

    function optionsOf(instance) {
        var custom = instance && instance.getOptions ? instance.getOptions().VkRutube : null;
        return isObject(custom) ? merge({}, defaults, custom) : merge({}, defaults);
    }

    function queryString(url, params) {
        var parsed = new URL(url);
        var incoming = new URLSearchParams(parsed.search);
        var outgoing = new URLSearchParams();

        function append(key, value) {
            var text = value + "";
            if (key === "t") {
                var match = text.match(/((\d*)m)?(\d*)s?/);
                if (match) outgoing.set("start", String(parseInt(match[2] || "0", 10) * 60 + parseInt(match[3] || "0", 10)));
            } else outgoing.set(key, text);
        }

        incoming.forEach(append);
        Object.keys(params || {}).forEach(function(key) {
            append(key, params[key]);
        });

        var result = outgoing.toString();
        var hash = url.match(/#t=((.*)?\d+s)/);
        if (hash) result += "#t=" + hash[1];
        return result;
    }

    function aspectRatio(type, url) {
        if (type === "rutube") return /shorts?/i.test(url) ? "9/16" : "16/9";
        if (type === "vk") return /clip/i.test(url) ? "9/16" : "16/9";
        return "";
    }

    function parse(slide, options) {
        var url = slide && slide.src;
        if (typeof url !== "string" || !url) return false;
        if (slide.type && slide.type !== "rutube" && slide.type !== "vk") return false;

        var rutube = url.match(rutubeRe);
        if ((!slide.type || slide.type === "rutube") && rutube) {
            var rutubeParams = merge({}, options.rutube, isObject(slide.rutube) ? slide.rutube : {});
            var rutubeId = encodeURIComponent(rutube[1]);
            slide.videoId = rutubeId;
            slide.src = "https://rutube.ru/play/embed/" + rutubeId + "?" + queryString(url, rutubeParams);
            slide.aspectRatio = slide.aspectRatio || aspectRatio("rutube", url);
            slide.type = "rutube";
            return true;
        }

        var vk = url.match(vkRe);
        if ((!slide.type || slide.type === "vk") && vk) {
            var oid = vk[1] || vk[4] || vk[7];
            var id = vk[2] || vk[5] || vk[8];
            var hash = vk[3] || vk[6] || "";
            var cleanUrl = url;
            try {
                var parsedUrl = new URL(url);
                parsedUrl.searchParams.delete("oid");
                parsedUrl.searchParams.delete("id");
                parsedUrl.searchParams.delete("hash");
                cleanUrl = parsedUrl.toString();
            } catch (error) {}
            var vkParams = merge({}, options.vk, isObject(slide.vk) ? slide.vk : {});
            var extra = queryString(cleanUrl, vkParams);
            slide.videoId = oid + "_" + id;
            slide.src =
                "https://vk.com/video_ext.php?oid=" +
                encodeURIComponent(oid) +
                "&id=" +
                encodeURIComponent(id) +
                (hash ? "&hash=" + encodeURIComponent(hash) : "") +
                (extra ? "&" + extra : "");
            slide.aspectRatio = slide.aspectRatio || aspectRatio("vk", url);
            slide.type = "vk";
            return true;
        }

        return false;
    }

    function isProvider(slide) {
        return !!slide && (slide.type === "rutube" || slide.type === "vk");
    }

    function addClass(element, names) {
        if (!element) return;
        String(names)
            .split(" ")
            .forEach(function(name) {
                if (name) element.classList.add(name);
            });
    }

    function size(slide) {
        var box = slide && slide.htmlEl;
        if (!box || !isProvider(slide)) return;

        box.style.aspectRatio = "";
        box.style.width = "";
        box.style.height = "";
        box.style.maxWidth = "";
        box.style.maxHeight = "";

        function length(value) {
            var text = String(value);
            return /^\d+$/.test(text) ? text + "px" : text;
        }

        if (slide.width) box.style.maxWidth = length(slide.width);
        if (slide.height) box.style.maxHeight = length(slide.height);
        if (!slide.aspectRatio) return;

        var parts = String(slide.aspectRatio).split("/");
        var width = parseFloat(parts[0].trim());
        var height = parts[1] ? parseFloat(parts[1].trim()) : 0;
        var ratio = width && height ? width / height : width;
        if (!ratio) return;

        box.offsetHeight;
        var bounds = box.getBoundingClientRect();
        var portrait = ratio < (bounds.width || 1) / (bounds.height || 1);
        box.style.aspectRatio = slide.aspectRatio;
        box.style.width = portrait ? "auto" : "";
        box.style.height = portrait ? "" : "auto";
    }

    function attach(instance, slide) {
        var element = slide && slide.el;
        if (!instance || !element || !slide.src || !isProvider(slide) || slide.contentEl) return;

        var options = optionsOf(instance);
        var frame = document.createElement("iframe");
        addClass(frame, "f-iframe");
        frame.setAttribute("id", "f-iframe_" + slide.videoId);
        Object.keys(options.iframeAttr || {}).forEach(function(name) {
            frame.setAttribute(name, options.iframeAttr[name]);
        });
        frame.onerror = function() {
            if (instance.showError) instance.showError(slide, "{{IFRAME_ERROR}}");
        };

        var box = document.createElement("div");
        addClass(box, "f-html");
        box.append(frame);
        slide.contentEl = frame;
        slide.htmlEl = box;
        addClass(element, "has-html has-iframe has-" + slide.type);
        frame.src = slide.src;
        element.prepend(box);
        size(slide);
        if (instance.emit) instance.emit("contentReady", slide);
    }

    function detach(slide) {
        if (!isProvider(slide)) return;
        if (slide.contentEl) slide.contentEl.remove();
        if (slide.htmlEl) slide.htmlEl.remove();
        slide.contentEl = undefined;
        slide.htmlEl = undefined;
    }

    function VkRutube() {
        var instance;

        function prepare(event, slide) {
            if (!slide || !slide.src) return;
            parse(slide, optionsOf(instance));
        }

        function onAttach(event, slide) {
            attach(instance, slide);
        }

        function onDetach(event, slide) {
            detach(slide);
        }

        function onRefresh() {
            var slide = instance && instance.getSlide ? instance.getSlide() : null;
            size(slide);
        }

        return {
            init: function(fancybox) {
                instance = fancybox;
                instance.on("addSlide", prepare);
                instance.on("attachSlideEl", onAttach);
                instance.on("detachSlideEl", onDetach);
                instance.on("refresh", onRefresh);
            },
            destroy: function() {
                if (!instance) return;
                instance.off("addSlide", prepare);
                instance.off("attachSlideEl", onAttach);
                instance.off("detachSlideEl", onDetach);
                instance.off("refresh", onRefresh);
                instance = undefined;
            },
        };
    }

    VkRutube.defaults = defaults;
    Fancybox.Plugins.VkRutube = VkRutube;

    var base = Fancybox.getDefaults();
    base.Carousel = base.Carousel || {};
    base.Carousel.plugins = base.Carousel.plugins || {};
    base.Carousel.plugins.VkRutube = VkRutube;
})(window);