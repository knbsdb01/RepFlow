import { RevosConfig } from "../../types/RevosConfig.js";

export const nextjsPreset: RevosConfig = {
  forbiddenImports: [
    {
      id: "components-no-prisma",
      from: "/components/",
      to: "[external] @prisma/client",
      severity: "high",
      title: "React component accesses Prisma directly",
      message:
        "A UI component is importing Prisma directly. Frontend components should not access the database.",
      suggestedFix:
        "Move database access into a server action, route handler, or backend service."
    },
    {
      id: "components-no-node-builtins",
      from: "/components/",
      to: "[external] node:",
      severity: "high",
      title: "React component imports Node.js API",
      message:
        "A React component is importing a Node.js built-in module. Components that run in the browser should not depend on server-only APIs.",
      suggestedFix:
        "Move Node.js usage into a server component, route handler, server action, or backend service."
    },
    {
      id: "client-no-prisma",
      from: "/client/",
      to: "[external] @prisma/client",
      severity: "high",
      title: "Client code accesses Prisma directly",
      message:
        "Client-side code is importing Prisma directly. Database clients must not be bundled into client code.",
      suggestedFix:
        "Move database access into a server-side module, API route, server action, or backend service."
    },
    {
      id: "client-no-node-builtins",
      from: "/client/",
      to: "[external] node:",
      severity: "high",
      title: "Client code imports Node.js API",
      message:
        "Client-side code is importing a Node.js built-in module. This can break browser bundles and leak server-only assumptions.",
      suggestedFix:
        "Move Node.js-specific logic into server-side code and expose only safe data to the client."
    },
    {
      id: "app-no-prisma",
      from: "/app/",
      to: "[external] @prisma/client",
      severity: "medium",
      title: "Next.js app layer imports Prisma directly",
      message:
        "A Next.js app file is importing Prisma directly. This can mix routing, rendering, or page concerns with persistence access.",
      suggestedFix:
        "Move Prisma usage into a dedicated server-side data access module, service, or repository."
    },
    {
      id: "pages-no-prisma",
      from: "/pages/",
      to: "[external] @prisma/client",
      severity: "medium",
      title: "Next.js pages layer imports Prisma directly",
      message:
        "A Next.js pages file is importing Prisma directly. Page code should avoid owning database access directly.",
      suggestedFix:
        "Move Prisma usage into a server-side service, data access module, or API route."
    },
    {
      id: "app-no-repository",
      from: "/app/",
      to: "/repositories/",
      severity: "medium",
      title: "Next.js app layer imports repository directly",
      message:
        "A Next.js app file is importing a repository directly. This can mix routing/UI concerns with persistence logic.",
      suggestedFix:
        "Move data access into a dedicated server-side service or action."
    },
    {
      id: "client-no-server",
      from: "/client/",
      to: "/server/",
      severity: "high",
      title: "Client code imports server code",
      message:
        "Client-side code is importing server-side code. This can cause bundling issues and leak server-only logic.",
      suggestedFix:
        "Expose server functionality through an API route, server action, or shared interface."
    },
    {
      id: "middleware-no-prisma",
      from: "/middleware.",
      to: "[external] @prisma/client",
      severity: "high",
      title: "Next.js middleware accesses Prisma directly",
      message:
        "Next.js middleware is importing Prisma directly. Middleware usually runs in an edge/runtime-sensitive context and should not access database clients directly.",
      suggestedFix:
        "Move database access out of middleware and use lightweight checks, signed tokens, or server-side route handlers instead."
    },
    {
      id: "middleware-no-database",
      from: "/middleware.",
      to: "/repositories/",
      severity: "high",
      title: "Next.js middleware imports repository",
      message:
        "Next.js middleware is importing repository code. Middleware should stay lightweight and avoid persistence access.",
      suggestedFix:
        "Move persistence logic into route handlers, server actions, or backend services."
    },
    {
      id: "domain-no-next",
      from: "/domain/",
      to: "[external] next/",
      severity: "high",
      title: "Domain depends on Next.js",
      message:
        "Domain code is importing Next.js APIs. Business logic should not depend on the web framework.",
      suggestedFix:
        "Move Next.js-specific code into app routes, pages, handlers, or adapters."
    },
    {
      id: "domain-no-react",
      from: "/domain/",
      to: "[external] react",
      severity: "high",
      title: "Domain depends on React",
      message:
        "Domain code is importing React. Business logic should stay independent from UI framework concerns.",
      suggestedFix:
        "Move React-specific code into components, UI adapters, or presentation modules."
    }
  ]
};
