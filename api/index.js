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
        html = html.replace(/https:\/\/en.m.wikipedia.org/g, `https://${host}`);
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                // Clear state if we are truly starting over
                if (window.location.pathname.endsWith('Main_Page')) {
                    localStorage.setItem('m_c', '0');
                }

                const state = {
                    get n() { return parseInt(localStorage.getItem('m_n')) || 0 },
                    set n(v) { localStorage.setItem('m_n', v) },
                    get locked() { return localStorage.getItem('wiki_locked') === 'true' },
                    set locked(v) { localStorage.setItem('wiki_locked', v) },
                    get clicks() { return parseInt(localStorage.getItem('m_c')) || 0 },
                    set clicks(v) { localStorage.setItem('m_c', v) }
                };

                // 1. THE INPUT: Capture ALL clicks and check if they hit a heading/title
                window.addEventListener('click', (e) => {
                    if (state.locked) return;

                    // If you tap a Heading (H1, H2) or the Featured Box
                    const isHeader = e.target.closest('h1, h2, .content, #section_0');
                    if (isHeader) {
                        state.n++;
                        console.log("N updated: " + state.n);
                        if(window.navigator.vibrate) window.navigator.vibrate(15);
                    }
                }, true);

                // 2. THE LOCK: Scroll to Top
                window.addEventListener('scroll', () => {
                    if (window.scrollY <= 2 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        if(window.navigator.vibrate) window.navigator.vibrate([30, 30]);
                    }
                    // RESET: Scroll to bottom
                    if (window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 5) {
                        localStorage.clear();
                        window.location.reload();
                    }
                });

                // 3. THE HIJACK: High-priority capture listener
                window.addEventListener('click', (e) => {
                    const a = e.target.closest('a');
                    if (a && a.href.includes('Special:Random') && state.locked) {
                        // Kill the original Wikipedia event
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        state.clicks++;
                        
                        if (state.clicks >= state.n) {
                            window.location.href = "https://${host}/wiki/Mahatma_Gandhi";
                        } else {
                            window.location.href = "https://${host}/wiki/Special:Random";
                        }
                    }
                }, true); // The 'true' here is the secret to winning the priority battle
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
