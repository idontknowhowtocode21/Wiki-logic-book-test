const axios = require('axios');

// We use a global variable to store the 'Force' state
// Note: In serverless, this resets occasionally, which is fine for a 10-min trick!
let forceActive = false;

export default async function handler(req, res) {
    const { url } = req;

    // 1. THE TRIGGER
    if (url.includes('/arm')) {
        forceActive = true;
        return res.send("<h1>SYSTEM ARMED</h1>");
    }
    if (url.includes('/status')) {
        return res.json({ active: forceActive });
    }

    // 2. THE PROXY
    try {
        const targetUrl = `https://en.m.wikipedia.org${url}`;
        const response = await axios.get(targetUrl);
        let html = response.data;

        const injection = `
            <script>
                setInterval(async () => {
                    const r = await fetch('/api/status');
                    const d = await r.json();
                    if(d.active) {
                        document.body.innerHTML = "<div style='padding:40px; font-family:serif;'><h1>The King of Spades</h1><p>A symbol of sudden revelation...</p></div>";
                    }
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

