export default async function handler(req, res) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
        <style>
            body, html { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #fff; font-family: sans-serif; }
            iframe { width: 100%; height: 100%; border: none; }
            
            #input-trigger { position: absolute; top: 60px; left: 0; width: 100%; height: 80px; z-index: 100; }
            #menu-hotspot { position: absolute; top: 0; left: 0; width: 50px; height: 50px; z-index: 101; }

            /* Side Tab UI */
            #fake-menu { 
                position: absolute; top: 0; left: -80%; width: 80%; height: 100%; 
                background: #fff; transition: transform 0.25s ease-out; z-index: 1000;
                display: flex; flex-direction: column;
            }
            #fake-menu.open { transform: translateX(100%); }

            .menu-list { flex-grow: 1; overflow-y: auto; }
            
            .menu-item { 
                display: flex; align-items: center; padding: 16px 20px;
                color: #202122; text-decoration: none; font-size: 16px;
                border-bottom: 1px solid #eaecf0;
            }
            .menu-item.nearby { background-color: #f8f9fa; } /* Matching that slight gray/blue tint */
            
            .icon { width: 22px; height: 22px; margin-right: 15px; background-size: contain; background-repeat: no-repeat; opacity: 0.7; }
            
            /* Official Icons */
            .icon-home { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M10 1L1 9h2v9h5v-5h4v5h5V9h2L10 1z"/></svg>'); }
            .icon-random { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M15 11l4.9 4.9-4.9 4.9-1.4-1.4 2.5-2.5H13c-2.3 0-4.5-1.3-5.6-3.4L6 11.1c-.8 1.4-2.2 2.3-3.8 2.3H0v-2h2.2c1 0 1.9-.6 2.4-1.5l1.4-2.4C7.1 5.4 9.3 4.1 11.6 4.1h4.5l-2.5-2.5 1.4-1.4L19.9 5.1 15 10l-1.4-1.4 2.5-2.5h-4.5c-1.5 0-2.9.8-3.7 2.2l-1.4 2.4c.8 1.4 2.2 2.2 3.7 2.2h3.1l-2.5-2.5 1.4-1.4z"/></svg>'); }
            .icon-nearby { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M10 0C6.1 0 3 3.1 3 7c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 10c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/></svg>'); }
            .icon-login { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M16 10l-5-5v3H2v4h9v3l5-5z"/></svg>'); }
            .icon-settings { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path d="M20 11v-2l-2.1-.4c-.1-.4-.3-.8-.6-1.1l1.2-1.8-1.4-1.4-1.8 1.2c-.3-.3-.7-.5-1.1-.6L13.8 3h-2l-.4 2.1c-.4.1-.8.3-1.1.6L8.5 4.5 7.1 5.9l1.2 1.8c-.3.3-.5.7-.6 1.1L5.6 9.2h-2v2l2.1.4c.1.4.3.8.6 1.1l-1.2 1.8 1.4 1.4 1.8-1.2c.3.3.7.5 1.1.6l.4 2.1h2l.4-2.1c.4-.1.8-.3 1.1-.6l1.8 1.2 1.4-1.4-1.2-1.8c.3-.3.5-.7.6-1.1l2.1-.4zM11.9 10c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/></svg>'); }

            /* Donate Section */
            .donate-box { padding: 16px 20px; border-top: 1px solid #eaecf0; position: relative; background: #fff; }
            .donate-text { color: #36c; font-weight: bold; margin-bottom: 8px; display: block; font-size: 15px; }
            .donate-sub { font-size: 13px; color: #54595d; width: 70%; line-height: 1.4; }
            .donate-img { position: absolute; right: 10px; bottom: 10px; width: 70px; }

            /* Footer */
            .menu-footer { background: #f8f9fa; padding: 15px 20px; display: flex; gap: 20px; border-top: 1px solid #eaecf0; }
            .footer-link { color: #54595d; text-decoration: none; font-size: 13px; }

            #overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); opacity: 0; visibility: hidden; transition: opacity 0.25s ease; z-index: 999; }
            #overlay.show { opacity: 1; visibility: visible; }
        </style>
    </head>
    <body>
        <iframe id="wiki" src="https://en.m.wikipedia.org/wiki/Main_Page"></iframe>

        <div id="input-trigger"></div>
        <div id="menu-hotspot"></div>
        <div id="overlay"></div>
        
        <div id="fake-menu">
            <div class="menu-list">
                <a href="#" class="menu-item" onclick="location.reload()"><div class="icon icon-home"></div>Home</a>
                <a href="#" class="menu-item" id="random-link"><div class="icon icon-random"></div>Random</a>
                <a href="#" class="menu-item nearby"><div class="icon icon-nearby"></div>Nearby</a>
                <a href="#" class="menu-item"><div class="icon icon-login"></div>Log in</a>
                <a href="#" class="menu-item"><div class="icon icon-settings"></div>Settings</a>
            </div>

            <div class="donate-box">
                <span class="donate-text">Donate Now</span>
                <div class="donate-sub">If Wikipedia is useful to you, please give today.</div>
                <img class="donate-img" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/W_puzzle_cube_v3.svg/1200px-W_puzzle_cube_v3.svg.png">
            </div>

            <div class="menu-footer">
                <a class="footer-link">About Wikipedia</a>
                <a class="footer-link">Disclaimers</a>
            </div>
        </div>

        <script>
            let n = 0; let clickCount = 0;
            const menu = document.getElementById('fake-menu');
            const overlay = document.getElementById('overlay');
            const iframe = document.getElementById('wiki');

            document.getElementById('input-trigger').onclick = () => {
                n++; if(navigator.vibrate) navigator.vibrate(10);
            };

            document.getElementById('menu-hotspot').onclick = () => {
                menu.classList.add('open'); overlay.classList.add('show');
            };

            overlay.onclick = () => {
                menu.classList.remove('open'); overlay.classList.remove('show');
            };

            document.getElementById('random-link').onclick = (e) => {
                e.preventDefault(); clickCount++;
                menu.classList.remove('open'); overlay.classList.remove('show');
                setTimeout(() => {
                    if (clickCount >= n && n > 0) {
                        iframe.src = "https://en.m.wikipedia.org/wiki/Mahatma_Gandhi";
                    } else {
                        iframe.src = "https://en.m.wikipedia.org/wiki/Special:Random?t=" + Date.now();
                    }
                }, 400);
            };
        </script>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
}
