const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    try {
        const path = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${path}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                // persistent state across page loads
                let targetN = parseInt(sessionStorage.getItem('targetN')) || 0;
                let isLocked = sessionStorage.getItem('isLocked') === 'true';
                let clickCount = parseInt(sessionStorage.getItem('clickCount')) || 0;
                let lastY = window.scrollY;

                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;

                    // RESET: Hit bottom
                    if (currY >= max - 10) {
                        targetN = 0;
                        isLocked = false;
                        clickCount = 0;
                        sessionStorage.clear();
                        return;
                    }

                    // LOCK: Hit top
                    if (currY <= 5 && targetN > 0) {
                        isLocked = true;
                        sessionStorage.setItem('isLocked', 'true');
                        return;
                    }

                    // COUNT FLICKS: Scroll down
                    if (!isLocked && currY > lastY + 80) {
                        targetN++;
                        lastY = currY;
                        sessionStorage.setItem('targetN', targetN.toString());
                    }
                });

                // INTERCEPT CLICKS
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (link && link.href.includes('Special:Random') && isLocked) {
                        e.preventDefault();
                        
                        // Increment how many times they have clicked 'Random'
                        clickCount++;
                        sessionStorage.setItem('clickCount', clickCount.toString());

                        if (clickCount >= targetN) {
                            // The Force: Gandhi on the Nth try
                            window.location.href = "/wiki/Mahatma_Gandhi";
                        } else {
                            // Normal Behavior: Go to a real random page for tries 1 to N-1
                            window.location.href = "https://en.m.wikipedia.org/wiki/Special:Random";
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
