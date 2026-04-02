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
                // 1. KILL SERVICE WORKERS (This stops Wikipedia from bypassing us)
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => {
                        for(let reg of regs) reg.unregister();
                    });
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

                // 2. THE HARD HIJACK (Intercepts everything)
                window.onclick = function(e) {
                    const a = e.target.closest('a');
                    if (a && a.href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        state.clicks++;
                        if (state.clicks >= state.n) {
                            // FORCE RELOAD TO GANDHI
                            window.location.replace("https://${host}/wiki/Mahatma_Gandhi");
                        } else {
                            window.location.replace("https://${host}/wiki/Special:Random");
                        }
                        return false;
                    }
                };

                // 3. BACKUP HIJACK: Catch background navigations
                window.addEventListener('unload', () => {
                   if (state.locked && document.activeElement && document.activeElement.href.includes('Special:Random')) {
                       // This is a last-ditch effort if the click handler was bypassed
                   }
                });
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
