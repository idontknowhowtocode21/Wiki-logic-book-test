const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host;

    try {
        const cleanPath = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${cleanPath}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        
        // 1. Keep all assets/links pointing to the real Wikipedia so CSS/Icons are perfect
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                // State stored in session so it survives page navigation
                let n = parseInt(sessionStorage.getItem('m_n')) || 0;
                let clicks = parseInt(sessionStorage.getItem('m_c')) || 0;
                let locked = sessionStorage.getItem('m_l') === 'true';

                // 1. PROGRAMMING: Tap the Featured Article title area
                // We use the real Wikipedia ID for the header
                document.addEventListener('click', (e) => {
                    if (locked) return;
                    if (e.target.closest('#section_0, .header-container')) {
                        n++;
                        sessionStorage.setItem('m_n', n);
                        if(navigator.vibrate) navigator.vibrate(10);
                    }
                }, true);

                // 2. LOCK: Scroll to top
                window.addEventListener('scroll', () => {
                    if (window.scrollY <= 1 && n > 0 && !locked) {
                        locked = true;
                        sessionStorage.setItem('m_l', 'true');
                        if(navigator.vibrate) navigator.vibrate([30, 30]);
                    }
                });

                // 3. THE HIJACK: The "Real" Pixel-Perfect Menu
                // We wait for the real menu to exist and then swap the Random link
                setInterval(() => {
                    if (!locked) return;
                    
                    // Search for the actual Wikipedia "Random" link in their real sidebar
                    const randomLinks = document.querySelectorAll('a[href*="Special:Random"]');
                    randomLinks.forEach(link => {
                        if (link.dataset.magic) return;
                        link.dataset.magic = "true";

                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            
                            clicks++;
                            sessionStorage.setItem('m_c', clicks);

                            if (clicks >= n) {
                                window.location.href = "https://en.m.wikipedia.org/wiki/Mahatma_Gandhi";
                            } else {
                                window.location.href = "https://en.m.wikipedia.org/wiki/Special:Random";
                            }
                        }, true);
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
