(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initializeNavigation() {
        var toggle = document.querySelector(".nav-toggle");
        var nav = document.querySelector(".site-nav");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function initializeHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
        if (slides.length < 2) {
            return;
        }
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, position) {
                slide.classList.toggle("is-active", position === current);
            });
            dots.forEach(function (dot, position) {
                dot.classList.toggle("is-active", position === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-slide") || "0"));
                start();
            });
        });

        var carousel = document.querySelector(".hero-carousel");
        if (carousel) {
            carousel.addEventListener("mouseenter", stop);
            carousel.addEventListener("mouseleave", start);
        }
        start();
    }

    function initializeFilters() {
        var input = document.querySelector("[data-search-input]");
        var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card, .rank-card"));
        var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
        if (!input && filters.length === 0) {
            return;
        }

        function normalized(value) {
            return String(value || "").toLowerCase().trim();
        }

        function apply() {
            var query = normalized(input ? input.value : "");
            var selected = {};
            filters.forEach(function (filter) {
                selected[filter.getAttribute("data-filter")] = normalized(filter.value);
            });
            cards.forEach(function (card) {
                var text = normalized(card.getAttribute("data-search") || card.textContent);
                var matched = !query || text.indexOf(query) !== -1;
                Object.keys(selected).forEach(function (key) {
                    var value = selected[key];
                    if (!value) {
                        return;
                    }
                    if (normalized(card.getAttribute("data-" + key)) !== value) {
                        matched = false;
                    }
                });
                card.hidden = !matched;
            });
        }

        if (input) {
            input.addEventListener("input", apply);
        }
        filters.forEach(function (filter) {
            filter.addEventListener("change", apply);
        });
    }

    ready(function () {
        initializeNavigation();
        initializeHero();
        initializeFilters();
    });
})();

function initializeMoviePlayer(sourceUrl) {
    var video = document.querySelector(".js-player");
    var layer = document.querySelector(".js-play-layer");
    var shell = document.querySelector(".player-shell");
    if (!video || !sourceUrl) {
        return;
    }

    var loaded = false;
    var hlsInstance = null;

    function loadVideo() {
        if (loaded) {
            return;
        }
        loaded = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = sourceUrl;
        }
    }

    function hideLayer() {
        if (layer) {
            layer.classList.add("is-hidden");
        }
    }

    function startPlayback() {
        loadVideo();
        hideLayer();
        video.controls = true;
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
        }
    }

    if (layer) {
        layer.addEventListener("click", startPlayback);
    }
    if (shell) {
        shell.addEventListener("click", function (event) {
            if (event.target === shell) {
                startPlayback();
            }
        });
    }
    video.addEventListener("click", function () {
        if (video.paused) {
            startPlayback();
        }
    });
    video.addEventListener("play", hideLayer);
    window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
