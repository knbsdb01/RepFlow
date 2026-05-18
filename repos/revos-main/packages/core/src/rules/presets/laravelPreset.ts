import { RevosConfig } from "../../types/RevosConfig.js";

export const laravelPreset: RevosConfig = {
  forbiddenImports: [
    {
      id: "laravel-controller-no-model",
      from: "/app/Http/Controllers/",
      to: "/app/Models/",
      severity: "high",
      title: "Laravel controller imports model directly",
      message:
        "A Laravel controller is importing an Eloquent model directly. This can put data access and business logic inside the HTTP layer.",
      suggestedFix:
        "Move model access into a service, action, query object, or repository, then make the controller depend on that abstraction."
    },
    {
      id: "laravel-controller-no-db-facade",
      from: "/app/Http/Controllers/",
      to: "[external] Illuminate\\Support\\Facades\\DB",
      severity: "high",
      title: "Laravel controller accesses DB facade directly",
      message:
        "A Laravel controller is importing the DB facade directly. This couples the HTTP layer to database access.",
      suggestedFix:
        "Move DB queries into a service, action, repository, or dedicated data access class."
    },
    {
      id: "laravel-controller-no-mail-facade",
      from: "/app/Http/Controllers/",
      to: "[external] Illuminate\\Support\\Facades\\Mail",
      severity: "medium",
      title: "Laravel controller sends mail directly",
      message:
        "A Laravel controller is importing the Mail facade directly. This can mix HTTP request handling with notification delivery.",
      suggestedFix:
        "Move mail sending into a service, action, job, listener, or notification class."
    },
    {
      id: "laravel-controller-no-queue-facade",
      from: "/app/Http/Controllers/",
      to: "[external] Illuminate\\Support\\Facades\\Queue",
      severity: "medium",
      title: "Laravel controller dispatches queue jobs directly",
      message:
        "A Laravel controller is importing the Queue facade directly. Controllers should avoid owning queue orchestration details.",
      suggestedFix:
        "Move queue dispatching into an application service, action, listener, or dedicated dispatching class."
    },
    {
      id: "laravel-controller-no-event-facade",
      from: "/app/Http/Controllers/",
      to: "[external] Illuminate\\Support\\Facades\\Event",
      severity: "medium",
      title: "Laravel controller dispatches events directly",
      message:
        "A Laravel controller is importing the Event facade directly. This can make the HTTP layer responsible for domain or application events.",
      suggestedFix:
        "Move event dispatching into an application service, domain service, listener, or action."
    },
    {
      id: "laravel-controller-no-storage-facade",
      from: "/app/Http/Controllers/",
      to: "[external] Illuminate\\Support\\Facades\\Storage",
      severity: "medium",
      title: "Laravel controller accesses storage directly",
      message:
        "A Laravel controller is importing the Storage facade directly. This mixes HTTP concerns with filesystem or object storage details.",
      suggestedFix:
        "Move storage access into a service, adapter, or infrastructure class."
    },
    {
      id: "laravel-controller-no-http-client",
      from: "/app/Http/Controllers/",
      to: "[external] Illuminate\\Support\\Facades\\Http",
      severity: "medium",
      title: "Laravel controller calls external HTTP services directly",
      message:
        "A Laravel controller is importing the Http facade directly. This couples request handling to external service integration details.",
      suggestedFix:
        "Move external HTTP calls into a client, service, adapter, or integration class."
    },
    {
      id: "laravel-controller-no-cache-facade",
      from: "/app/Http/Controllers/",
      to: "[external] Illuminate\\Support\\Facades\\Cache",
      severity: "low",
      title: "Laravel controller accesses cache directly",
      message:
        "A Laravel controller is importing the Cache facade directly. This can mix request handling with caching policy.",
      suggestedFix:
        "Move caching behavior into a service, repository, query object, or dedicated cache adapter."
    },
    {
      id: "laravel-controller-no-config-facade",
      from: "/app/Http/Controllers/",
      to: "[external] Illuminate\\Support\\Facades\\Config",
      severity: "low",
      title: "Laravel controller reads configuration directly",
      message:
        "A Laravel controller is importing the Config facade directly. This can make request handling depend on low-level configuration details.",
      suggestedFix:
        "Inject configuration through services or move configuration usage closer to the infrastructure boundary."
    },
    {
      id: "laravel-controller-no-repository",
      from: "/app/Http/Controllers/",
      to: "/app/Repositories/",
      severity: "medium",
      title: "Laravel controller imports repository directly",
      message:
        "A Laravel controller is importing a repository directly. Controllers should coordinate requests and delegate application logic.",
      suggestedFix:
        "Move repository usage into a service or action, then inject that service into the controller."
    },
    {
      id: "laravel-controller-no-infrastructure-src",
      from: "/app/Http/Controllers/",
      to: "/src/Infrastructure/",
      severity: "high",
      title: "Laravel controller imports infrastructure directly",
      message:
        "A Laravel controller is importing infrastructure code directly. In layered architectures, controllers should call application services rather than technical adapters.",
      suggestedFix:
        "Move infrastructure usage behind an application service, use case, or interface."
    },
    {
      id: "laravel-controller-no-infrastructure-app",
      from: "/app/Http/Controllers/",
      to: "/app/Infrastructure/",
      severity: "high",
      title: "Laravel controller imports infrastructure directly",
      message:
        "A Laravel controller is importing infrastructure code directly. In layered architectures, controllers should call application services rather than technical adapters.",
      suggestedFix:
        "Move infrastructure usage behind an application service, use case, or interface."
    },
    {
      id: "laravel-model-no-controller",
      from: "/app/Models/",
      to: "/app/Http/Controllers/",
      severity: "high",
      title: "Laravel model imports controller",
      message:
        "A Laravel model is importing a controller. Domain and persistence code should not depend on the HTTP layer.",
      suggestedFix:
        "Move shared logic into a service, policy, observer, or domain class that both layers can depend on safely."
    },
    {
      id: "laravel-model-no-db-facade",
      from: "/app/Models/",
      to: "[external] Illuminate\\Support\\Facades\\DB",
      severity: "medium",
      title: "Laravel model accesses DB facade directly",
      message:
        "A Laravel model is importing the DB facade directly. This can mix Eloquent model behavior with raw persistence logic.",
      suggestedFix:
        "Move raw queries into a repository, query object, scope, or infrastructure class."
    },
    {
      id: "laravel-model-no-request",
      from: "/app/Models/",
      to: "[external] Illuminate\\Http\\Request",
      severity: "high",
      title: "Laravel model depends on HTTP request",
      message:
        "A Laravel model is importing the HTTP request object. Models should not depend on request handling details.",
      suggestedFix:
        "Pass plain values into the model or move request-specific logic into controllers, form requests, or services."
    },
    {
      id: "laravel-job-no-controller",
      from: "/app/Jobs/",
      to: "/app/Http/Controllers/",
      severity: "high",
      title: "Laravel job imports controller",
      message:
        "A Laravel job is importing a controller. Background jobs should not depend on HTTP controllers.",
      suggestedFix:
        "Move reusable logic into a service or action and call it from both the job and the controller."
    },
    {
      id: "laravel-job-no-request",
      from: "/app/Jobs/",
      to: "[external] Illuminate\\Http\\Request",
      severity: "high",
      title: "Laravel job depends on HTTP request",
      message:
        "A Laravel job is importing the HTTP request object. Background jobs should not depend on HTTP request lifecycle objects.",
      suggestedFix:
        "Pass serializable data into the job instead of passing request objects."
    }
  ]
};
