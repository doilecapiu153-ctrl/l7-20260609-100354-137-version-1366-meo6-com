document.addEventListener("DOMContentLoaded", function () {
  initMobileMenu();
  initHero();
  initSearchAndSort();
  initPlayer();
});

function initMobileMenu() {
  var button = document.querySelector("[data-menu-button]");
  var nav = document.querySelector("[data-mobile-nav]");
  if (!button || !nav) {
    return;
  }
  button.addEventListener("click", function () {
    nav.classList.toggle("is-open");
  });
}

function initHero() {
  var hero = document.querySelector("[data-hero]");
  if (!hero) {
    return;
  }
  var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
  if (!slides.length) {
    return;
  }
  var active = 0;
  var timer = null;
  var showSlide = function (index) {
    active = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === active);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === active);
    });
  };
  var start = function () {
    window.clearInterval(timer);
    timer = window.setInterval(function () {
      showSlide(active + 1);
    }, 5000);
  };
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      var index = Number(dot.getAttribute("data-hero-dot"));
      showSlide(index);
      start();
    });
  });
  showSlide(0);
  start();
}

function initSearchAndSort() {
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-list-section]"));
  sections.forEach(function (section) {
    var input = section.querySelector("[data-search-input]");
    var sort = section.querySelector("[data-sort-select]");
    var list = section.querySelector("[data-card-list]");
    var cards = Array.prototype.slice.call(section.querySelectorAll("[data-movie-card]"));
    var filterButtons = Array.prototype.slice.call(section.querySelectorAll("[data-filter]"));
    var activeFilter = "all";
    var apply = function () {
      var query = input ? input.value.trim().toLowerCase() : "";
      cards.forEach(function (card) {
        var haystack = (card.getAttribute("data-search") || "").toLowerCase();
        var type = (card.getAttribute("data-type") || "").toLowerCase();
        var matchedQuery = !query || haystack.indexOf(query) !== -1;
        var matchedFilter = activeFilter === "all" || type.indexOf(activeFilter.toLowerCase()) !== -1 || haystack.indexOf(activeFilter.toLowerCase()) !== -1;
        card.classList.toggle("is-hidden-card", !(matchedQuery && matchedFilter));
      });
    };
    if (input) {
      input.addEventListener("input", apply);
    }
    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeFilter = button.getAttribute("data-filter") || "all";
        filterButtons.forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        apply();
      });
    });
    if (sort && list) {
      sort.addEventListener("change", function () {
        var value = sort.value;
        var sorted = cards.slice();
        if (value === "year-desc") {
          sorted.sort(function (a, b) {
            return Number(b.getAttribute("data-year")) - Number(a.getAttribute("data-year"));
          });
        }
        if (value === "year-asc") {
          sorted.sort(function (a, b) {
            return Number(a.getAttribute("data-year")) - Number(b.getAttribute("data-year"));
          });
        }
        if (value === "title") {
          sorted.sort(function (a, b) {
            return (a.getAttribute("data-title") || "").localeCompare(b.getAttribute("data-title") || "", "zh-Hans-CN");
          });
        }
        sorted.forEach(function (card) {
          list.appendChild(card);
        });
        apply();
      });
    }
    apply();
  });
}

function initPlayer() {
  var player = document.querySelector("[data-player]");
  if (!player) {
    return;
  }
  var video = player.querySelector("video");
  var button = player.querySelector("[data-play-button]");
  var stream = player.getAttribute("data-stream");
  var ready = false;
  var hls = null;
  var loadVideo = function () {
    if (ready || !video || !stream) {
      return;
    }
    ready = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
    } else if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(stream);
      hls.attachMedia(video);
    } else {
      video.src = stream;
    }
  };
  var playVideo = function () {
    loadVideo();
    if (button) {
      button.classList.add("is-hidden");
    }
    video.controls = true;
    var playTask = video.play();
    if (playTask && typeof playTask.catch === "function") {
      playTask.catch(function () {
        if (button) {
          button.classList.remove("is-hidden");
        }
      });
    }
  };
  if (button) {
    button.addEventListener("click", playVideo);
  }
  video.addEventListener("click", function () {
    if (video.paused) {
      playVideo();
    } else {
      video.pause();
    }
  });
  video.addEventListener("play", function () {
    if (button) {
      button.classList.add("is-hidden");
    }
  });
  video.addEventListener("ended", function () {
    if (button) {
      button.classList.remove("is-hidden");
    }
  });
  window.addEventListener("beforeunload", function () {
    if (hls) {
      hls.destroy();
    }
  });
}
