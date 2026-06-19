(function () {
  "use strict";

  var HLS_CDN = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
  var hlsLoaderPromise = null;

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMobileMenu() {
    var button = document.querySelector("[data-mobile-menu-button]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    if (slides.length <= 1) {
      return;
    }

    var current = 0;
    var timer = null;

    function showSlide(index) {
      current = index % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function startTimer() {
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        if (timer) {
          window.clearInterval(timer);
        }
        showSlide(index);
        startTimer();
      });
    });

    startTimer();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-list]"));
    panels.forEach(function (panel) {
      var input = panel.querySelector("[data-search-input]");
      var typeFilter = panel.querySelector("[data-type-filter]");
      var yearFilter = panel.querySelector("[data-year-filter]");
      var counter = panel.querySelector("[data-visible-count]");
      var cards = Array.prototype.slice.call(panel.querySelectorAll("[data-movie-card]"));

      function applyFilter() {
        var keyword = normalize(input && input.value);
        var typeValue = normalize(typeFilter && typeFilter.value);
        var yearValue = normalize(yearFilter && yearFilter.value);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.dataset.title,
            card.dataset.year,
            card.dataset.type,
            card.dataset.region,
            card.dataset.genre,
            card.dataset.tags
          ].join(" "));
          var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          var matchesType = !typeValue || normalize(card.dataset.type) === typeValue;
          var matchesYear = !yearValue || normalize(card.dataset.year) === yearValue;
          var shouldShow = matchesKeyword && matchesType && matchesYear;

          card.classList.toggle("is-hidden-by-filter", !shouldShow);
          if (shouldShow) {
            visible += 1;
          }
        });

        if (counter) {
          counter.textContent = String(visible);
        }
      }

      [input, typeFilter, yearFilter].forEach(function (control) {
        if (control) {
          control.addEventListener("input", applyFilter);
          control.addEventListener("change", applyFilter);
        }
      });
    });
  }

  function loadHlsScript() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (hlsLoaderPromise) {
      return hlsLoaderPromise;
    }

    hlsLoaderPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = HLS_CDN;
      script.async = true;
      script.onload = function () {
        if (window.Hls) {
          resolve(window.Hls);
        } else {
          reject(new Error("HLS library loaded without global Hls object."));
        }
      };
      script.onerror = function () {
        reject(new Error("HLS library failed to load."));
      };
      document.head.appendChild(script);
    });

    return hlsLoaderPromise;
  }

  function attachSource(video, sourceUrl) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
      return Promise.resolve();
    }

    return loadHlsScript().then(function (Hls) {
      if (!Hls.isSupported()) {
        throw new Error("This browser does not support HLS playback.");
      }

      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      video._hlsInstance = hls;
    });
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector("[data-play-button]");
      var shell = player.querySelector(".video-shell");
      var message = player.querySelector("[data-player-message]");
      if (!video || !button) {
        return;
      }

      var sourceUrl = button.getAttribute("data-source");
      var attached = false;

      function setMessage(text) {
        if (message) {
          message.textContent = text;
        }
      }

      button.addEventListener("click", function () {
        setMessage("正在初始化播放源...");
        var promise = attached ? Promise.resolve() : attachSource(video, sourceUrl);

        promise.then(function () {
          attached = true;
          if (shell) {
            shell.classList.add("is-playing");
          }
          setMessage("正在播放高清线路");
          return video.play();
        }).catch(function () {
          setMessage("当前浏览器无法加载该播放源，请稍后重试");
        });
      });

      video.addEventListener("play", function () {
        if (shell) {
          shell.classList.add("is-playing");
        }
      });
    });
  }

  function movieCardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return [
      "<article class=\"movie-card movie-card-compact\">",
      "  <a class=\"poster-link\" href=\"" + escapeHtml(movie.url) + "\">",
      "    <span class=\"poster-fallback\">影视在线</span>",
      "    <img src=\"" + escapeHtml(movie.poster) + "\" alt=\"" + escapeHtml(movie.title) + "海报\" loading=\"lazy\" onerror=\"this.classList.add('is-hidden');\">",
      "    <span class=\"card-type\">" + escapeHtml(movie.type) + "</span>",
      "  </a>",
      "  <div class=\"movie-card-body\">",
      "    <div class=\"card-meta\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span></div>",
      "    <h3><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>",
      "    <p>" + escapeHtml(movie.oneLine) + "</p>",
      "    <div class=\"tag-row\">" + tags + "</div>",
      "  </div>",
      "</article>"
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>\"]/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      }[character];
    });
  }

  function initGlobalSearch() {
    var form = document.querySelector("[data-global-search-form]");
    var input = document.querySelector("[data-global-search-input]");
    var results = document.querySelector("[data-global-results]");
    var heading = document.querySelector("[data-search-heading]");
    if (!form || !input || !results || !window.SEARCH_DATA) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";
    if (initialQuery) {
      input.value = initialQuery;
      runSearch(initialQuery);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      runSearch(input.value);
      var url = new URL(window.location.href);
      if (input.value.trim()) {
        url.searchParams.set("q", input.value.trim());
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState(null, "", url.toString());
    });

    input.addEventListener("input", function () {
      runSearch(input.value);
    });

    function runSearch(query) {
      var keyword = normalize(query);
      if (!keyword) {
        heading.textContent = "输入关键词开始搜索";
        return;
      }

      var words = keyword.split(/\s+/).filter(Boolean);
      var matched = window.SEARCH_DATA.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          (movie.tags || []).join(" "),
          movie.oneLine,
          movie.text
        ].join(" "));
        return words.every(function (word) {
          return haystack.indexOf(word) !== -1;
        });
      }).slice(0, 120);

      heading.textContent = "找到 " + matched.length + " 条相关影片";
      results.innerHTML = matched.length
        ? matched.map(movieCardTemplate).join("")
        : "<p class=\"empty-result\">没有找到匹配影片，请更换关键词。</p>";
    }
  }

  ready(function () {
    initMobileMenu();
    initHero();
    initFilters();
    initPlayers();
    initGlobalSearch();
  });
})();
