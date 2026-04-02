export default async function handler(req, res) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
        <style>
            /* Wikipedia official font stack */
            body, html { 
                margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; background: #fff; 
                font-family: sans-serif; -webkit-font-smoothing: antialiased;
            }
            iframe { width: 100%; height: 100%; border: none; padding-top: 0; }
            
            /* The Invisible Programming Zone */
            #input-trigger { position: absolute; top: 60px; left: 0; width: 100%; height: 80px; z-index: 100; }

            /* Fake Menu Hotspot */
            #menu-hotspot { position: absolute; top: 0; left: 0; width: 50px; height: 50px; z-index: 101; }

            /* Wikipedia Native Sidebar UI */
            #fake-menu { 
                position: absolute; top: 0; left: -285px; width: 280px; height: 100%; 
                background: #fff; box-shadow: none; border-right: 1px solid #eaecf0;
                transition: transform 0.25s ease-out; z-index: 1000;
            }
            #fake-menu.open { transform: translateX(285px); }

            .menu-header { 
                padding: 16px 16px 12px 16px; display: flex; align-items: center;
                border-bottom: 1px solid #eaecf0; margin-bottom: 8px;
            }
            .wiki-logo { width: 120px; height: auto; }

            .menu-item { 
                display: flex; align-items: center; padding: 12px 16px;
                color: #202122; text-decoration: none; font-size: 14px; line-height: 1.4;
            }
            .menu-item:active { background-color: #eaecf0; }
            
            /* SVG Icons from Wikipedia's actual Sprite */
            .icon { 
                width: 20px; height: 20px; margin-right: 12px; 
                background-repeat: no-repeat; background-size: contain; opacity: 0.7;
            }
            .icon-home { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><title>home</title><path d="M10 1L1 9h2v9h5v-5h4v5h5V9h2L10 1z"/></svg>'); }
            .icon-random { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><title>random</title><path d="M15 11l4.9 4.9-4.9 4.9-1.4-1.4 2.5-2.5H13c-2.3 0-4.5-1.3-5.6-3.4L6 11.1c-.8 1.4-2.2 2.3-3.8 2.3H0v-2h2.2c1 0 1.9-.6 2.4-1.5l1.4-2.4C7.1 5.4 9.3 4.1 11.6 4.1h4.5l-2.5-2.5 1.4-1.4L19.9 5.1 15 10l-1.4-1.4 2.5-2.5h-4.5c-1.5 0-2.9.8-3.7 2.2l-1.4 2.4c.8 1.4 2.2 2.2 3.7 2.2h3.1l-2.5-2.5 1.4-1.4zM2.2 5.9c-1 0-1.9.6-2.4 1.5H0v2h2.2c1.6 0 3.1-.9 3.8-2.3l.5-.8c-.3-.2-.7-.4-1.1-.4h-3.2z"/></svg>'); }
            .icon-nearby { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><title>nearby</title><path d="M10 0C6.1 0 3 3.1 3 7c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 10c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/></svg>'); }
            .icon-login { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><title>log in</title><path d="M16 10l-5-5v3H2v4h9v3l5-5z"/></svg>'); }

            #overlay { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.45); opacity: 0; visibility: hidden; 
                transition: opacity 0.25s ease; z-index: 999; 
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
            <div class="menu-header">
                <img src="https://en.m.wikipedia.org/static/images/mobile/copyright/wikipedia-wordmark-en.svg" class="wiki-logo">
            </div>
            <a href="#" class="menu-item" onclick="location.reload()"><div class="icon icon-home"></div>Home</a>
            <a href="#" class="menu-item" id="random-link"><div class="icon icon-random"></div>Random</a>
            <a href="#" class="menu-item"><div class="icon icon-nearby"></div>Nearby</a>
            <a href="#" class="menu-item"><div class="icon icon-login"></div>Log in</a>
            <div style="border-top: 1px solid #eaecf0; margin: 8px 0;"></div>
            <a href="#" class="menu-item" style="color: #72777d;"><div class="icon" style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22><path d=%22M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z%22/><path d=%22M11 5H9v6h2V5zm0 8H9v2h2v-2z%22/></svg>'); opacity:0.5;"></div>Settings</a>
        </div>

        <script>
            let n = 0;
            let clickCount = 0;
            const menu = document.getElementById('fake-menu');
            const overlay = document.getElementById('overlay');
            const iframe = document.getElementById('wiki');

            document.getElementById('input-trigger').onclick = () => {
                n++;
                if(navigator.vibrate) navigator.vibrate(10);
            };

            document.getElementById('menu-hotspot').onclick = () => {
                menu.classList.add('open');
                overlay.classList.add('show');
            };

            overlay.onclick = () => {
                menu.classList.remove('open');
                overlay.classList.remove('show');
            };

            document.getElementById('random-link').onclick = (e) => {
                e.preventDefault();
                clickCount++;
                menu.classList.remove('open');
                overlay.classList.remove('show');

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
