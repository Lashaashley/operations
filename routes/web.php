<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ModulesController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\RolesReportController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\ModelsController;
use App\Http\Controllers\StaticController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\MasterlotConroller;
use App\Http\Controllers\PartsController;
use App\Http\Controllers\RecieveController; 
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Api\FingerprintController;
use App\Http\Controllers\LinefeedingController;
use App\Http\Controllers\DashboardController;



Route::get('/', function () {
    return redirect()->route('login');
});


Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/fingerprint/challenge', [FingerprintController::class, 'getChallenge'])
    ->name('fingerprint.challenge');
Route::post('/fingerprint/verify', [FingerprintController::class, 'verifyAssertion'])
    ->name('fingerprint.verify');


    Route::middleware(['auth'])->prefix('fingerprint')->name('fingerprint.')->group(function () {
    // Check if user has registered authenticators
    Route::get('/check', [FingerprintController::class, 'check'])
        ->name('check');
    
    // Get all authenticators for the current user
    Route::get('/authenticators', [FingerprintController::class, 'getAuthenticators'])
        ->name('authenticators.list');

    Route::get('/station-challenge', [FingerprintController::class, 'getChallenge'])
        ->name('station-challenge');
    
    // Register a new device
    Route::get('/register/options', [FingerprintController::class, 'registerOptions'])
        ->name('register.options');
    Route::post('/register/verify', [FingerprintController::class, 'registerVerify'])
        ->name('register.verify');
    
    // Remove an authenticator
    Route::delete('/authenticators/{id}', [FingerprintController::class, 'removeAuthenticator'])
        ->name('authenticators.remove');
});

Route::middleware(['auth'])->group(function () {

Route::get('/profile/fingerprint', function () {
        return view('profile.fingerprint');
    })->name('profile.fingerprint');

  Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

 Route::put('/users/{id}/update', [UsersController::class, 'update'])->name('update.user');
    Route::put('/users/{id}/changepassword', [UsersController::class, 'changepassword'])->name('change.pass');
    Route::get('/users/{id}/edit', [UsersController::class, 'edit'])->name('get.user');
    Route::post('/profile/photo', [ProfileController::class, 'updatePhoto'])->name('profile.photo.update');


    Route::get('massign', [ModulesController::class, 'index'])->name('massign.index');
Route::post('/get-role-modules', [ModulesController::class, 'getRoleModules'])->name('modules.getRoleModules');
Route::prefix('modules')->name('modules.')->middleware('auth')->group(function () {
    Route::post('/get-user-modules', [ModulesController::class, 'getUserModules'])->name('getUserModules');
   
    Route::post('/assign', [ModulesController::class, 'assignModules'])->name('assign');
    Route::post('/save', [ModulesController::class, 'saveModules'])->name('save');
    Route::post('/remove', [ModulesController::class, 'removeModule'])->name('remove');
});

Route::get('roles', [RolesController::class, 'index'])->name('roles.index');
Route::post('roles', [RolesController::class, 'store'])->name('roles.store');
Route::get('/roles/getall', [RolesController::class, 'getAll'])->name('roles.getall');
Route::post('roles/{id}', [RolesController::class, 'update'])->name('roles.update');
Route::get('/roles/get-dropdown', [RolesController::class, 'getAllBranches'])->name('roles.getDropdown');
//Route::get('mngprol', [Managepayroll::class, 'showPayrollPeriod']);
Route::get('/roles/report', [RolesReportController::class, 'generateReport'])->name('roles.report');
Route::get('/roles/report/download', [RolesReportController::class, 'downloadReport'])->name('roles.report.download');


Route::get('customers', [CustomersController::class, 'index'])->name('customers');
Route::post('customers', [CustomersController::class, 'store'])->name('customers.store');
Route::get('/customers/getall', [CustomersController::class, 'getAll'])->name('customers.getall');
Route::get('/customers/get-dropdown', [CustomersController::class, 'getAllcustomers'])->name('customers.getDropdown');
Route::get('/depts/get-dropdown', [ModelsController::class, 'getAllDepts'])->name('models.getDropdown');
Route::post('customers/{id}', [CustomersController::class, 'update'])->name('customers.update');
Route::delete('customers/{id}', [CustomersController::class, 'destroy'])->name('customers.destroy');


Route::get('depts', [ModelsController::class, 'create'])->name('models');
Route::post('depts', [ModelsController::class, 'store'])->name('models.store');
Route::post('depts/{id}', [ModelsController::class, 'update'])->name('models.update');
Route::get('/depts/getall', [ModelsController::class, 'getAll'])->name('models.getall');
Route::get('/classes/by-campus', [ModelsController::class, 'getClassesByCampus'])->name('models.getByCampus');

Route::get('static', [StaticController::class, 'create'])->name('staticinfo');
Route::post('static', [StaticController::class, 'store'])->name('staticinfo.store');



Route::get('status', [StatusController::class, 'create'])->name('status');
Route::post('status', [StatusController::class, 'store'])->name('status.store');
Route::get('/status/getall', [StatusController::class, 'getAll'])->name('status.getall');
Route::get('/status/get-dropdown', [StatusController::class, 'getAllstatus'])->name('status.getDropdown');
Route::get('/zones/get-dropdown', [StatusController::class, 'getAllZone'])->name('zones.getDropdown');
Route::post('status/{id}', [StatusController::class, 'update'])->name('status.update');
Route::delete('status/{id}', [StatusController::class, 'destroy'])->name('status.destroy');
Route::post('zones', [StatusController::class, 'zonestore'])->name('zones.store');
Route::get('/zones/getall', [StatusController::class, 'getAllzones'])->name('zones.getall');
 

Route::get('createlot', [MasterlotConroller::class, 'index'])->name('createlot');
Route::get('lottracking', [MasterlotConroller::class, 'index2'])->name('lottracking');
Route::get('newrob', [MasterlotConroller::class, 'index3'])->name('newrob');
Route::post('createlot', [MasterlotConroller::class, 'store'])->name('createlot.store');
Route::get('/lots/data', [MasterlotConroller::class, 'getData'])->name('lots.data');
Route::get('/lottracking/details/{id}',  [MasterlotConroller::class, 'getLotDetails'])->name('lot.detail');
Route::post('/lottracking/advance/{id}', [MasterlotConroller::class, 'advanceStatus'])->name('lot.advance');
Route::get('/lots/by-model', [MasterlotConroller::class, 'getLotsByModel'])->name('lots.bymodel');
Route::get('/lots/by-modellot', [MasterlotConroller::class, 'getLotsByModelandlot'])->name('lots.bymodellot');
Route::get('/lots/by-lotmodel', [MasterlotConroller::class, 'getlotbyModel'])->name('lot.getByModel');


Route::get('/parts/by-model', [PartsController::class, 'getPartsBymodel'])->name('parts.getBymodel');
Route::get('unbox', [PartsController::class, 'index'])->name('unbox');
Route::get('unboxrpt', [PartsController::class, 'index2'])->name('unboxrpt');
Route::get('pidentify', [PartsController::class, 'index3'])->name('pidentify');
Route::get('/cases/by-lot', [PartsController::class, 'getClassesBylot'])->name('case.getBylot');
Route::get('/parts/for-case',[PartsController::class, 'getPartsForCase'])->name('parts.forcase');
Route::post('/parts/save-row',[PartsController::class, 'saveUnboxingRow'])->name('parts.saverow');
Route::post('/parts/complete-case',[PartsController::class, 'completeCase'])->name('parts.completecase');
Route::get('/boxcases/by-lot', [PartsController::class, 'getcasesbylot'])->name('boxcase.getBylot');

 Route::prefix('import')->name('import.')->group(function () {
        //Route::get('/employees', [ImportController::class, 'showImportPage'])->name('employees');


        Route::post('/employees', [ImportController::class, 'importEmployees'])->name('employees.upload');
        Route::get('/template', [ImportController::class, 'downloadTemplate'])->name('template');

    });
    Route::get('dimport', [ImportController::class, 'index'])->name('dimport.index');


    Route::get('reclot', [RecieveController::class, 'index'])->name('reclot');
    Route::get('whatshappening', [RecieveController::class, 'whatshappening'])->name('whatshappening');
    Route::get('recreports', [RecieveController::class, 'index2'])->name('recreports');
    Route::post('/lot-activity/heartbeat',   [RecieveController::class, 'heartbeat'])->name('lotactivity.heartbeat');
    Route::post('/lot-activity/end-session', [RecieveController::class, 'endSession'])->name('lotactivity.end');
    Route::get('/lot-activity/list',         [RecieveController::class, 'getActivity'])->name('lotactivity.list');
    Route::post('recieve', [RecieveController::class, 'store'])->name('recieve.store');

    Route::get('/reports/receiving', [ReportController::class, 'receivingReport'])->name('report.receiving');
    Route::get('/reports/kits-inventory', [ReportController::class, 'kitsInventoryReport'])->name('report.kitsinventory');

    Route::get('/reports/unboxing', [PartsController::class, 'unboxingReport'])->name('report.unboxing');
    Route::get('/parts/lot-progress', [PartsController::class, 'getLotProgress'])->name('parts.lotprogress');
    Route::get('/parts/identify', [PartsController::class, 'identifyPart'])->name('parts.identify');
    Route::post('/unbox-activity/heartbeat',   [PartsController::class, 'heartbeat'])->name('unboxactivity.heartbeat');
    Route::post('/unbox-activity/end-session', [PartsController::class, 'endSession'])->name('unboxactivity.end');
    Route::get('/parts/find-case', [PartsController::class, 'findCase'])->name('parts.findcase');
    Route::get('/parts/suggestions', [PartsController::class, 'searchPartSuggestions'])->name('parts.suggestions');


    Route::get('linefeeding', [LinefeedingController::class, 'index'])->name('linefeeding');
    Route::get('/stations/by-lot', [LinefeedingController::class, 'getstationsbylot'])->name('stations.getBylot');
    Route::get('/lfeed/parts-for-station', [LineFeedingController::class, 'getPartsForStation'])->name('lfeed.parts');
Route::post('/lfeed/confirm-tech',      [LineFeedingController::class, 'confirmStationTech'])->name('lfeed.confirm');
Route::post('/lfeed/complete-station',  [LineFeedingController::class, 'completeStation'])->name('lfeed.complete');
Route::post('/lfeed/save-row', [LineFeedingController::class, 'saveLineFeedingRow'])->name('lfeed.saverow');
Route::get('/reports/line-feeding', [LineFeedingController::class, 'lineFeedingReport'])->name('report.linefeeding');

Route::get('/dashboard/data', [DashboardController::class, 'getDashboardData'])->name('dashboard.data');






Route::post('/session/ping', function () {
    // Touching the session is enough to reset its expiry
    session(['last_ping' => now()]);
    return response()->json(['ok' => true]);
})->middleware('auth')->name('session.ping');

});



require __DIR__.'/auth.php';