const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host;

    try {
        const path = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${path}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        
        // Rewrite all Wikipedia links to stay on your Vercel proxy
        html = html.replace(/https:\/\/en.m.wikipedia.org/g, `https://${host}`);
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                // Use localStorage so the state survives page navigations
                const state = {
                    get n() { return parseInt(localStorage.getItem('wiki_n')) || 0 },
                    set n(val) { localStorage.setItem('wiki_n', val) },
                    get locked() { return localStorage.getItem('wiki_locked') === 'true' },
                    set locked(val) { localStorage.setItem('wiki_locked', val) },
                    get clicks() { return parseInt(localStorage.getItem('wiki_clicks')) || 0 },
                    set clicks(val) { localStorage.setItem('wiki_clicks', val) }
                };

                let lastY = window.scrollY;

                // 1. THE SENSOR: Tracks flicks, locks at top, resets at bottom
                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;

                    if (currY >= max - 20) {
                        localStorage.clear();
                        console.log("CLEARED");
                        return;
                    }

                    if (currY <= 5 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        if(window.navigator.vibrate) window.navigator.vibrate(20);
                        return;
                    }

                    if (!state.locked && currY > lastY + 80) {
                        state.n++;
                        lastY = currY;
                        console.log("N is now: " + state.n);
                    }
                });

                // 2. THE HIJACKER: Uses a MutationObserver to beat Wikipedia's scripts
                const observer = new MutationObserver(() => {
                    if (!state.locked) return;

                    const randomLinks = document.querySelectorAll('a[href*="Special:Random"]');
                    randomLinks.forEach(link => {
                        // Kill Wikipedia's internal listeners
                        const newLink = link.cloneNode(true);
                        link.parentNode.replaceChild(newLink, link);

                        newLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            state.clicks++;
                            console.log("Click count: " + state.clicks);

                            if (state.clicks >= state.n) {
                                window.location.href = "https://${host}/wiki/Mahatma_Gandhi";
                            } else {
                                window.location.href = "https://${host}/wiki/Special:Random";
                            }
                        }, true);
                    });
                });

                observer.observe(document.body, { childList: true, subtree: true });
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
