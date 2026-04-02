const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host;

    try {
        const cleanPath = (url === '/' || url === '/api' || url === '/api/index.js') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${cleanPath}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        
        // Ensure all links stay on your proxy
        html = html.replace(/https:\/\/en.m.wikipedia.org/g, `https://${host}`);
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                const state = {
                    get n() { return parseInt(localStorage.getItem('w_n')) || 0 },
                    set n(v) { localStorage.setItem('w_n', v) },
                    get locked() { return localStorage.getItem('w_l') === 'true' },
                    set locked(v) { localStorage.setItem('w_l', v) },
                    get clicks() { return parseInt(localStorage.getItem('w_c')) || 0 },
                    set clicks(v) { localStorage.setItem('w_c', v) }
                };

                let lastY = window.scrollY;

                // 1. INPUT SYSTEM
                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;

                    if (currY >= max - 15) { localStorage.clear(); return; }
                    if (currY <= 5 && state.n > 0 && !state.locked) { 
                        state.locked = true; 
                        return; 
                    }
                    if (!state.locked && currY > lastY + 80) {
                        state.n++;
                        lastY = currY;
                    }
                });

                // 2. THE NUCLEAR HIJACK: Intercept the actual URL change
                const originalAssign = window.location.assign;
                const handleNav = (url) => {
                    if (state.locked && url.includes('Special:Random')) {
                        state.clicks++;
                        if (state.clicks >= state.n) {
                            window.location.href = "/wiki/Mahatma_Gandhi";
                            return true;
                        }
                    }
                    return false;
                };

                // Watch for any link clicks globally
                document.addEventListener('click', (e) => {
                    const a = e.target.closest('a');
                    if (a && a.href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopPropagation();
                        state.clicks++;
                        if (state.clicks >= state.n) {
                            window.location.replace("/wiki/Mahatma_Gandhi");
                        } else {
                            window.location.replace("/wiki/Special:Random");
                        }
                    }
                }, true);

                // Hijack Wikipedia's internal AJAX calls
                const open = window.XMLHttpRequest.prototype.open;
                window.XMLHttpRequest.prototype.open = function(method, url) {
                    if (state.locked && url.includes('Special:Random') && state.clicks + 1 >= state.n) {
                        // If Wikipedia tries to fetch a random page via AJAX, we force a hard redirect
                        window.location.href = "/wiki/Mahatma_Gandhi";
                    }
                    return open.apply(this, arguments);
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
