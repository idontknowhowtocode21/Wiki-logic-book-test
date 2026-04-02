export default async function handler(req, res) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
            body, html { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #fff; }
            iframe { width: 100%; height: 100%; border: none; }
            
            /* The Invisible Programming Zone (Top Title) */
            #input-trigger { position: absolute; top: 50px; left: 0; width: 100%; height: 100px; z-index: 100; }

            /* The Fake Menu Hotspot (Over the 3 lines) */
            #menu-hotspot { position: absolute; top: 0; left: 0; width: 50px; height: 50px; z-index: 101; }

            /* The Fake Wikipedia Menu */
            #fake-menu { 
                position: absolute; top: 0; left: -250px; width: 250px; height: 100%; 
                background: #fff; box-shadow: 2px 0 10px rgba(0,0,0,0.2); 
                transition: left 0.3s ease; z-index: 102; padding-top: 50px;
                font-family: sans-serif;
            }
            #fake-menu.open { left: 0; }
            .menu-item { padding: 15px 20px; border-bottom: 1px solid #eee; color: #333; text-decoration: none; display: block; font-size: 16px; }
            #overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; z-index: 101; }
        </style>
    </head>
    <body>
        <iframe id="wiki" src="https://en.m.wikipedia.org/wiki/Main_Page"></iframe>

        <div id="input-trigger"></div>
        <div id="menu-hotspot"></div>
        <div id="overlay"></div>
        
        <div id="fake-menu">
            <a href="#" class="menu-item" onclick="location.reload()">Home</a>
            <a href="#" class="menu-item" id="random-link">Random</a>
            <a href="#" class="menu-item">Nearby</a>
            <a href="#" class="menu-item">Settings</a>
        </div>

        <script>
            let n = 0;
            let clickCount = 0;
            const menu = document.getElementById('fake-menu');
            const overlay = document.getElementById('overlay');

            // 1. PROGRAMMING: Tap the Featured Article Title area
            document.getElementById('input-trigger').onclick = () => {
                n++;
                if(navigator.vibrate) navigator.vibrate(15);
            };

            // 2. OPEN MENU: Overrides Wikipedia's real menu
            document.getElementById('menu-hotspot').onclick = () => {
                menu.classList.add('open');
                overlay.style.display = 'block';
            };

            // Close menu if overlay clicked
            overlay.onclick = () => {
                menu.classList.remove('open');
                overlay.style.display = 'none';
            };

            // 3. THE FORCE
            document.getElementById('random-link').onclick = (e) => {
                e.preventDefault();
                clickCount++;
                
                if (clickCount >= n && n > 0) {
                    document.getElementById('wiki').src = "https://en.m.wikipedia.org/wiki/Mahatma_Gandhi";
                    menu.classList.remove('open');
                    overlay.style.display = 'none';
                } else {
                    // Send them to a real random page (using the proxy link)
                    document.getElementById('wiki').src = "https://en.m.wikipedia.org/wiki/Special:Random";
                    menu.classList.remove('open');
                    overlay.style.display = 'none';
                }
            };
        </script>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
}
