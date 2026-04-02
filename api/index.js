const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req;
    const host = req.headers.host;

    try {
        const cleanPath = (url === '/' || url === '/api') ? '/wiki/Main_Page' : url;
        const targetUrl = `https://en.m.wikipedia.org${cleanPath}`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        let html = response.data;
        html = html.replace(/https:\/\/en.m.wikipedia.org/g, `https://${host}`);
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <script>
                // Reset click counter on the Main Page for a fresh trick
                if (window.location.pathname.includes('Main_Page')) {
                    localStorage.setItem('m_c', '0');
                }

                const state = {
                    get n() { return parseInt(localStorage.getItem('m_n')) || 0 },
                    set n(v) { localStorage.setItem('m_n', v) },
                    get locked() { return localStorage.getItem('m_l') === 'true' },
                    set locked(v) { localStorage.setItem('m_l', v) },
                    get clicks() { return parseInt(localStorage.getItem('m_c')) || 0 },
                    set clicks(v) { localStorage.setItem('m_c', v) }
                };

                // 1. THE PROGRAMMING: Tap the Featured Article Title
                document.addEventListener('click', (e) => {
                    if (state.locked) return;
                    
                    // Wikipedia titles are usually inside #section_0 or have specific classes
                    const isTitle = e.target.closest('#section_0') || e.target.closest('.header-container');
                    
                    if (isTitle) {
                        state.n++;
                        console.log("FORCE SET TO: " + state.n);
                        // Subtle haptic so YOU know it counted
                        if(window.navigator.vibrate) window.navigator.vibrate(10);
                    }
                });

                // 2. THE LOCK: Scroll to Top
                window.addEventListener('scroll', () => {
                    if (window.scrollY <= 2 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        if(window.navigator.vibrate) window.navigator.vibrate([20, 20]);
                    }
                    // THE RESET: Scroll to Bottom
                    const max = document.documentElement.scrollHeight - window.innerHeight;
                    if (window.scrollY >= max - 5) {
                        localStorage.clear();
                        location.reload();
                    }
                });

                // 3. THE HIJACK
                window.onclick = function(e) {
                    const a = e.target.closest('a');
                    if (a && a.href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        state.clicks++;
                        
                        if (state.clicks >= state.n) {
                            window.location.replace("https://${host}/wiki/Mahatma_Gandhi");
                        } else {
                            window.location.replace("https://${host}/wiki/Special:Random");
                        }
                        return false;
                    }
                };
            </script>
        `;
        
        html = html.replace('</head>', injection + '</head>');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
