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
                let lockedNumber = 1;
                let scrollTimer = null;

                window.addEventListener('scroll', () => {
                    clearTimeout(scrollTimer);
                    
                    // Calculate scroll percentage (0 to 100)
                    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
                    
                    // Map percentage to a number 1-5
                    // 0-20%=1, 21-40%=2, 41-60%=3, 61-80%=4, 81-100%=5
                    lockedNumber = Math.ceil(scrollPercent / 20) || 1;

                    // 'Lock' the number after 1 second of no scrolling
                    scrollTimer = setTimeout(() => {
                        console.log("Number Locked at: " + lockedNumber);
                        // Optional: Tiny vibration to confirm the lock for the magician
                        if(window.navigator.vibrate) window.navigator.vibrate(10);
                        
                        // Update the UI Number visually
                        const bodyHtml = document.body.innerHTML;
                        if (bodyHtml.includes("6,1")) {
                             document.body.innerHTML = bodyHtml.replace(/6,1/g, "6," + lockedNumber);
                        }
                    }, 1000);
                });

                // Hijack the Randomizer
                setInterval(() => {
                    const links = document.querySelectorAll('a');
                    links.forEach(link => {
                        if (link.href.includes('Special:Random')) {
                            link.href = "/wiki/Mahatma_Gandhi";
                        }
                    });
                }, 2000);
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
