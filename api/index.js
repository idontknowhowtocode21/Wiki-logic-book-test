export default async function handler(req, res) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
        <style>
            body, html { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #fff; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
            .stack { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; transition: opacity 0.2s; }
            #wiki-main { z-index: 1; }
            #wiki-force { z-index: 2; opacity: 0; pointer-events: none; }
            #wiki-force.active { opacity: 1; pointer-events: auto; }
            
            #input-trigger { position: absolute; top: 55px; left: 0; width: 100%; height: 70px; z-index: 100; }
            #menu-hotspot { position: absolute; top: 0; left: 0; width: 50px; height: 50px; z-index: 101; }

            /* PIXEL PERFECT SIDEBAR */
            #fake-menu { 
                position: absolute; top: 0; left: -100%; width: 285px; height: 100%; 
                background: #fff; transition: transform 0.25s cubic-bezier(0,0,0.2,1); z-index: 1000;
                display: flex; flex-direction: column; box-shadow: none;
            }
            #fake-menu.open { transform: translateX(100%); border-right: 1px solid #eaecf0; }

            .menu-list { flex-grow: 1; padding-top: 2px; }
            .menu-item { 
                display: flex; align-items: center; padding: 14px 16px;
                color: #202122; text-decoration: none; font-size: 14.5px;
                border-bottom: 1px solid #f8f9fa;
            }
            .menu-item:active { background: #eaecf0; }
            
            .icon { width: 20px; height: 20px; margin-right: 14px; background-size: contain; background-repeat: no-repeat; opacity: 0.75; }
            .icon-home { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M10 1L1 9h2v9h5v-5h4v5h5V9h2L10 1z"/></svg>'); }
            .icon-random { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M15 11l4.9 4.9-4.9 4.9-1.4-1.4 2.5-2.5H13c-2.3 0-4.5-1.3-5.6-3.4L6 11.1c-.8 1.4-2.2 2.3-3.8 2.3H0v-2h2.2c1 0 1.9-.6 2.4-1.5l1.4-2.4C7.1 5.4 9.3 4.1 11.6 4.1h4.5l-2.5-2.5 1.4-1.4L19.9 5.1 15 10l-1.4-1.4 2.5-2.5h-4.5c-1.5 0-2.9.8-3.7 2.2l-1.4 2.4c.8 1.4 2.2 2.2 3.7 2.2h3.1l-2.5-2.5 1.4-1.4z"/></svg>'); }
            .icon-nearby { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M10 0C6.1 0 3 3.1 3 7c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 10c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/></svg>'); }
            .icon-login { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M16 10l-5-5v3H2v4h9v3l5-5z"/></svg>'); }
            .icon-settings { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M20 11v-2l-2.1-.4c-.1-.4-.3-.8-.6-1.1l1.2-1.8-1.4-1.4-1.8 1.2c-.3-.3-.7-.5-1.1-.6L13.8 3h-2l-.4 2.1c-.4.1-.8.3-1.1.6L8.5 4.5 7.1 5.9l1.2 1.8c-.3.3-.5.7-.6 1.1L5.6 9.2h-2v2l2.1.4c.1.4.3.8.6 1.1l-1.2 1.8 1.4 1.4 1.8-1.2c.3.3.7.5 1.1.6l.4 2.1h2l.4-2.1c.4-.1.8-.3 1.1-.6l1.8 1.2 1.4-1.4-1.2-1.8c.3-.3.5-.7.6-1.1l2.1-.4zM11.9 10c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/></svg>'); }

            .donate-section { padding: 18px 16px; border-top: 1px solid #eaecf0; position: relative; }
            .donate-link { color: #36c; font-weight: bold; font-size: 14px; text-decoration: none; display: block; margin-bottom: 4px; }
            .donate-desc { font-size: 12.5px; color: #54595d; width: 75%; line-height: 1.4; }
            .donate-img { position: absolute; right: 12px; bottom: 12px; width: 62px; opacity: 0.9; }

            .menu-footer { background: #f8f9fa; padding: 14px 16px; display: flex; gap: 18px; border-top: 1px solid #eaecf0; }
            .footer-text { color: #54595d; font-size: 12px; text-decoration: none; }

            #overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); opacity: 0; visibility: hidden; transition: opacity 0.25s ease; z-index: 999; }
            #overlay.show { opacity: 1; visibility: visible; }
        </style>
    </head>
    <body>
        <iframe id="wiki-main" class="stack" src="https://en.m.wikipedia.org/wiki/Main_Page"></iframe>
        <iframe id="wiki-force" class="stack" src=""></iframe>

        <div id="input-trigger"></div>
        <div id="menu-hotspot"></div>
        <div id="overlay"></div>
        
        <div id="fake-menu">
            <div class="menu-list">
                <a href="#" class="menu-item" onclick="location.reload()"><div class="icon icon-home"></div>Home</a>
                <a href="#" class="menu-item" id="random-btn"><div class="icon icon-random"></div>Random</a>
                <a href="#" class="menu-item" style="background:#f8f9fa"><div class="icon icon-nearby"></div>Nearby</a>
                <a href="#" class="menu-item"><div class="icon icon-login"></div>Log in</a>
                <a href="#" class="menu-item"><div class="icon icon-settings"></div>Settings</a>
            </div>

            <div class="donate-section">
                <a class="donate-link">Donate Now</a>
                <div class="donate-desc">If Wikipedia is useful to you, please give today.</div>
                <img class="donate-img" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/W_puzzle_cube_v3.svg/512px-W_puzzle_cube_v3.svg.png">
            </div>

            <div class="menu-footer">
                <a class="footer-text">About Wikipedia</a>
                <a class="footer-text">Disclaimers</a>
            </div>
        </div>

        <script>
            let n = 0; let clicks = 0;
            const menu = document.getElementById('fake-menu');
            const overlay = document.getElementById('overlay');
            const mainFrame = document.getElementById('wiki-main');
            const forceFrame = document.getElementById('wiki-force');

            // 1. INPUT
            document.getElementById('input-trigger').onclick = () => {
                n++; 
                if(navigator.vibrate) navigator.vibrate(8);
                // Pre-load Gandhi in background so it's instant later
                if(n === 1) forceFrame.src = "https://en.m.wikipedia.org/wiki/Mahatma_Gandhi";
            };

            // 2. MENU
            document.getElementById('menu-hotspot').onclick = () => {
                menu.classList.add('open'); overlay.classList.add('show');
            };
            overlay.onclick = () => {
                menu.classList.remove('open'); overlay.classList.remove('show');
            };

            // 3. THE INSTANT FORCE
            document.getElementById('random-btn').onclick = (e) => {
                e.preventDefault();
                clicks++;
                menu.classList.remove('open'); overlay.classList.remove('show');

                if (clicks >= n && n > 0) {
                    // SWAP: Hide main, show Gandhi instantly
                    forceFrame.classList.add('active');
                } else {
                    mainFrame.src = "https://en.m.wikipedia.org/wiki/Special:Random?t=" + Date.now();
                }
            };
        </script>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
}
