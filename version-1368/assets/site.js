(function () {
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('.hero-slide'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    let current = 0;
    let timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.dataset.heroDot || 0));
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        restart();
      });
    }

    showSlide(0);
    restart();
  }

  function fillSelect(select, values) {
    if (!select) {
      return;
    }

    values.forEach(function (value) {
      if (!value) {
        return;
      }

      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
    const scope = panel.closest('section') || document;
    const cards = Array.from(scope.querySelectorAll('.movie-card'));
    const input = panel.querySelector('[data-filter-input]');
    const yearSelect = panel.querySelector('[data-filter-year]');
    const regionSelect = panel.querySelector('[data-filter-region]');
    const typeSelect = panel.querySelector('[data-filter-type]');
    const years = Array.from(new Set(cards.map(function (card) { return card.dataset.year; }))).sort().reverse();
    const regions = Array.from(new Set(cards.map(function (card) { return card.dataset.region; }))).sort();
    const types = Array.from(new Set(cards.map(function (card) { return card.dataset.type; }))).sort();

    fillSelect(yearSelect, years);
    fillSelect(regionSelect, regions);
    fillSelect(typeSelect, types);

    function applyFilter() {
      const query = input ? input.value.trim().toLowerCase() : '';
      const year = yearSelect ? yearSelect.value : '';
      const region = regionSelect ? regionSelect.value : '';
      const type = typeSelect ? typeSelect.value : '';

      cards.forEach(function (card) {
        const haystack = [
          card.dataset.title,
          card.dataset.year,
          card.dataset.region,
          card.dataset.type,
          card.dataset.genre,
          card.dataset.tags
        ].join(' ').toLowerCase();
        const matchedQuery = !query || haystack.includes(query);
        const matchedYear = !year || card.dataset.year === year;
        const matchedRegion = !region || card.dataset.region === region;
        const matchedType = !type || card.dataset.type === type;
        card.classList.toggle('hidden-by-filter', !(matchedQuery && matchedYear && matchedRegion && matchedType));
      });
    }

    [input, yearSelect, regionSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });
  });

  function loadVideo(video, url) {
    if (!video || !url) {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      if (video.hlsPlayer) {
        video.hlsPlayer.destroy();
      }

      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      video.hlsPlayer = hls;
    } else {
      video.src = url;
    }
  }

  function startPlayback(video, button) {
    if (!video) {
      return;
    }

    const url = video.dataset.m3u8;

    if (!video.dataset.ready) {
      loadVideo(video, url);
      video.dataset.ready = '1';
    }

    const shell = video.closest('.player-shell');

    video.play().then(function () {
      if (shell) {
        shell.classList.add('playing');
      }
    }).catch(function () {
      if (button) {
        const label = button.querySelector('span:last-child');

        if (label) {
          label.textContent = '点击播放';
        }
      }
    });
  }

  document.querySelectorAll('.play-button').forEach(function (button) {
    button.addEventListener('click', function () {
      const target = button.dataset.target;
      const video = document.getElementById(target);
      startPlayback(video, button);
    });
  });

  document.querySelectorAll('.video-player').forEach(function (video) {
    video.addEventListener('click', function () {
      if (video.paused) {
        const shell = video.closest('.player-shell');
        const button = shell ? shell.querySelector('.play-button') : null;
        startPlayback(video, button);
      }
    });

    video.addEventListener('pause', function () {
      const shell = video.closest('.player-shell');

      if (shell) {
        shell.classList.remove('playing');
      }
    });

    video.addEventListener('play', function () {
      const shell = video.closest('.player-shell');

      if (shell) {
        shell.classList.add('playing');
      }
    });
  });
}());
