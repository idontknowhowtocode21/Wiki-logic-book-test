const axios = require('axios');
let forceActive = false;

export default async function handler(req, res) {
    const { url } = req;

    if (url.includes('/api/arm')) {
        forceActive = true;
        return res.send("<h1>SYSTEM ARMED</h1>");
    }
    if (url.includes('/api/status')) {
        return res.json({ active: forceActive });
    }

       
     try {
        const path = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${path}`;
        
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
            }
        });
        
        let html = response.data;

        // 1. THE STYLE FIXER: Force the browser to get CSS from the real Wikipedia
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        // 2. THE INJECTION: The ghost script
        const injection = `
            <script>
                setInterval(async () => {
                    try {
                        const r = await fetch('https://wiki-logic-book-test.vercel.app/api/status');
                        const d = await r.json();
                        if(d.active) {
                            document.body.innerHTML = "<div style='padding:40px; font-family:serif; text-align:center; background:white; height:100vh;'><h1>The King of Spades</h1><p>A symbol of sudden revelation and authority.</p></div>";
                        }
                    } catch(e) {}
                }, 2000);
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');

        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error: " + e.message);
    }

}
