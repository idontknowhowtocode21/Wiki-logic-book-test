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
        // If the URL is just '/', we fetch the Main Page
        const path = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${path}`;
        
        const response = await axios.get(targetUrl);
        let html = response.data;

        // INJECTION
        const injection = `
            <script>
                setInterval(async () => {
                    try {
                        const r = await fetch('/api/status');
                        const d = await r.json();
                        if(d.active) {
                            document.body.innerHTML = "<div style='padding:40px; font-family:serif; text-align:center;'><h1>The King of Spades</h1><p>A symbol of sudden revelation and authority.</p></div>";
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
