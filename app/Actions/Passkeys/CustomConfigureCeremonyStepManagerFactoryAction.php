<?php
// app/Actions/Passkeys/CustomConfigureCeremonyStepManagerFactoryAction.php

namespace App\Actions\Passkeys;

use Spatie\LaravelPasskeys\Actions\ConfigureCeremonyStepManagerFactoryAction;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;

class CustomConfigureCeremonyStepManagerFactoryAction extends ConfigureCeremonyStepManagerFactoryAction
{
    public function execute(): CeremonyStepManagerFactory
    {
        $csmFactory = parent::execute();

        if (app()->environment('local')) {
            $csmFactory->setAllowedOrigins([
                'http://localhost',
            ]);
        }

        return $csmFactory;
    }
}