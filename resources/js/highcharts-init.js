import Highcharts from 'highcharts';

// ── Use the correct subpath imports ──────────────────────────────────────────
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'highcharts/modules/accessibility';
import 'highcharts/modules/series-label';

// No need to call them as functions — side-effect imports auto-register
// themselves onto the Highcharts global when imported this way

Highcharts.setOptions({
    accessibility: {
        enabled: true
    }
});

window.Highcharts = Highcharts;

export default Highcharts;