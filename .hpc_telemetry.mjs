import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'http://localhost:3000/autonomous-life-evolution-simulator/';

(async () => {
    console.log("🪲 [HPC_TELEMETRY] Initializing Advanced Render Debugging Pipeline...");

    // Launch headless Chromium via Puppeteer, binding WebGL backends and SAB support
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--enable-features=SharedArrayBuffer',
            '--disable-web-security',
            '--use-gl=angle',
            '--use-angle=default'
        ]
    });

    const page = await browser.newPage();

    let errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
        console.log(`[BROWSER][${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
        errors.push(err.toString());
        console.error(`[BROWSER][PAGE_ERROR] ${err.toString()}`);
    });

    // Sub-hook: Attach to ALL offscreen workers to trap hidden WebGL and ThreeJS panics
    browser.on('targetcreated', async target => {
        if (target.type() === 'worker') {
            const worker = await target.worker();
            console.log(`🧮 [WORKER_SPAWNED] ${target.url()}`);

            worker.on('console', msg => {
                console.log(`[WORKER][${msg.type().toUpperCase()}] ${msg.text()}`);
            });

            try {
                await worker.evaluate(() => {
                    self.addEventListener('unhandledrejection', (e) => {
                        console.error('[WORKER_UNHANDLED_REJECTION]', e.reason);
                    });
                    self.addEventListener('error', (e) => {
                        console.error('[WORKER_ERROR]', e.message);
                    });
                });
            } catch (e) { /* ignore evaluation errors if worker terminates fast */ }
        }
    });

    try {
        console.log(`\n🪲 [PHASE 1] Injecting probes and navigating...`);
        const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });

        console.log(`HTTP Status: ${response.status()}`);

        console.log("\n🪲 [PHASE 2] Cross-Origin Isolation & Memory Assessment");
        const envValidation = await page.evaluate(() => {
            return {
                crossOriginIsolated: window.crossOriginIsolated,
                hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
                devicePixelRatio: window.devicePixelRatio
            };
        });
        console.table([envValidation]);

        console.log("\n🪲 [PHASE 3] Canvas & Display Hierarchy Analysis");
        await new Promise(r => setTimeout(r, 2000)); // Allow Three.js compilation

        const canvasValidation = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return { found: false };
            return {
                found: true,
                width: canvas.width,
                height: canvas.height,
                styleWidth: canvas.style.width,
                styleHeight: canvas.style.height,
                display: canvas.style.display,
                visibility: canvas.style.visibility,
                opacity: canvas.style.opacity,
                zIndex: canvas.style.zIndex
            };
        });
        console.table([canvasValidation]);

        console.log("\n🪲 [PHASE 4] Render Render Output Metrics");
        // Dump visual state inside workspace folder so it can be evaluated
        const capturePath = path.resolve(process.cwd(), 'hpc_diagnostic_capture.png');
        await page.screenshot({ path: capturePath });
        console.log(`📸 Diagnostic screenshot captured at: ${capturePath}`);

        if (errors.length > 0) {
            console.log("\n❌ [DIAGNOSTIC] Render failure likely linked to observed errors.");
        } else {
            console.log("\n✅ [DIAGNOSTIC] No fatal page errors. If screen is black, suspect camera/z-index/shader silent failure or SAB misalignment.");
        }

    } catch (e) {
        console.error("🪲 [HPC_TELEMETRY] Pipeline Error:", e);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
