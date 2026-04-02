export default async function handler(req, res) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: sans-serif; }
            iframe { width: 100%; height: 100%; border: none; }
            
            /* The Invisible Programming Layer */
            #magic-layer { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                z-index: 10; pointer-events: none; 
            }
            #input-zone { 
                position: absolute; top: 0; left: 0; width: 100%; height: 200px; 
                pointer-events: auto; background: transparent; 
            }
        </style>
    </head>
    <body>
        <iframe id="wiki" src="https://en.m.wikipedia.org/wiki/Main_Page"></iframe>

        <div id="magic-layer">
            <div id="input-zone"></div>
        </div>

        <script>
            let n = 0;
            let locked = false;
            let clickCount = 0;
            const iframe = document.getElementById('wiki');

            // 1. PROGRAMMING: Tap the top 200px of the screen (The Title Area)
            document.getElementById('input-zone').onclick = (e) => {
                if (locked) return;
                n++;
                if(navigator.vibrate) navigator.vibrate(15);
            };

            // 2. LOCK: We use a "Double Tap" on the bottom corner to Lock
            // (Much more reliable than scrolling in a shell)
            document.body.onclick = (e) => {
                if (e.clientY > window.innerHeight - 50 && e.clientX > window.innerWidth - 50) {
                    locked = true;
                    if(navigator.vibrate) navigator.vibrate([30, 30]);
                    // Hide the input zone so they can now use the actual Wiki menu
                    document.getElementById('input-zone').style.display = 'none';
                }
            };

            // 3. THE HIJACK: Watch the iframe's URL
            setInterval(() => {
                try {
                    // If they click 'Random', we catch the change and redirect
                    const currentUrl = iframe.contentWindow.location.href;
                    if (locked && currentUrl.includes('Special:Random')) {
                        clickCount++;
                        if (clickCount >= n) {
                            iframe.src = "https://en.m.wikipedia.org/wiki/Mahatma_Gandhi";
                        }
                    }
                } catch(e) {
                    // Cross-origin might block reading URL, so we use a 'Cover' link
                    // See Handling below
                }
            }, 500);
        </script>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
}
