import { defineConfig, loadEnv } from 'vite';  // ← add loadEnv
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import path from 'path';

export default defineConfig(({ mode }) => {  // ← wrap in function
    const env = loadEnv(mode, process.cwd(), '');
    
    // Extract path from APP_URL for local, use /build/ for production
    const appUrl = env.APP_URL || 'http://localhost';
    const urlPath = new URL(appUrl).pathname;  // → '/operations'
    const base = urlPath.endsWith('/') ? `${urlPath}build/` : `${urlPath}/build/`;

    return {
        base,  // → '/operations/build/' locally, '/build/' on real server
        plugins: [
            laravel({
                input: ['resources/css/app.scss', 'resources/js/app.js', 'resources/src/plugins/jquery/jquery.min.js',
                 'resources/css/icon-font.min.css',
                 'resources/css/style.css',
                  'resources/css/pages/login.css',
                  'resources/css/pages/2fasetup.css',
                  'resources/css/pages/2faverify.css',
                  'resources/css/pages/passexp.css',
                  'resources/css/pages/leftsidebar.css',
                  'resources/css/pages/navbar.css',
                  'resources/css/pages/edit.css',
                  'resources/css/pages/aimport.css',
                  'resources/css/pages/amanage.css',
                  'resources/css/pages/unbox.css',
                  'resources/css/pages/areport.css',
                  'resources/css/pages/auditpdf.css',
                  'resources/css/pages/closep.css',
                  'resources/css/pages/massign.css',
                  'resources/css/pages/mngprol.css',
                  'resources/css/pages/musers.css',
                  'resources/css/pages/nagent.css',
                  'resources/css/pages/newuser.css',
                  'resources/css/pages/reclot.css',
                  'resources/css/pages/payimport.css',
                  'resources/css/pages/newrob.css',
                  'resources/css/pages/recreports.css',
                  'resources/css/pages/pidentify.css',
                  'resources/css/pages/ritems.css',
                  'resources/css/pages/roles.css',
                  'resources/css/pages/static.css',
                  'resources/css/pages/vaudit.css',
                  'resources/css/pages/dashboard.css',
                  'resources/css/pages/whatshappening.css',
                  'resources/css/pages/lfeed.css',
                'resources/js/script.min.js',
                'resources/js/static.js',
                'resources/js/unbox.js',
                'resources/js/aimport.js',
                'resources/js/pidentify.js',
                'resources/js/analysis.js',
                'resources/js/closep.js',
                'resources/js/dash.js',
                'resources/js/dashboard.js',
                'resources/js/edit.js',
                'resources/js/leftbar.js',
                'resources/js/login.js',
                'resources/js/areports.js',
                'resources/js/massign.js',
                'resources/js/mngprol.js',
                'resources/js/lottracking.js',
                'resources/js/nagent.js',
                'resources/js/navbar.js',
                'resources/js/createlot.js',
                'resources/js/newrob.js',
                'resources/js/recieve.js',
                'resources/js/pitems.js',
                'resources/js/recreports.js',
                'resources/js/unboxrpt.js',
                'resources/js/roles.js',
                'resources/js/vaudit.js',
                'resources/js/verify.js',
                'resources/js/setup2fs.js',
                'resources/js/fingeradd.js',
                'resources/js/passexp.js',
                'resources/js/lfeed.js',
                'resources/js/highcharts-init.js',
                'resources/js/whatshappening.js',
                'resources/js/process.js'],
                refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    resolve: {
            alias: {
                '~': '/resources',
                '@fonts': path.resolve(__dirname, 'resources/fonts'),
                '@vendor': path.resolve(__dirname, 'public/vendors'),
                '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
                '~popper.js': '/node_modules/@popperjs/core'
            }
        },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]',
            }
        }
    }
};
});