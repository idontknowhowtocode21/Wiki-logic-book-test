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
                let scrollCount = 0;
                let lastScrollY = 0;
                let isLocked = false;
                const scrollThreshold = 100; // Pixels required to count as 'one scroll'

                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

                    // 1. RESET: Scroll to the very bottom
                    if (currY >= maxScroll - 5) {
                        scrollCount = 0;
                        isLocked = false;
                        return;
                    }

                    // 2. LOCK: Scroll to the very top
                    if (currY <= 2 && scrollCount > 0) {
                        isLocked = true;
                        return;
                    }

                    // 3. COUNT: Increment on down-scroll only if not locked
                    if (!isLocked && currY > lastScrollY + scrollThreshold) {
                        scrollCount++;
                        lastScrollY = currY;
                        // Max force number of 5 as per your previous rules
                        if (scrollCount > 5) scrollCount = 5; 
                    }
                });

                // HIJACK THE RANDOMIZER
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    // We only trigger if the count matches and we are locked
                    if (link && link.href.includes('Special:Random') && isLocked) {
                        e.preventDefault();
                        // You can change this URL to your desired force page
                        window.location.href = "/wiki/Mahatma_Gandhi";
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
