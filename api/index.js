const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host;

    try {
        const cleanPath = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${cleanPath}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <style>
                #magic-digit {
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    font-size: 11px;
                    color: #bbb;
                    z-index: 10000;
                    pointer-events: none;
                    font-family: sans-serif;
                    opacity: 0.4;
                    font-weight: bold;
                }
            </style>
            <div id="magic-digit">0</div>

            <script>
                const state = {
                    get n() { return parseInt(localStorage.getItem('m_n')) || 0 },
                    set n(v) { localStorage.setItem('m_n', v); document.getElementById('magic-digit').innerText = v; },
                    get locked() { return localStorage.getItem('m_l') === 'true' },
                    set locked(v) { localStorage.setItem('m_l', v) },
                    get clicks() { return parseInt(localStorage.getItem('m_c')) || 0 },
                    set clicks(v) { localStorage.setItem('m_c', v) }
                };

                const digitEl = document.getElementById('magic-digit');
                if (state.locked) digitEl.style.display = 'none';

                // 1. IMPROVED SCROLL LOGIC
                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;

                    // LOCKING MECHANISM: Hit the absolute top
                    if (currY <= 0 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        digitEl.style.display = 'none';
                        if(navigator.vibrate) navigator.vibrate([40, 40]);
                        console.log("LOCKED AT: " + state.n);
                        return;
                    }

                    // PROGRAMMING: Only if NOT locked
                    if (!state.locked) {
                        // 50px sensitivity per number
                        let tempN = Math.floor(currY / 50);
                        if (tempN > 9) tempN = 9;
                        
                        if (tempN !== state.n && tempN >= 0) {
                            state.n = tempN;
                            if(navigator.vibrate) navigator.vibrate(10);
                        }
                    }

                    // RESET: Hit the bottom
                    if (currY >= max - 5 && max > 100) {
                        localStorage.clear();
                        window.location.reload();
                    }
                });

                // 2. THE INTERCEPTOR
                window.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (!link) return;
                    const href = link.getAttribute('href') || '';

                    // RESET ON HOME
                    if (href.includes('Main_Page') || link.innerText.toLowerCase().includes('home')) {
                        e.preventDefault();
                        localStorage.clear();
                        window.location.href = "https://${host}/wiki/Main_Page";
                        return;
                    }

                    // THE FORCE
                    if (href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        state.clicks++;
                        console.log("Try number: " + state.clicks);
                        
                        if (state.clicks >= state.n) {
                            window.location.href = "https://${host}/wiki/Mahatma_Gandhi";
                        } else {
                            window.location.href = "https://${host}/wiki/Special:Random?cache=" + Date.now();
                        }
                    } else if (href.startsWith('/wiki/') || href.startsWith('https://en.m.wikipedia.org/wiki/')) {
                        e.preventDefault();
                        const path = href.replace('https://en.m.wikipedia.org', '');
                        window.location.href = "https://${host}" + path;
                    }
                }, true);
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
