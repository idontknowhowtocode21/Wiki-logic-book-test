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
                    position: fixed; bottom: 15px; right: 15px;
                    font-size: 14px; color: rgba(0,0,0,0.4);
                    background: rgba(255,255,255,0.8);
                    padding: 2px 6px; border-radius: 4px;
                    z-index: 2147483647; pointer-events: none;
                    font-family: sans-serif; font-weight: bold;
                }
            </style>
            <div id="magic-digit">0</div>

            <script>
                // Use sessionStorage for better reliability across "app-like" navigations
                const getVal = (k) => localStorage.getItem(k);
                const setVal = (k, v) => localStorage.setItem(k, v);

                const state = {
                    get n() { return parseInt(getVal('m_n')) || 0 },
                    set n(v) { setVal('m_n', v); document.getElementById('magic-digit').innerText = v; },
                    get locked() { return getVal('m_l') === 'true' },
                    set locked(v) { setVal('m_l', v) },
                    get clicks() { return parseInt(getVal('m_c')) || 0 },
                    set clicks(v) { setVal('m_c', v) }
                };

                const digitEl = document.getElementById('magic-digit');
                if (state.locked) digitEl.style.display = 'none';

                // 1. IMPROVED SCROLL SENSITIVITY (50px)
                window.addEventListener('scroll', () => {
                    const currY = window.pageYOffset || document.documentElement.scrollTop;
                    
                    if (currY <= 0 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        digitEl.style.display = 'none';
                        if(navigator.vibrate) navigator.vibrate([40, 40]);
                        return;
                    }

                    if (!state.locked) {
                        let tempN = Math.floor(currY / 50);
                        if (tempN > 15) tempN = 15;
                        if (tempN !== state.n) {
                            state.n = tempN;
                            if(navigator.vibrate) navigator.vibrate(10);
                        }
                    }
                });

                // 2. THE HARD INTERCEPTOR
                // We use 'mousedown' because it fires BEFORE Wikipedia's internal 'click' handlers
                window.addEventListener('mousedown', (e) => {
                    const link = e.target.closest('a');
                    if (!link) return;
                    
                    const href = link.getAttribute('href') || '';

                    // RESET
                    if (href.includes('Main_Page') || link.innerText.toLowerCase().includes('home')) {
                        localStorage.clear();
                        window.location.replace("https://${host}/wiki/Main_Page");
                        return;
                    }

                    // THE RANDOM FORCE (The "Hammer")
                    if (href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        let c = state.clicks + 1;
                        state.clicks = c;

                        if (c >= state.n) {
                            window.location.replace("https://${host}/wiki/Mahatma_Gandhi");
                        } else {
                            window.location.replace("https://${host}/wiki/Special:Random?unique=" + Date.now());
                        }
                    } 
                    // PROTECT DOMAIN
                    else if (href.startsWith('/wiki/') || href.startsWith('https://en.m.wikipedia.org/wiki/')) {
                        e.preventDefault();
                        const path = href.replace('https://en.m.wikipedia.org', '');
                        window.location.replace("https://${host}" + path);
                    }
                }, true);

                // 3. FAIL-SAFE: If Wikipedia tries to navigate via JS/AJAX, we catch it here
                window.addEventListener('unload', () => {
                    // This ensures state is pushed to disk before the page dies
                });
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
