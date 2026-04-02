const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host;

    try {
        const cleanPath = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${cleanPath}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        html = html.replace(/https:\/\/en.m.wikipedia.org/g, `https://${host}`);
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                // 1. FRESH START: Reset clicks if we are back at the start of the trick
                if (window.location.pathname === '/wiki/Main_Page' || window.location.pathname === '/') {
                    localStorage.setItem('m_c', '0');
                }

                const state = {
                    get n() { return parseInt(localStorage.getItem('m_n')) || 0 },
                    set n(v) { localStorage.setItem('m_n', v) },
                    get locked() { return localStorage.getItem('m_l') === 'true' },
                    set locked(v) { localStorage.setItem('m_l', v) },
                    get clicks() { return parseInt(localStorage.getItem('m_c')) || 0 },
                    set clicks(v) { localStorage.setItem('m_c', v) }
                };

                let lastY = window.scrollY;
                let lastClickTime = 0;

                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;
                    if (currY >= max - 10) { localStorage.clear(); return; }
                    if (currY <= 5 && state.n > 0 && !state.locked) { 
                        state.locked = true; 
                        return; 
                    }
                    if (!state.locked && currY > lastY + 80) {
                        state.n++;
                        lastY = currY;
                    }
                });

                window.onclick = function(e) {
                    const a = e.target.closest('a');
                    if (a && a.href.includes('Special:Random') && state.locked) {
                        
                        // DEBOUNCE: Ignore clicks happening within 1000ms (1 second)
                        const now = Date.now();
                        if (now - lastClickTime < 1000) return false;
                        lastClickTime = now;

                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        state.clicks++;
                        
                        // LOGIC: If we hit the target, go to Gandhi
                        if (state.clicks >= state.n) {
                            window.location.replace("https://${host}/wiki/Mahatma_Gandhi");
                        } else {
                            window.location.replace("https://${host}/wiki/Special:Random");
                        }
                        return false;
                    }
                };
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
