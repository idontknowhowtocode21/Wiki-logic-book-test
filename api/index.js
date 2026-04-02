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
        // Force all internal links to stay on the Vercel Proxy
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <style>
                #magic-digit {
                    position: fixed;
                    bottom: 15px;
                    right: 15px;
                    font-size: 14px;
                    color: rgba(0,0,0,0.3); /* Discrete but visible */
                    background: rgba(255,255,255,0.7);
                    padding: 2px 6px;
                    border-radius: 4px;
                    z-index: 99999;
                    pointer-events: none;
                    font-family: sans-serif;
                    font-weight: bold;
                    display: block;
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
                
                // Keep digit hidden if already locked from a previous page
                if (state.locked) digitEl.style.display = 'none';

                window.addEventListener('scroll', () => {
                    const currY = window.pageYOffset || document.documentElement.scrollTop;
                    const max = document.documentElement.scrollHeight - window.innerHeight;

                    // 1. THE LOCK (Must have an N value first)
                    if (currY <= 0 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        digitEl.style.display = 'none';
                        if(navigator.vibrate) navigator.vibrate([40, 40]);
                        return;
                    }

                    // 2. PROGRAMMING (50px increments)
                    if (!state.locked) {
                        let tempN = Math.floor(currY / 50);
                        if (tempN > 15) tempN = 15;
                        if (tempN !== state.n && tempN >= 0) {
                            state.n = tempN;
                            if(navigator.vibrate) navigator.vibrate(10);
                        }
                    }

                    // 3. RESET (Absolute Bottom)
                    if (currY >= max - 2 && max > 100) {
                        localStorage.clear();
                        window.location.replace("https://${host}/wiki/Main_Page");
                    }
                });

                // 4. THE INTERCEPTOR
                window.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (!link) return;
                    
                    const href = link.getAttribute('href') || '';

                    // Reset on Home click
                    if (href.includes('Main_Page') || link.innerText.toLowerCase().includes('home')) {
                        localStorage.clear();
                        window.location.replace("https://${host}/wiki/Main_Page");
                        return;
                    }

                    // THE RANDOM FORCE
                    if (href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        const nextClick = state.clicks + 1;
                        state.clicks = nextClick;

                        if (nextClick >= state.n) {
                            window.location.replace("https://${host}/wiki/Mahatma_Gandhi");
                        } else {
                            window.location.replace("https://${host}/wiki/Special:Random?r=" + Math.random());
                        }
                    } 
                    // ROUTE ALL OTHER LINKS
                    else if (href.startsWith('/wiki/') || href.startsWith('https://en.m.wikipedia.org/wiki/')) {
                        e.preventDefault();
                        const path = href.replace('https://en.m.wikipedia.org', '');
                        window.location.replace("https://${host}" + path);
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
