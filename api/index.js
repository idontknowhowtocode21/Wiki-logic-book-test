export default async function handler(req, res) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
            body, html { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif; }
            iframe { width: 100%; height: 100%; border: none; }
            
            /* Invisible Programming Zone */
            #input-trigger { position: absolute; top: 45px; left: 0; width: 100%; height: 60px; z-index: 100; cursor: pointer; }

            /* Fake Menu Hotspot (Over the 3-bar icon) */
            #menu-hotspot { position: absolute; top: 0; left: 0; width: 55px; height: 50px; z-index: 101; }

            /* High-Fidelity Wikipedia Menu */
            #fake-menu { 
                position: absolute; top: 0; left: -280px; width: 280px; height: 100%; 
                background: #fff; box-shadow: 0 0 20px rgba(0,0,0,0.3); 
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                z-index: 1000; padding-top: 10px;
                transform: translateX(0);
            }
            #fake-menu.open { transform: translateX(280px); }

            /* Styling items to match Wikipedia Mobile */
            .menu-header { padding: 20px; border-bottom: 1px solid #eaecf0; font-weight: bold; color: #202122; font-size: 1.2em; }
            .menu-item { 
                padding: 14px 20px; color: #333; text-decoration: none; display: flex; align-items: center; 
                font-size: 15px; border-bottom: none; transition: background 0.1s;
            }
            .menu-item:active { background: #eaecf0; }
            .menu-icon { margin-right: 15px; width: 20px; opacity: 0.7; text-align: center; }

            /* The darkened background when menu is open */
            #overlay { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.5); opacity: 0; visibility: hidden; 
                transition: opacity 0.3s ease; z-index: 999; 
            }
            #overlay.show { opacity: 1; visibility: visible; }
        </style>
    </head>
    <body>
        <iframe id="wiki" src="https://en.m.wikipedia.org/wiki/Main_Page"></iframe>

        <div id="input-trigger"></div>
        <div id="menu-hotspot"></div>
        <div id="overlay"></div>
        
        <div id="fake-menu">
            <div class="menu-header">Wikipedia</div>
            <a href="#" class="menu-item" onclick="location.reload()"><span class="menu-icon">🏠</span>Home</a>
            <a href="#" class="menu-item" id="random-link"><span class="menu-icon">🎲</span>Random</a>
            <a href="#" class="menu-item"><span class="menu-icon">📍</span>Nearby</a>
            <a href="#" class="menu-item"><span class="menu-icon">👤</span>Log in</a>
            <div style="border-top: 1px solid #eaecf0; margin-top: 10px; padding-top: 10px;"></div>
            <a href="#" class="menu-item"><span class="menu-icon">⚙️</span>Settings</a>
            <a href="#" class="menu-item"><span class="menu-icon">🎁</span>Donate</a>
        </div>

        <script>
            let n = 0;
            let clickCount = 0;
            const menu = document.getElementById('fake-menu');
            const overlay = document.getElementById('overlay');
            const iframe = document.getElementById('wiki');

            // 1. PROGRAMMING: Tap the Featured Article Title
            document.getElementById('input-trigger').onclick = () => {
                n++;
                if(navigator.vibrate) navigator.vibrate(12);
            };

            // 2. OPEN MENU: Hijacks the 3-bar icon
            document.getElementById('menu-hotspot').onclick = () => {
                menu.classList.add('open');
                overlay.classList.add('show');
            };

            // Close menu
            overlay.onclick = () => {
                menu.classList.remove('open');
                overlay.classList.remove('show');
            };

            // 3. THE FORCE (Nth Click)
            document.getElementById('random-link').onclick = (e) => {
                e.preventDefault();
                clickCount++;
                
                // Close menu first for realism
                menu.classList.remove('open');
                overlay.classList.remove('show');

                setTimeout(() => {
                    if (clickCount >= n && n > 0) {
                        iframe.src = "https://en.m.wikipedia.org/wiki/Mahatma_Gandhi";
                    } else {
                        // Use a specific proxy-friendly link for real random
                        iframe.src = "https://en.m.wikipedia.org/wiki/Special:Random?timestamp=" + Date.now();
                    }
                }, 300); // Slight delay to mimic page load
            };
        </script>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
}
