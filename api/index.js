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
                    bottom: 12px;
                    right: 12px;
                    font-size: 11px;
                    color: #cccccc;
                    z-index: 10000;
                    pointer-events: none;
                    font-family: -apple-system, sans-serif;
                    opacity: 0.5;
                    font-weight: bold;
                }
            </style>
            <div id="magic-digit">0</div>

            <script>
                const state = {
                    get n() { return parseInt(localStorage.getItem('m_n')) || 0 },
                    set n(v) { localStorage.setItem('m_n', v) },
                    get locked() { return localStorage.getItem('m_l') === 'true' },
                    set locked(v) { localStorage.setItem('m_l', v) },
                    get clicks() { return parseInt(localStorage.getItem('m_c')) || 0 },
                    set clicks(v) { localStorage.setItem('m_c', v) }
                };

                const digitEl = document.getElementById('magic-digit');

                // 1. MICRO-SCROLL LOGIC
                window.addEventListener('scroll', () => {
                    if (state.locked) return;

                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;

                    // FAST INCREMENT: 1 number per 80px (about 1 inch of thumb movement)
                    let tempN = Math.floor(currY / 80);
                    if (tempN > 9) tempN = 9; // Cap at 9 for safety
                    
                    if (tempN !== state.n && tempN >= 0) {
                        state.n = tempN;
                        digitEl.innerText = state.n;
                        // Vibration tick so you don't have to look
                        if(navigator.vibrate) navigator.vibrate(12);
                    }

                    // 2. THE LOCK: Fast Scroll to the absolute TOP
                    if (currY <= 2 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        digitEl.style.display = 'none'; // Digit vanishes immediately
                        if(navigator.vibrate) navigator.vibrate([40, 40]); // Double buzz for lock
                    }

                    // 3. THE RESET: Scroll to BOTTOM
                    if (currY >= max - 5 && max > 100) {
                        localStorage.clear();
                        window.location.reload();
                    }
                });

                // 4. THE INTERCEPTOR
                window.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (!link) return;
                    const href = link.getAttribute('href') || '';

                    if (href.includes('Main_Page') || link.innerText.toLowerCase().includes('home')) {
                        e.preventDefault();
                        localStorage.clear();
                        window.location.href = "https://${host}/wiki/Main_Page";
                        return;
                    }

                    if (href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        state.clicks++;
                        
                        if (state.clicks >= state.n) {
                            window.location.href = "https://${host}/wiki/Mahatma_Gandhi";
                        } else {
                            window.location.href = "https://${host}/wiki/Special:Random?t=" + Date.now();
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
