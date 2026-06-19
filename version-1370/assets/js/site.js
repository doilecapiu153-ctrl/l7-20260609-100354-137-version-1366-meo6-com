import { H as Hls } from './hls-vendor.js';

const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function setupMobileMenu() {
  const header = select('.site-header');
  const button = select('.mobile-menu-button');
  if (!header || !button) {
    return;
  }

  button.addEventListener('click', () => {
    const isOpen = header.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
  });
}

function setupHeroCarousel() {
  const carousel = select('[data-hero-carousel]');
  if (!carousel) {
    return;
  }

  const slides = selectAll('[data-hero-slide]', carousel);
  const dots = selectAll('[data-hero-dot]', carousel);
  const prev = select('[data-hero-prev]', carousel);
  const next = select('[data-hero-next]', carousel);
  let current = 0;
  let timer = null;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  };

  const start = () => {
    if (slides.length < 2) {
      return;
    }
    timer = window.setInterval(() => show(current + 1), 5000);
  };

  const restart = () => {
    if (timer) {
      window.clearInterval(timer);
    }
    start();
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      show(index);
      restart();
    });
  });

  if (prev) {
    prev.addEventListener('click', () => {
      show(current - 1);
      restart();
    });
  }

  if (next) {
    next.addEventListener('click', () => {
      show(current + 1);
      restart();
    });
  }

  start();
}

function setupImageFallbacks() {
  selectAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.style.opacity = '0';
      const frame = image.closest('.poster-frame, .rank-cover, .hero-poster, .player-shell');
      if (frame) {
        frame.classList.add('image-missing');
      }
    }, { once: true });
  });
}

function setupLocalFilters() {
  const panels = selectAll('[data-filter-panel]');
  panels.forEach((panel) => {
    const list = select('[data-filter-list]');
    const searchInput = select('[data-local-filter]', panel);
    const clearButton = select('[data-clear-filter]', panel);
    const buttons = selectAll('[data-filter-type], [data-filter-genre], [data-filter-all]', panel);
    let activeType = '';
    let activeGenre = '';

    if (!list) {
      return;
    }

    const cards = selectAll('.movie-card', list);

    const apply = () => {
      const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      cards.forEach((card) => {
        const haystack = [
          card.dataset.title,
          card.dataset.year,
          card.dataset.region,
          card.dataset.genre,
          card.dataset.type
        ].join(' ').toLowerCase();
        const matchesKeyword = !keyword || haystack.includes(keyword);
        const matchesType = !activeType || card.dataset.type === activeType;
        const matchesGenre = !activeGenre || card.dataset.genre === activeGenre;
        card.classList.toggle('is-hidden', !(matchesKeyword && matchesType && matchesGenre));
      });
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.hasAttribute('data-filter-all')) {
          activeType = '';
          activeGenre = '';
          buttons.forEach((item) => item.classList.remove('is-active'));
          button.classList.add('is-active');
        } else if (button.hasAttribute('data-filter-type')) {
          activeType = button.dataset.filterType || '';
          selectAll('[data-filter-type]', panel).forEach((item) => item.classList.remove('is-active'));
          button.classList.add('is-active');
          const allButton = select('[data-filter-all]', panel);
          if (allButton) {
            allButton.classList.remove('is-active');
          }
        } else if (button.hasAttribute('data-filter-genre')) {
          activeGenre = button.dataset.filterGenre || '';
          selectAll('[data-filter-genre]', panel).forEach((item) => item.classList.remove('is-active'));
          button.classList.add('is-active');
          const allButton = select('[data-filter-all]', panel);
          if (allButton) {
            allButton.classList.remove('is-active');
          }
        }
        apply();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', apply);
    }

    if (clearButton) {
      clearButton.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
        }
        activeType = '';
        activeGenre = '';
        buttons.forEach((item) => item.classList.remove('is-active'));
        const allButton = select('[data-filter-all]', panel);
        if (allButton) {
          allButton.classList.add('is-active');
        }
        apply();
      });
    }
  });
}

function setupPlayers() {
  selectAll('[data-player]').forEach((player) => {
    const video = select('video[data-source]', player);
    const startButton = select('[data-player-start]', player);
    const status = select('[data-player-status]', player);

    if (!video || !startButton) {
      return;
    }

    const source = video.dataset.source || '';
    let hlsInstance = null;

    const setStatus = (message) => {
      if (status) {
        status.textContent = message;
      }
    };

    const attachSource = () => {
      if (video.dataset.ready === 'true') {
        return;
      }

      if (!source) {
        setStatus('视频源暂不可用');
        return;
      }

      if (Hls && Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('视频源加载完成');
        });
        hlsInstance.on(Hls.Events.ERROR, (eventName, data) => {
          if (data && data.fatal) {
            setStatus('视频加载失败，请稍后重试');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setStatus('视频源加载完成');
      } else {
        video.src = source;
        setStatus('正在尝试使用浏览器播放');
      }

      video.dataset.ready = 'true';
    };

    const play = () => {
      attachSource();
      player.classList.add('is-playing');
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => {
          setStatus('请再次点击播放器开始播放');
        });
      }
    };

    startButton.addEventListener('click', play);
    video.addEventListener('click', () => {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener('play', () => player.classList.add('is-playing'));
    video.addEventListener('pause', () => setStatus('已暂停'));
    window.addEventListener('beforeunload', () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
}

function getQuery() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('q') || '').trim();
}

function movieCardTemplate(movie) {
  const tags = (movie.tags || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  return `
<article class="movie-card" data-title="${escapeHtml(movie.title)}" data-year="${escapeHtml(movie.year)}" data-region="${escapeHtml(movie.region)}" data-genre="${escapeHtml(movie.genre)}" data-type="${escapeHtml(movie.type)}">
  <a class="poster-frame" href="${movie.url}" aria-label="观看 ${escapeHtml(movie.title)}">
    <img src="${movie.cover}" alt="${escapeHtml(movie.title)} 海报" loading="lazy">
    <span class="poster-fallback">${escapeHtml(movie.type)}</span>
    <span class="play-mark" aria-hidden="true">▶</span>
    <span class="duration-badge">${escapeHtml(movie.duration)}</span>
  </a>
  <div class="movie-card-body">
    <div class="movie-card-meta">
      <a href="${movie.categoryUrl}">${escapeHtml(movie.categoryName)}</a>
      <span>${escapeHtml(movie.year)}</span>
      <span>${escapeHtml(movie.region)}</span>
    </div>
    <h3><a href="${movie.url}">${escapeHtml(movie.title)}</a></h3>
    <p>${escapeHtml(movie.oneLine)}</p>
    <div class="tag-row">${tags}</div>
    <div class="metric-row">
      <span>热度 ${escapeHtml(String(movie.rating))}</span>
      <span>${escapeHtml(movie.viewsText)} 次浏览</span>
    </div>
  </div>
</article>`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

function setupSearchPage() {
  const results = select('[data-search-results]');
  const input = select('[data-search-input]');
  const form = select('[data-search-form]');
  const title = select('[data-search-title]');
  const count = select('[data-search-count]');
  const movies = window.MOVIE_SEARCH_INDEX || [];

  if (!results || !input || !movies.length) {
    return;
  }

  const render = (keyword) => {
    const normalized = keyword.trim().toLowerCase();
    const matched = normalized
      ? movies.filter((movie) => movie.searchText.includes(normalized)).slice(0, 120)
      : movies.slice(0, 24);

    results.innerHTML = matched.map(movieCardTemplate).join('');
    setupImageFallbacks();

    if (title) {
      title.textContent = normalized ? `“${keyword}”的搜索结果` : '推荐内容';
    }
    if (count) {
      count.textContent = normalized ? `找到 ${matched.length} 条匹配内容。` : '输入关键词后会在本页展示匹配结果。';
    }
  };

  const initialQuery = getQuery();
  if (initialQuery) {
    input.value = initialQuery;
  }
  render(initialQuery);

  input.addEventListener('input', () => render(input.value));

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = input.value.trim();
      const url = query ? `${window.location.pathname}?q=${encodeURIComponent(query)}` : window.location.pathname;
      window.history.replaceState({}, '', url);
      render(query);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupHeroCarousel();
  setupImageFallbacks();
  setupLocalFilters();
  setupPlayers();
  setupSearchPage();
});
