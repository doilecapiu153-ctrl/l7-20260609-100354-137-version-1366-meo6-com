(function () {
    function queryAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMobileMenu() {
        var button = document.querySelector('[data-mobile-menu-button]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }

        button.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }

        var slides = queryAll('.hero-slide', hero);
        var dots = queryAll('[data-hero-dot]', hero);
        var next = hero.querySelector('[data-hero-next]');
        var prev = hero.querySelector('[data-hero-prev]');
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 6000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var index = parseInt(dot.getAttribute('data-hero-dot') || '0', 10);
                show(index);
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function setupFilters() {
        queryAll('[data-filter-panel]').forEach(function (panel) {
            var section = panel.closest('section') || document;
            var cards = queryAll('.movie-card', section);
            var searchInput = panel.querySelector('[data-search-input]');
            var categoryFilter = panel.querySelector('[data-category-filter]');
            var typeFilter = panel.querySelector('[data-type-filter]');
            var yearFilter = panel.querySelector('[data-year-filter]');
            var regionFilter = panel.querySelector('[data-region-filter]');
            var reset = panel.querySelector('[data-reset-filter]');
            var count = section.querySelector('[data-result-count]');

            function getValue(element) {
                return element ? String(element.value || '').trim().toLowerCase() : '';
            }

            function cardText(card) {
                return [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-category'),
                    card.getAttribute('data-tags'),
                    card.textContent
                ].join(' ').toLowerCase();
            }

            function apply() {
                var keyword = getValue(searchInput);
                var category = getValue(categoryFilter);
                var type = getValue(typeFilter);
                var year = getValue(yearFilter);
                var region = getValue(regionFilter);
                var visible = 0;

                cards.forEach(function (card) {
                    var text = cardText(card);
                    var match = true;

                    if (keyword && text.indexOf(keyword) === -1) {
                        match = false;
                    }
                    if (category && getValue({ value: card.getAttribute('data-category') }) !== category) {
                        match = false;
                    }
                    if (type && getValue({ value: card.getAttribute('data-type') }) !== type) {
                        match = false;
                    }
                    if (year && getValue({ value: card.getAttribute('data-year') }) !== year) {
                        match = false;
                    }
                    if (region && getValue({ value: card.getAttribute('data-region') }) !== region) {
                        match = false;
                    }

                    card.classList.toggle('is-hidden', !match);
                    if (match) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = '共 ' + visible + ' 部影片';
                }
            }

            [searchInput, categoryFilter, typeFilter, yearFilter, regionFilter].forEach(function (element) {
                if (element) {
                    element.addEventListener('input', apply);
                    element.addEventListener('change', apply);
                }
            });

            if (reset) {
                reset.addEventListener('click', function () {
                    [searchInput, categoryFilter, typeFilter, yearFilter, regionFilter].forEach(function (element) {
                        if (element) {
                            element.value = '';
                        }
                    });
                    apply();
                });
            }

            var params = new URLSearchParams(window.location.search);
            if (params.has('q') && searchInput) {
                searchInput.value = params.get('q') || '';
            }
            if (params.has('region') && regionFilter) {
                var desiredRegion = params.get('region') || '';
                var matched = false;
                queryAll('option', regionFilter).forEach(function (option) {
                    if (option.value.indexOf(desiredRegion) !== -1 || option.textContent.indexOf(desiredRegion) !== -1) {
                        regionFilter.value = option.value;
                        matched = true;
                    }
                });
                if (!matched && searchInput && !searchInput.value) {
                    searchInput.value = desiredRegion;
                }
            }
            apply();
        });
    }

    function setupPlayers() {
        queryAll('[data-player]').forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-player-button]');
            var message = player.querySelector('[data-player-message]');
            var source = player.getAttribute('data-video-url');
            var hasLoaded = false;
            var hlsInstance = null;

            function setMessage(text) {
                if (message) {
                    message.textContent = text || '';
                }
            }

            function playVideo() {
                if (!video) {
                    return;
                }

                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () {
                        setMessage('浏览器阻止了自动播放，请再次点击播放按钮。');
                    });
                }
            }

            function load() {
                if (!video || !source) {
                    setMessage('当前影片暂无可用播放源。');
                    return;
                }

                if (hasLoaded) {
                    playVideo();
                    return;
                }

                hasLoaded = true;
                player.classList.add('is-loading');
                setMessage('正在加载播放源...');

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    video.addEventListener('loadedmetadata', function () {
                        player.classList.add('is-ready');
                        player.classList.remove('is-loading');
                        setMessage('');
                        playVideo();
                    }, { once: true });
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        player.classList.add('is-ready');
                        player.classList.remove('is-loading');
                        setMessage('');
                        playVideo();
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setMessage('播放源加载失败，请刷新页面后重试。');
                            player.classList.remove('is-loading');
                            if (hlsInstance) {
                                hlsInstance.destroy();
                                hlsInstance = null;
                            }
                        }
                    });
                    return;
                }

                video.src = source;
                player.classList.add('is-ready');
                player.classList.remove('is-loading');
                setMessage('');
                playVideo();
            }

            if (button) {
                button.addEventListener('click', load);
            }

            if (video) {
                video.addEventListener('click', function () {
                    if (!hasLoaded) {
                        load();
                    }
                });
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupHero();
        setupFilters();
        setupPlayers();
    });
})();
