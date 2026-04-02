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
                let currentForceNum = 1;

                // Function to find and replace the number in the UI without breaking the page
                function updateUiNumber(newNum) {
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                    let node;
                    while(node = walker.nextNode()) {
                        if (node.nodeValue.includes("6,1") || node.nodeValue.includes("6," + currentForceNum)) {
                            node.nodeValue = node.nodeValue.replace(/6,[1-5]/g, "6," + newNum);
                            currentForceNum = newNum;
                        }
                    }
                }

                window.addEventListener('scroll', () => {
                    // Calculate 1-5 based on scroll position
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    const scrollPercent = (window.scrollY / maxScroll) * 100;
                    const newNum = Math.ceil(scrollPercent / 20) || 1;

                    if (newNum !== currentForceNum && newNum <= 5) {
                        updateUiNumber(newNum);
                    }
                });

                // Hijack the Random button to always load Gandhi
                setInterval(() => {
                    document.querySelectorAll('a').forEach(link => {
                        if (link.href.includes('Special:Random')) {
                            link.href = "/wiki/Mahatma_Gandhi";
                        }
                    });
                }, 1000);
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
