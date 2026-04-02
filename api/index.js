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
        
        // 1. PIXEL PERFECT: Pull all CSS, Fonts, and Icons directly from Wikipedia
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                // We use localStorage so the count follows the spectator through random pages
                const state = {
                    get n() { return parseInt(localStorage.getItem('m_n')) || 0 },
                    set n(v) { localStorage.setItem('m_n', v) },
                    get locked() { return localStorage.getItem('m_l') === 'true' },
                    set locked(v) { localStorage.setItem('m_l', v) },
                    get clicks() { return parseInt(localStorage.getItem('m_c')) || 0 },
                    set clicks(v) { localStorage.setItem('m_c', v) }
                };

                // 1. PROGRAMMING: Tap the Featured Article title
                document.addEventListener('click', (e) => {
                    if (state.locked) return;
                    if (e.target.closest('#section_0, .header-container')) {
                        state.n++;
                        if(navigator.vibrate) navigator.vibrate(12);
                    }
                }, true);

                // 2. LOCK: Scroll to top
                window.addEventListener('scroll', () => {
                    if (window.scrollY <= 1 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        if(navigator.vibrate) navigator.vibrate([30, 30]);
                    }
                });

                // 3. THE INTERCEPTOR: Capture EVERY click on the page
                window.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    
                    // If they click 'Random' and we are locked...
                    if (link && link.href.includes('Special:Random') && state.locked) {
                        // STOP Wikipedia from taking over
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        state.clicks++;
                        
                        // Force redirect through YOUR Vercel proxy
                        if (state.clicks >= state.n) {
                            window.location.href = "https://${host}/wiki/Mahatma_Gandhi";
                        } else {
                            window.location.href = "https://${host}/wiki/Special:Random?t=" + Date.now();
                        }
                    }
                }, true); // 'true' means we catch the click BEFORE Wikipedia's scripts do
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
