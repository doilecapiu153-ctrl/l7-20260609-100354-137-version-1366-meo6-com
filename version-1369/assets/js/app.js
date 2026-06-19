(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupMobileMenu() {
        const toggle = document.querySelector("[data-mobile-toggle]");
        const links = document.querySelector("[data-nav-links]");
        if (!toggle || !links) {
            return;
        }

        toggle.addEventListener("click", function () {
            links.classList.toggle("is-open");
        });
    }

    function setupHero() {
        const hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }

        const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
        const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
        const prev = hero.querySelector("[data-hero-prev]");
        const next = hero.querySelector("[data-hero-next]");
        let current = 0;
        let timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
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

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                start();
            });
        });

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function setupFilters() {
        const scope = document.querySelector("[data-filter-scope]");
        if (!scope) {
            return;
        }

        const input = scope.querySelector("[data-search-input]");
        const selects = Array.from(scope.querySelectorAll("[data-filter-select]"));
        const cards = Array.from(scope.querySelectorAll("[data-movie-card]"));
        const count = scope.querySelector("[data-result-count]");
        const empty = scope.querySelector("[data-empty-state]");

        function valueOf(selectName) {
            const select = selects.find(function (item) {
                return item.name === selectName;
            });
            return select ? select.value : "all";
        }

        function apply() {
            const keyword = input ? input.value.trim().toLowerCase() : "";
            const category = valueOf("category");
            const year = valueOf("year");
            const type = valueOf("type");
            let visible = 0;

            cards.forEach(function (card) {
                const text = (card.dataset.search || card.textContent || "").toLowerCase();
                const matchKeyword = !keyword || text.indexOf(keyword) !== -1;
                const matchCategory = category === "all" || card.dataset.category === category;
                const matchYear = year === "all" || card.dataset.year === year;
                const matchType = type === "all" || card.dataset.type === type;
                const shouldShow = matchKeyword && matchCategory && matchYear && matchType;

                card.classList.toggle("hidden-by-filter", !shouldShow);
                if (shouldShow) {
                    visible += 1;
                }
            });

            if (count) {
                count.textContent = "当前显示 " + visible + " 部影片";
            }
            if (empty) {
                empty.classList.toggle("is-visible", visible === 0);
            }
        }

        if (input) {
            input.addEventListener("input", apply);
        }
        selects.forEach(function (select) {
            select.addEventListener("change", apply);
        });
        apply();
    }

    ready(function () {
        setupMobileMenu();
        setupHero();
        setupFilters();
    });
})();
