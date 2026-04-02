const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host; // Dynamically gets your Vercel URL

    try {
        const cleanPath = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${cleanPath}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        
        // 1. STYLES: Pull CSS/Fonts from Wiki, but keep the Logic on Vercel
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                const state = {
                    get n() { return parseInt(localStorage.getItem('m_n')) || 0 },
                    set n(v) { localStorage.setItem('m_n', v) },
                    get locked() { return localStorage.getItem('m_l') === 'true' },
                    set locked(v) { localStorage.setItem('m_l', v) },
                    get clicks() { return parseInt(localStorage.getItem('m_c')) || 0 },
                    set clicks(v) { localStorage.setItem('m_c', v) }
                };

                // 1. INPUT: Tap Title
                document.addEventListener('click', (e) => {
                    if (state.locked) return;
                    if (e.target.closest('#section_0, .header-container')) {
                        state.n++;
                        if(navigator.vibrate) navigator.vibrate(12);
                    }
                }, true);

                // 2. LOCK: Scroll Top
                window.addEventListener('scroll', () => {
                    if (window.scrollY <= 1 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        if(navigator.vibrate) navigator.vibrate([30, 30]);
                    }
                });

                // 3. THE IRON CAGE: Intercept EVERY link click on the entire site
                window.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (!link) return;

                    const href = link.getAttribute('href');
                    if (!href) return;

                    // SPECIAL CASE: The Random Force
                    if (href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        state.clicks++;
                        if (state.clicks >= state.n) {
                            window.location.href = "https://${host}/wiki/Mahatma_Gandhi";
                        } else {
                            window.location.href = "https://${host}/wiki/Special:Random?t=" + Date.now();
                        }
                        return;
                    }

                    // GENERAL CASE: All other links (Home, Search, etc.)
                    // If it's a Wikipedia link, rewrite it to stay on Vercel
                    if (href.startsWith('/wiki/') || href.startsWith('https://en.m.wikipedia.org/wiki/')) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        // Extract the path (e.g., /wiki/Main_Page)
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
