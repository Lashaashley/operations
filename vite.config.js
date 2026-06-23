import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import path from 'path';


export default defineConfig({
    
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
                  'resources/css/pages/analytics.css',
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
                  'resources/css/pages/pitems.css',
                  'resources/css/pages/preports.css',
                  'resources/css/pages/rapprove.css',
                  'resources/css/pages/ritems.css',
                  'resources/css/pages/roles.css',
                  'resources/css/pages/static.css',
                  'resources/css/pages/vaudit.css',
                  'resources/css/pages/dashboard.css',
                'resources/js/script.min.js',
                'resources/js/static.js',
                'resources/js/ritems.js',
                'resources/js/aimport.js',
                'resources/js/amanage.js',
                'resources/js/analysis.js',
                'resources/js/closep.js',
                'resources/js/dash.js',
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
                'resources/js/preports.js',
                'resources/js/rapprove.js',
                'resources/js/roles.js',
                'resources/js/vaudit.js',
                'resources/js/verify.js',
                'resources/js/setup2fs.js',
                'resources/js/passexp.js',
                'resources/js/highcharts-init.js',
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
        }
});
