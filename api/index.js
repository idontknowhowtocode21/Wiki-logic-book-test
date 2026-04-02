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
        html = html.replace('<head>', `<head><base href="https://en.m.wikipedia.org">`);

        const injection = `
            <audio id="magic-audio" loop muted playsinline>
                <source src="https://actions.google.com/sounds/v1/science_fiction/robot_code_typing.ogg" type="audio/ogg">
            </audio>

            <script>
                const state = {
                    get n() { return parseInt(localStorage.getItem('m_n')) || 0 },
                    set n(v) { localStorage.setItem('m_n', v) },
                    get locked() { return localStorage.getItem('m_l') === 'true' },
                    set locked(v) { localStorage.setItem('m_l', v) },
                    get clicks() { return parseInt(localStorage.getItem('m_c')) || 0 },
                    set clicks(v) { localStorage.setItem('m_c', v) }
                };

                const audio = document.getElementById('magic-audio');
                
                // CRITICAL: The user MUST tap the screen once to enable the volume listener
                document.addEventListener('click', () => {
                    audio.muted = false;
                    audio.play().then(() => {
                        audio.volume = 0.5; // Set to middle
                    }).catch(e => console.log("Audio Init Fail"));
                }, { once: true });

                // 1. THE VOLUME LISTENER (Reinforced)
                let lastVol = 0.5;
                audio.addEventListener('volumechange', () => {
                    if (state.locked) return;

                    const newVol = audio.volume;
                    if (newVol > lastVol) {
                        state.n++;
                        if(navigator.vibrate) navigator.vibrate(15);
                    } else if (newVol < lastVol) {
                        state.n = 0; // Volume Down resets the count
                        if(navigator.vibrate) navigator.vibrate([40, 40]);
                    }
                    
                    // Immediately snap back to middle to allow rapid clicks
                    lastVol = 0.5;
                    audio.volume = 0.5; 
                });

                // 2. LOCK & RESTART LOGIC
                window.addEventListener('scroll', () => {
                    const currY = window.scrollY;
                    const max = document.documentElement.scrollHeight - window.innerHeight;
                    if (currY <= 1 && state.n > 0 && !state.locked) {
                        state.locked = true;
                        if(navigator.vibrate) navigator.vibrate([30, 30]);
                    }
                    if (currY >= max - 5 && max > 100) {
                        localStorage.clear();
                        window.location.reload();
                    }
                });

                // 3. THE HIJACKER
                window.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (!link) return;
                    const href = link.getAttribute('href') || '';

                    if (href.includes('Main_Page') || link.innerText.toLowerCase().includes('home')) {
                        e.preventDefault();
                        localStorage.clear();
                        window.location.href = "https://${host}/wiki/Main_Page";
                        return;
                    }

                    if (href.includes('Special:Random') && state.locked) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        state.clicks++;
                        if (state.clicks >= state.n) {
                            window.location.href = "https://${host}/wiki/Mahatma_Gandhi";
                        } else {
                            window.location.href = "https://${host}/wiki/Special:Random?t=" + Date.now();
                        }
                        return;
                    }

                    if (href.startsWith('/wiki/') || href.startsWith('https://en.m.wikipedia.org/wiki/')) {
                        e.preventDefault();
                        const path = href.replace('https://en.m.wikipedia.org', '');
                        window.location.href = "https://${host}" + path;
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
