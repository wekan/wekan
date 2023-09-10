const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        args: [
            '--disable-gpu',
            '--disable-translate',
            '--disable-extensions',
            '--hide-scrollbars'
        ]
    });

    const page = await browser.newPage();
    const files = fs.readdirSync(`${__dirname}/_screenshots/`);

    for (const file of files) {
        const ext = path.extname(file);

        if (ext !== '.html') {
            continue;
        }

        const name = path.basename(file, ext);
        const url = `file://${__dirname}/_screenshots/${file}`;

        await page.goto(url, {
            waitUntil: 'networkidle2'
        });

        const box = await page.evaluate(() => {
            const lefts = [];
            const rights = [];
            const tops = [];
            const bottoms = [];
            const padding = 10; // px

            const captureNodes = document.querySelectorAll(document.body.dataset.capture);

            for (const node of captureNodes) {
                const rect = node.getBoundingClientRect();

                lefts.push(rect.left);
                rights.push(rect.right);
                tops.push(rect.top);
                bottoms.push(rect.bottom);
            }

            // Convert bounds to single bounding box
            const b = {
                top: Math.min.apply(Math, tops),
                left: Math.min.apply(Math, lefts)
            };

            b.width = Math.max.apply(Math, rights) - b.left;
            b.height = Math.max.apply(Math, bottoms) - b.top;

            // Return bounding box
            return {
                y: Math.max(b.top - padding, 0),
                x: Math.max(b.left - padding, 0),
                width: b.width + 2 * padding,
                height: b.height + 2 * padding
            };
        });

        await page.screenshot({
            path: `${__dirname}/_static/screenshots/${name}.png`,
            omitBackground: true,
            clip: box
        });
    }

    await browser.close();
})();
