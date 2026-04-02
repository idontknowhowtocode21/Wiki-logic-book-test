const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host;

    try {
        // CLEAN UP THE URL: If it's just the root, go to Main_Page
        const cleanPath = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${cleanPath}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        
        // Rewrite links to keep them on YOUR domain
        html = html.replace(/https:\/\/en.m.wikipedia.org/g, `https://${host}`);
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                const state = {
                    get n() { return parseInt(localStorage.getItem('wiki_n')) || 0 },
                    set n(val) { localStorage.setItem('wiki_n', val) },
                    get locked() { return localStorage.getItem('wiki_locked') === 'true' },
                    set locked(val) { localStorage.setItem('wiki_locked', val) },
                    get clicks() { return parseInt(localStorage.getItem('wiki_clicks')) || 0 },
                    set clicks(val) { localStorage.setItem('wiki_clicks', val) }
                };

                let lastY = window.scrollY;

                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;

                    if (currY >= max - 20) {
                        localStorage.clear();
                        return;
                    }

                    if (currY <= 5 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        return;
                    }

                    if (!state.locked && currY > lastY + 80) {
                        state.n++;
                        lastY = currY;
                    }
                });

                setInterval(() => {
                    if (!state.locked) return;
                    document.querySelectorAll('a[href*="Special:Random"]').forEach(link => {
                        if (link.dataset.hooked) return;
                        link.dataset.hooked = "true";
                        
                        // We hijack the click entirely
                        link.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            state.clicks++;
                            
                            if (state.clicks >= state.n) {
                                window.location.href = "/wiki/Mahatma_Gandhi";
                            } else {
                                window.location.href = "/wiki/Special:Random";
                            }
                        };
                    });
                }, 500);
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
