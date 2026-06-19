(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function loadHls(callback, onError) {
        if (window.Hls) {
            callback(window.Hls);
            return;
        }

        const existing = document.querySelector("script[data-hls-loader]");
        if (existing) {
            existing.addEventListener("load", function () {
                callback(window.Hls);
            });
            existing.addEventListener("error", onError);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
        script.async = true;
        script.dataset.hlsLoader = "true";
        script.addEventListener("load", function () {
            callback(window.Hls);
        });
        script.addEventListener("error", onError);
        document.head.appendChild(script);
    }

    function setupPlayer(shell) {
        const video = shell.querySelector("video[data-m3u8]");
        const button = shell.querySelector("[data-play-button]");
        const status = document.querySelector("[data-player-status]");
        if (!video || !button) {
            return;
        }

        const source = video.dataset.m3u8;
        let initialized = false;
        let hlsInstance = null;

        function setStatus(message) {
            if (status) {
                status.textContent = message;
            }
        }

        function playVideo() {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {
                    setStatus("浏览器阻止自动播放，请再次点击播放按钮");
                    shell.classList.remove("is-playing");
                });
            }
        }

        function attachNative() {
            video.src = source;
            video.addEventListener("loadedmetadata", playVideo, { once: true });
            video.load();
        }

        function attachHls(Hls) {
            if (!Hls || !Hls.isSupported()) {
                attachNative();
                return;
            }

            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90
            });

            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                playVideo();
            });
            hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                if (!data || !data.fatal) {
                    return;
                }

                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    setStatus("网络加载中断，正在重试播放源");
                    hlsInstance.startLoad();
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    setStatus("媒体解码异常，正在尝试恢复");
                    hlsInstance.recoverMediaError();
                } else {
                    setStatus("当前播放源暂时不可用，请刷新后重试");
                    hlsInstance.destroy();
                }
            });
        }

        function start() {
            shell.classList.add("is-playing");
            setStatus("正在加载高清播放源");

            if (initialized) {
                playVideo();
                return;
            }

            initialized = true;

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                attachNative();
            } else {
                loadHls(attachHls, function () {
                    setStatus("播放器组件加载失败，正在尝试原生播放");
                    attachNative();
                });
            }
        }

        button.addEventListener("click", start);
        video.addEventListener("play", function () {
            shell.classList.add("is-playing");
            setStatus("播放中");
        });
        video.addEventListener("pause", function () {
            if (!video.ended) {
                setStatus("已暂停");
            }
        });
        video.addEventListener("ended", function () {
            setStatus("播放结束");
            shell.classList.remove("is-playing");
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    ready(function () {
        document.querySelectorAll("[data-player-shell]").forEach(setupPlayer);
    });
})();
