import { describe, expect, it } from "vitest";
import {
  extractPhpDependencies,
  extractPhpFullyQualifiedReferences,
  extractPhpShortClassReferences,
  extractPhpStaticClassReferences,
  extractPhpUseImports,
  extractPhpUseStatements
} from "../extractImports.js";

describe("extractPhpUseStatements", () => {
  it("extracts normal PHP use statements", () => {
    const source = `
      <?php

      namespace App\\Http\\Controllers;

      use App\\Services\\UserService;
      use App\\Models\\User;
      use Illuminate\\Support\\Facades\\DB;

      class UserController {}
    `;

    expect(extractPhpUseStatements(source)).toEqual([
      "App\\Services\\UserService",
      "App\\Models\\User",
      "Illuminate\\Support\\Facades\\DB"
    ]);
  });

  it("extracts use imports with aliases", () => {
    const source = `
      <?php

      use App\\Services\\UserService as Users;
      use Illuminate\\Support\\Facades\\DB as Database;
    `;

    expect(extractPhpUseImports(source)).toEqual([
      {
        namespace: "App\\Services\\UserService",
        alias: "Users"
      },
      {
        namespace: "Illuminate\\Support\\Facades\\DB",
        alias: "Database"
      }
    ]);

    expect(extractPhpUseStatements(source)).toEqual([
      "App\\Services\\UserService",
      "Illuminate\\Support\\Facades\\DB"
    ]);
  });

  it("extracts grouped use statements", () => {
    const source = `
      <?php

      use App\\Services\\{UserService, BillingService};
    `;

    expect(extractPhpUseStatements(source)).toEqual([
      "App\\Services\\UserService",
      "App\\Services\\BillingService"
    ]);
  });

  it("extracts grouped use statements with aliases", () => {
    const source = `
      <?php

      use App\\Services\\{UserService as Users, BillingService};
    `;

    expect(extractPhpUseImports(source)).toEqual([
      {
        namespace: "App\\Services\\UserService",
        alias: "Users"
      },
      {
        namespace: "App\\Services\\BillingService",
        alias: "BillingService"
      }
    ]);
  });

  it("ignores commented use statements", () => {
    const source = `
      <?php

      // use App\\Bad\\CommentedClass;
      # use App\\Bad\\AnotherCommentedClass;
      /*
        use App\\Bad\\BlockCommentedClass;
      */

      use App\\Good\\RealClass;
    `;

    expect(extractPhpUseStatements(source)).toEqual([
      "App\\Good\\RealClass"
    ]);
  });
});

describe("extractPhpFullyQualifiedReferences", () => {
  it("extracts fully-qualified class references", () => {
    const source = `
      <?php

      class UserController
      {
          public function index()
          {
              \\Illuminate\\Support\\Facades\\DB::table("users")->get();

              $service = new \\App\\Services\\UserService();

              return \\Domain\\Users\\Application\\CreateUser::handle();
          }
      }
    `;

    expect(extractPhpFullyQualifiedReferences(source)).toEqual([
      "Illuminate\\Support\\Facades\\DB",
      "App\\Services\\UserService",
      "Domain\\Users\\Application\\CreateUser"
    ]);
  });

  it("ignores fully-qualified references inside comments", () => {
    const source = `
      <?php

      // \\App\\Bad\\CommentedClass::run();

      /*
        new \\App\\Bad\\BlockCommentedClass();
      */

      $service = new \\App\\Good\\RealClass();
    `;

    expect(extractPhpFullyQualifiedReferences(source)).toEqual([
      "App\\Good\\RealClass"
    ]);
  });
});

describe("extractPhpStaticClassReferences", () => {
  it("extracts namespaced static class references without leading slash", () => {
    const source = `
      <?php

      return [
          App\\Models\\User::class,
          Domain\\Entities\\User::class,
          Application\\Users\\CreateUser::handle(),
          Illuminate\\Support\\Facades\\DB::table("users"),
      ];
    `;

    expect(extractPhpStaticClassReferences(source)).toEqual([
      "App\\Models\\User",
      "Domain\\Entities\\User",
      "Application\\Users\\CreateUser",
      "Illuminate\\Support\\Facades\\DB"
    ]);
  });

  it("does not extract short class references without namespace", () => {
    const source = `
      <?php

      return [
          User::class,
          DB::table("users"),
      ];
    `;

    expect(extractPhpStaticClassReferences(source)).toEqual([]);
  });

  it("ignores static class references inside comments", () => {
    const source = `
      <?php

      // App\\Bad\\CommentedClass::class

      /*
        Domain\\Bad\\BlockCommentedClass::handle()
      */

      return App\\Good\\RealClass::class;
    `;

    expect(extractPhpStaticClassReferences(source)).toEqual([
      "App\\Good\\RealClass"
    ]);
  });
});

describe("extractPhpShortClassReferences", () => {
  it("resolves short static references through use imports", () => {
    const source = `
      <?php

      use App\\Models\\User;
      use Illuminate\\Support\\Facades\\DB;

      class UserController
      {
          public function index()
          {
              User::class;
              DB::table("users");
          }
      }
    `;

    expect(extractPhpShortClassReferences(source)).toEqual([
      "App\\Models\\User",
      "Illuminate\\Support\\Facades\\DB"
    ]);
  });

  it("resolves short new expressions through use imports", () => {
    const source = `
      <?php

      use App\\Services\\UserService;

      class UserController
      {
          public function index()
          {
              return new UserService();
          }
      }
    `;

    expect(extractPhpShortClassReferences(source)).toEqual([
      "App\\Services\\UserService"
    ]);
  });

  it("resolves aliased short references through use imports", () => {
    const source = `
      <?php

      use App\\Services\\UserService as Users;
      use Illuminate\\Support\\Facades\\DB as Database;

      class UserController
      {
          public function index()
          {
              Users::class;
              Database::table("users");
          }
      }
    `;

    expect(extractPhpShortClassReferences(source)).toEqual([
      "App\\Services\\UserService",
      "Illuminate\\Support\\Facades\\DB"
    ]);
  });

  it("ignores unresolved short references", () => {
    const source = `
      <?php

      class UserController
      {
          public function index()
          {
              User::class;
              DB::table("users");
              return new UserService();
          }
      }
    `;

    expect(extractPhpShortClassReferences(source)).toEqual([]);
  });
});

describe("extractPhpDependencies", () => {
  it("deduplicates use statements and fully-qualified references", () => {
    const source = `
      <?php

      use App\\Services\\UserService;

      class UserController
      {
          public function index()
          {
              $service = new \\App\\Services\\UserService();
              \\Illuminate\\Support\\Facades\\DB::table("users")->get();
          }
      }
    `;

    expect(extractPhpDependencies(source)).toEqual([
      "App\\Services\\UserService",
      "Illuminate\\Support\\Facades\\DB"
    ]);
  });

  it("deduplicates dependencies from use statements, fully-qualified references, static references, and short references", () => {
    const source = `
      <?php

      use App\\Models\\User;
      use Illuminate\\Support\\Facades\\DB;

      class UserController
      {
          public function index()
          {
              \\App\\Models\\User::query()->first();

              App\\Models\\User::class;

              User::class;

              DB::table("users");
          }
      }
    `;

    expect(extractPhpDependencies(source)).toEqual([
      "App\\Models\\User",
      "Illuminate\\Support\\Facades\\DB"
    ]);
  });
});
