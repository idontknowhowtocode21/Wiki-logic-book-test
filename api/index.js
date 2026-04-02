const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host; // This gets your 'wiki-logic-book-test.vercel.app'

    try {
        const path = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${path}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        
        // 1. DOMAIN HIJACK: Replace all Wikipedia links with YOUR Vercel links
        // This keeps the script running even if they click 100 links
        html = html.replace(/https:\/\/en.m.wikipedia.org/g, `https://${host}`);
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                // We use localStorage instead of sessionStorage for better persistence
                let n = parseInt(localStorage.getItem('targetN')) || 0;
                let locked = localStorage.getItem('isLocked') === 'true';
                let clicks = parseInt(localStorage.getItem('clickCount')) || 0;
                let lastY = window.scrollY;

                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;

                    if (currY >= max - 20) {
                        localStorage.clear();
                        n = 0; locked = false; clicks = 0;
                        console.log("RESET");
                        return;
                    }

                    if (currY <= 5 && n > 0 && !locked) {
                        locked = true;
                        localStorage.setItem('isLocked', 'true');
                        console.log("LOCKED AT: " + n);
                        return;
                    }

                    if (!locked && currY > lastY + 70) {
                        n++;
                        lastY = currY;
                        localStorage.setItem('targetN', n);
                        console.log("TARGET: " + n);
                    }
                });

                // AGGRESSIVE CLICK INTERCEPT
                document.addEventListener('click', (e) => {
                    const a = e.target.closest('a');
                    if (a && a.href.includes('Special:Random') && localStorage.getItem('isLocked') === 'true') {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        clicks++;
                        localStorage.setItem('clickCount', clicks);
                        
                        let targetN = parseInt(localStorage.getItem('targetN'));
                        
                        if (clicks >= targetN) {
                            window.location.href = "https://${host}/wiki/Mahatma_Gandhi";
                        } else {
                            window.location.href = "https://${host}/wiki/Special:Random";
                        }
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
