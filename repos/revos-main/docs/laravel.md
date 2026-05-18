Laravel and PHP support

Revos supports Laravel and PHP projects through the Laravel plugin.

Plugin location:

packages/plugin-laravel
Supported files
.php
Laravel detection

Revos detects Laravel projects using:

composer.json
laravel/framework dependency
artisan
app/Http/Controllers
Laravel Clean Architecture detection

Revos detects Laravel Clean Architecture-style projects when it finds either:

src/Domain
src/Application
src/Infrastructure

or:

app/Domain
app/Application
app/Infrastructure
Supported PHP imports

The Laravel plugin supports standard PHP use imports:

use App\Services\UserService;
use App\Models\User;
use Illuminate\Support\Facades\DB;

Aliased imports:

use App\Services\UserService as Users;

Grouped imports:

use App\Services\{UserService, BillingService};

Fully-qualified class references:

\Illuminate\Support\Facades\DB::table("users");
new \App\Services\UserService();

Static class references:

App\Models\User::class;
Illuminate\Support\Facades\DB::table("users");

Short class references resolved through use:

use App\Models\User;
use Illuminate\Support\Facades\DB;

User::class;
DB::table("users");
Composer PSR-4 support

Revos reads Composer PSR-4 mappings.

Example:

{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "Domain\\": "src/Domain/",
      "Application\\": "src/Application/",
      "Infrastructure\\": "src/Infrastructure/",
      "Modules\\": "modules/"
    }
  }
}

This allows Revos to resolve imports such as:

use App\Models\User;
use Domain\User\User;
use Application\User\CreateUser;
use Infrastructure\Persistence\UserRepository;

to project files.

External dependencies

External dependencies use this format:

[external] package-name

Laravel and Illuminate dependencies are represented as external framework dependencies when they cannot be resolved to local project files.

Laravel preset

Initialize Laravel rules:

revos init . --preset laravel --force

Scan:

revos scan .

Generate reports:

revos scan . --report all

Fail CI on high severity issues:

revos scan . --report all --fail-on high
Laravel rules

Current Laravel preset rules:

laravel-controller-no-model
laravel-controller-no-db-facade
laravel-controller-no-mail-facade
laravel-controller-no-queue-facade
laravel-controller-no-event-facade
laravel-controller-no-storage-facade
laravel-controller-no-http-client
laravel-controller-no-cache-facade
laravel-controller-no-config-facade
laravel-controller-no-repository
laravel-controller-no-infrastructure-src
laravel-controller-no-infrastructure-app
laravel-model-no-controller
laravel-model-no-db-facade
laravel-model-no-request
laravel-job-no-controller
laravel-job-no-request
Examples of detected Laravel problems
Controller imports Eloquent model
// app/Http/Controllers/UserController.php
use App\Models\User;

Problem:

Controller depends directly on Eloquent model.

Suggested direction:

Move business logic and persistence access into services, actions, or application layer.
Controller uses DB facade
// app/Http/Controllers/UserController.php
use Illuminate\Support\Facades\DB;

Problem:

Controller accesses database facade directly.

Suggested direction:

Move database access into repositories, services, or infrastructure.
Controller imports repository
// app/Http/Controllers/UserController.php
use App\Repositories\UserRepository;

Problem:

Controller depends directly on repository.

Suggested direction:

Introduce an application service/use case between controllers and repositories.
Model imports controller
// app/Models/User.php
use App\Http\Controllers\UserController;

Problem:

Model depends on controller.

Suggested direction:

Keep HTTP/controller concerns outside models.
Job imports request
// app/Jobs/SendWelcomeEmail.php
use Illuminate\Http\Request;

Problem:

Job depends on HTTP request.

Suggested direction:

Pass primitive data or DTOs into jobs instead of HTTP request objects.
Laravel Clean Architecture preset

Initialize Clean Architecture rules:

revos init . --preset laravel-clean-architecture --force

This preset includes all Laravel rules plus Clean Architecture-specific rules.

Additional rules:

laravel-domain-no-laravel-framework-src
laravel-domain-no-laravel-framework-app
laravel-domain-no-eloquent-src
laravel-domain-no-eloquent-app
laravel-application-no-controller-src
laravel-application-no-controller-app
laravel-application-no-eloquent-src
laravel-application-no-eloquent-app
laravel-application-no-facades-src
laravel-application-no-facades-app
laravel-infrastructure-no-controller-src
laravel-infrastructure-no-controller-app
laravel-controller-no-domain-entity-src
laravel-controller-no-domain-entity-app
Examples of detected Clean Architecture problems
Domain imports Laravel
// src/Domain/User/User.php
use Illuminate\Support\Collection;

Problem:

Domain depends on Laravel framework.

Suggested direction:

Keep domain code framework-independent.
Domain imports Eloquent
// src/Domain/User/User.php
use Illuminate\Database\Eloquent\Model;

Problem:

Domain depends on Eloquent.

Suggested direction:

Move persistence concerns into infrastructure.
Application imports controller
// src/Application/User/CreateUser.php
use App\Http\Controllers\UserController;

Problem:

Application layer depends on controller.

Suggested direction:

Application code should expose use cases to controllers, not depend on controllers.
Application imports facades
// src/Application/User/CreateUser.php
use Illuminate\Support\Facades\DB;

Problem:

Application layer depends on Laravel facade.

Suggested direction:

Use interfaces and adapters to keep application logic decoupled from framework details.
Infrastructure imports controller
// src/Infrastructure/Persistence/UserRepository.php
use App\Http\Controllers\UserController;

Problem:

Infrastructure depends on controller.

Suggested direction:

Infrastructure should implement details, not depend on HTTP entrypoints.
Issue deduplication

Revos deduplicates overlapping Laravel issues.

Example:

use Illuminate\Database\Eloquent\Model;

Without deduplication, this could produce both:

Domain depends on Laravel framework
Domain depends on Eloquent

Revos keeps the more specific issue:

Domain depends on Eloquent
Ignoring a Laravel rule

Disable a rule completely:

{
  "ignoreRules": [
    "laravel-controller-no-repository"
  ],
  "forbiddenImports": []
}

Ignore a specific controller exception:

{
  "ignoreIssues": [
    {
      "ruleId": "laravel-controller-no-repository",
      "from": "**/app/Http/Controllers/HealthController.php",
      "to": "**/Repositories/**"
    }
  ],
  "forbiddenImports": []
}
