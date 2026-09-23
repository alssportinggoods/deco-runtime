import fs from "node:fs";

const imp = JSON.parse(fs.readFileSync(".understand-anything/tmp/batch-input-4.json", "utf8")).batchImportData;

const nodes = [];
const edges = [];

function fileNode(path, summary, tags, complexity, languageNotes) {
  const name = path.split("/").pop();
  const n = { id: `file:${path}`, type: "file", name, filePath: path, summary, tags, complexity };
  if (languageNotes) n.languageNotes = languageNotes;
  nodes.push(n);
}
function fnNode(path, fname, range, summary, tags, complexity) {
  nodes.push({ id: `function:${path}:${fname}`, type: "function", name: fname, filePath: path, lineRange: range, summary, tags, complexity });
  edges.push({ source: `file:${path}`, target: `function:${path}:${fname}`, type: "contains", direction: "forward", weight: 1.0 });
}
function clsNode(path, cname, range, summary, tags, complexity) {
  nodes.push({ id: `class:${path}:${cname}`, type: "class", name: cname, filePath: path, lineRange: range, summary, tags, complexity });
  edges.push({ source: `file:${path}`, target: `class:${path}:${cname}`, type: "contains", direction: "forward", weight: 1.0 });
}
function exp(path, kind, name) {
  edges.push({ source: `file:${path}`, target: `${kind}:${path}:${name}`, type: "exports", direction: "forward", weight: 0.8 });
}

// import edges for all files
for (const [src, targets] of Object.entries(imp)) {
  for (const t of targets) {
    edges.push({ source: `file:${src}`, target: `file:${t}`, type: "imports", direction: "forward", weight: 0.7 });
  }
}

// ---- File nodes + significant fn/class nodes ----

fileNode("engine/core/resolver.ts", "Core resolver engine that executes resolvables — composable async operations with field-level resolution, resolve chains, middleware, monitoring timings, and dangling-reference recovery.", ["service", "engine", "resolver", "async", "core"], "complex", "Heavy use of recursive generic resolution and resolve-chain threading via FieldResolver.");
clsNode("engine/core/resolver.ts", "DanglingReference", [9,15], "Error class representing an unresolvable reference encountered during resolution.", ["error", "resolver", "type-definition"], "simple");
exp("engine/core/resolver.ts","class","DanglingReference");
fnNode("engine/core/resolver.ts","resolvePropsWithHints",[360,436],"Recursively resolves nested props using precomputed hints, parallelizing resolution of resolvable sub-trees.","resolver async recursion".split(" "),"complex");
fnNode("engine/core/resolver.ts","invokeResolverWithProps",[441,587],"Invokes a resolver function with resolved props, building a resolver id, recording timings/metrics, and handling awaitable results.","resolver invocation monitoring".split(" "),"complex");
fnNode("engine/core/resolver.ts","resolveWithType",[594,649],"Resolves a value by its __resolveType, dispatching to the matching resolver and handling dangling references.","resolver dispatch".split(" "),"complex");
fnNode("engine/core/resolver.ts","resolveResolvable",[651,673],"Resolves a named resolvable from the resolvables map, traversing and resolving its contents.","resolver async".split(" "),"moderate");
fnNode("engine/core/resolver.ts","resolveAny",[675,700],"Generic entry that resolves any value, recursing into props or traversing plain structures.","resolver recursion".split(" "),"moderate");
exp("engine/core/resolver.ts","function","resolveAny");
fnNode("engine/core/resolver.ts","resolve",[740,775],"Top-level resolve function that dispatches a maybe-resolvable to the appropriate resolution strategy.","resolver entry-point".split(" "),"moderate");
exp("engine/core/resolver.ts","function","resolve");
exp("engine/core/resolver.ts","function","isResolvable");
exp("engine/core/resolver.ts","function","withResolveChain");
exp("engine/core/resolver.ts","function","withResolveChainOfType");

fileNode("engine/core/utils.ts","Utility helpers for the resolver engine: awaitable detection, object key mapping, async key resolution, primitive checks, and single-flight deduplication.","utility async engine resolver".split(" "),"moderate");
fnNode("engine/core/utils.ts","mapObjKeys",[12,26],"Maps each value of an object through a mapper, preserving keys.","utility object".split(" "),"simple");
fnNode("engine/core/utils.ts","waitKeys",[32,44],"Awaits all awaitable values of an object's keys and returns a resolved object.","utility async".split(" "),"simple");
fnNode("engine/core/utils.ts","singleFlight",[67,82],"Creates a single-flight wrapper that deduplicates concurrent calls keyed by argument.","utility async deduplication".split(" "),"simple");
exp("engine/core/utils.ts","function","singleFlight");
exp("engine/core/utils.ts","function","isAwaitable");
exp("engine/core/utils.ts","function","mapObjKeys");
exp("engine/core/utils.ts","function","waitKeys");

fileNode("engine/errors.ts","Re-exports HTTP error helpers and types (badRequest, forbidden, notFound, redirect, etc.) used to signal HTTP-level errors from blocks.","error http barrel type-definition".split(" "),"simple");

fileNode("engine/integrity.ts","Recursively verifies that every __resolveType reference in the resolvables tree points to a registered resolver, warning on missing ones.","validation integrity resolver".split(" "),"simple");
fnNode("engine/integrity.ts","integrityCheckRec",[4,33],"Recursively walks resolvables checking each __resolveType against the resolver map and warning on dangling references.","validation recursion".split(" "),"moderate");
exp("engine/integrity.ts","function","integrityCheck");

fileNode("engine/manifest/defaults.ts","Default resolvers and preview/invoke prefix keys for the manifest, including deferred resolvable creation.","manifest resolver defaults factory".split(" "),"complex");
fnNode("engine/manifest/defaults.ts","createDeferred",[25,46],"Builds a deferred resolvable that lazily invokes a resolve function with the captured props and resolve chain.","resolver deferred factory".split(" "),"moderate");

fileNode("engine/manifest/fresh.ts","Fresh framework manifest glue that wires default resolvers into a Fresh-compatible manifest.","manifest fresh integration".split(" "),"simple");

fileNode("engine/manifest/manifest.ts","Builds and fulfills the Deco runtime context from a manifest: installs apps, resolves the decofile provider, merges runtimes/import maps, and wires the resolver.","manifest context app-installation engine core".split(" "),"complex","Orchestrates async app installation with mutexes and deferred promises.");
fnNode("engine/manifest/manifest.ts","installAppsForResolver",[132,264],"Resolves and installs all installable apps against a resolver, merging their manifests and reporting installed blocks.","manifest app-installation resolver".split(" "),"complex");
fnNode("engine/manifest/manifest.ts","fulfillContext",[265,401],"Fulfills a Deco context by resolving the decofile provider, installing apps, building import maps, and running integrity checks.","manifest context async".split(" "),"complex");
exp("engine/manifest/manifest.ts","function","fulfillContext");
fnNode("engine/manifest/manifest.ts","newContext",[403,427],"Creates a fresh Deco runtime context with a generated instance id and site details.","manifest context factory".split(" "),"moderate");
exp("engine/manifest/manifest.ts","function","newContext");
fnNode("engine/manifest/manifest.ts","$live",[429,469],"Legacy entry that bootstraps a live runtime from a manifest, site info, and release provider.","manifest entry-point bootstrap".split(" "),"moderate");
exp("engine/manifest/manifest.ts","function","$live");
fnNode("engine/manifest/manifest.ts","findResolver",[471,497],"Walks the resolvable chain to find the concrete resolver for a resolve type, guarding against cycles.","resolver lookup".split(" "),"moderate");
fnNode("engine/manifest/manifest.ts","buildDanglingRecover",[90,105],"Builds a recovery function that attempts to recover dangling references via registered recovers.","resolver recovery".split(" "),"simple");
exp("engine/manifest/manifest.ts","function","buildDanglingRecover");
fnNode("engine/manifest/manifest.ts","siteName",[108,119],"Resolves the active site name from context, environment, or namespace.","utility config".split(" "),"simple");
exp("engine/manifest/manifest.ts","function","siteName");
exp("engine/manifest/manifest.ts","function","initContext");

fileNode("engine/manifest/utils.ts","Generates a random human-readable site name using a unique-names generator.","utility manifest naming".split(" "),"simple");

fileNode("engine/middleware.ts","Provides a Koa-style middleware composition function for chaining resolver middlewares.","middleware composition resolver".split(" "),"simple");
fnNode("engine/middleware.ts","compose",[17,39],"Composes an array of middlewares into a single dispatch chain with next() semantics.","middleware composition".split(" "),"moderate");
exp("engine/middleware.ts","function","compose");

fileNode("hooks/useDevice.ts","Preact hook that returns the current device (mobile/tablet/desktop) from section context.","hook preact device component".split(" "),"simple");
exp("hooks/useDevice.ts","function","useDevice");

fileNode("hooks/useSection.ts","Preact hook and helpers that build a stable, cacheable href for re-rendering a section partial, managing allowed/blocked query strings and segment hashing.","hook preact section htmx caching".split(" "),"moderate");
fnNode("hooks/useSection.ts","createStableHref",[78,95],"Normalizes a href by filtering query strings against allow/block lists and sorting them for cache stability.","hook url caching".split(" "),"moderate");
fnNode("hooks/useSection.ts","useSection",[105,148],"Hook that produces props and a stable href to trigger a partial section render via HTMX.","hook preact section".split(" "),"moderate");
exp("hooks/useSection.ts","function","useSection");

fileNode("hooks/useSetEarlyHints.ts","Preact hook that appends HTTP early-hint (Link) headers to the section response.","hook preact early-hints http".split(" "),"simple");
exp("hooks/useSetEarlyHints.ts","function","useSetEarlyHints");

fileNode("runtime/features/invoke.ts","Runtime invoke feature that converts invocation payloads into resolvables and executes single or batch invocations with error wrapping and observability.","invoke runtime resolver observability".split(" "),"moderate");
fnNode("runtime/features/invoke.ts","payloadToResolvable",[55,82],"Recursively converts an invocation payload (function ref, array, or object) into a resolvable structure.","invoke serialization recursion".split(" "),"moderate");
exp("runtime/features/invoke.ts","function","payloadToResolvable");
fnNode("runtime/features/invoke.ts","batchInvoke",[91,101],"Resolves a batch invocation payload, wrapping errors with a correlation id.","invoke batch".split(" "),"simple");
exp("runtime/features/invoke.ts","function","batchInvoke");
fnNode("runtime/features/invoke.ts","invoke",[112,129],"Resolves a single invocation by key with props and selection, wrapping errors.","invoke entry-point".split(" "),"simple");
exp("runtime/features/invoke.ts","function","invoke");
fnNode("runtime/features/invoke.ts","wrapInvokeErr",[13,42],"Logs and rethrows invocation errors enriched with a correlation id and path.","error logging invoke".split(" "),"moderate");
exp("runtime/features/invoke.ts","function","wrapInvokeErr");

fileNode("runtime/utils.ts","Builds the base request-scoped runtime state (vary, response headers, flags) from the active Deco context.","runtime state utility".split(" "),"simple");
fnNode("runtime/utils.ts","baseState",[6,25],"Constructs the base loader/request state including vary tracking and response headers.","runtime state factory".split(" "),"simple");
exp("runtime/utils.ts","function","baseState");

fileNode("types.ts","Central public type re-exports for the framework: App, AppContext, AppManifest, FnContext, SectionProps, ResolveFunc, and related block types.","type-definition barrel public-api".split(" "),"moderate");

fileNode("utils/invoke.server.ts","Server-side invoke helpers that build typed invocation functions and sanitize/serialize payloads for resolver execution.","invoke server serialization factory".split(" "),"moderate");
fnNode("utils/invoke.server.ts","buildInvokeFunc",[24,57],"Builds a typed invoke function bound to a resolver, options, and partial context.","invoke factory server".split(" "),"moderate");
exp("utils/invoke.server.ts","function","buildInvokeFunc");
fnNode("utils/invoke.server.ts","payloadForFunc",[12,22],"Sanitizes and shapes a function reference into an invocation payload.","invoke serialization".split(" "),"simple");
exp("utils/invoke.server.ts","function","payloadForFunc");

fileNode("utils/invoke.types.ts","Type-level machinery deriving available invocations and invocation function signatures from an app manifest.","type-definition invoke generics".split(" "),"complex","Heavy conditional/mapped type usage to derive invocation signatures from manifests.");

fileNode("utils/metabase.tsx","Renders a Metabase dashboard preview as an embedded iframe for block previews.","component preview metabase".split(" "),"simple");
fnNode("utils/metabase.tsx","metabasePreview",[10,22],"Returns a JSX iframe element embedding a Metabase dashboard at the given source URL.","component preview".split(" "),"simple");
exp("utils/metabase.tsx","function","metabasePreview");

fileNode("utils/object.ts","Object path utilities for picking nested values by path, building objects from path/value pairs, and safe try-or-default execution.","utility object path serialization".split(" "),"moderate");
fnNode("utils/object.ts","pickPath",[34,69],"Recursively picks a value from a nested object/array following a dot/bracket path.","utility object recursion".split(" "),"moderate");
fnNode("utils/object.ts","pickPaths",[100,112],"Picks multiple paths from an object, returning a flattened selection.","utility object".split(" "),"simple");
exp("utils/object.ts","function","pickPaths");
fnNode("utils/object.ts","buildObj",[118,138],"Reconstructs a nested object/array structure from a flattened path/value pair.","utility object serialization".split(" "),"moderate");
exp("utils/object.ts","function","buildObj");
exp("utils/object.ts","function","identity");
exp("utils/object.ts","function","tryOrDefault");

fileNode("utils/promise.ts","Creates a deferred promise object exposing resolve/reject and a settled state flag.","utility promise async".split(" "),"simple");
fnNode("utils/promise.ts","deferred",[32,47],"Builds a deferred with externally accessible resolve/reject and a resolved-state property.","utility promise async".split(" "),"simple");
exp("utils/promise.ts","function","deferred");

fileNode("utils/segment.ts","Computes a stable segment hash for a request from cookies, flags, and release revision for cache keying.","utility segment caching hashing".split(" "),"moderate");
fnNode("utils/segment.ts","segmentFor",[12,51],"Builds a deterministic segment hash from sorted segment cookies, flags, and release revision.","utility hashing caching".split(" "),"moderate");
exp("utils/segment.ts","function","segmentFor");

fileNode("utils/sync.ts","Provides a once wrapper that runs a callback a single time, caching its (possibly async) result.","utility async memoization".split(" "),"simple");
fnNode("utils/sync.ts","once",[14,31],"Wraps a callback so it executes only once, caching and replaying the result on subsequent calls.","utility memoization async".split(" "),"simple");
exp("utils/sync.ts","function","once");

fileNode("utils/userAgent.ts","User-agent parsing helpers that detect device type and identify bot requests.","utility user-agent device bot-detection".split(" "),"moderate");
fnNode("utils/userAgent.ts","deviceOf",[18,33],"Determines the device type from a request's user-agent and optional query override.","utility user-agent device".split(" "),"moderate");
exp("utils/userAgent.ts","function","deviceOf");
fnNode("utils/userAgent.ts","isBot",[39,55],"Detects whether a request originates from a known bot via user-agent inspection.","utility bot-detection user-agent".split(" "),"moderate");
exp("utils/userAgent.ts","function","isBot");

fileNode("utils/vary.ts","Builds a Vary tracker accumulating the request dimensions a response depends on for cache segmentation.","utility vary caching".split(" "),"simple");
fnNode("utils/vary.ts","vary",[17,33],"Creates a vary accumulator that records and serializes the keys a response varies on.","utility vary caching factory".split(" "),"simple");
exp("utils/vary.ts","function","vary");

// cross-batch semantic edges (high confidence from neighborMap)
edges.push({source:"file:engine/integrity.ts",target:"function:engine/core/resolver.ts:isResolvable",type:"calls",direction:"forward",weight:0.8});
edges.push({source:"function:runtime/features/invoke.ts:payloadToResolvable",target:"function:utils/invoke.server.ts:payloadForFunc",type:"calls",direction:"forward",weight:0.8});

fs.writeFileSync(".understand-anything/tmp/ua-batch4-graph.json", JSON.stringify({nodes,edges}));
console.log("nodes", nodes.length, "edges", edges.length);
const impCount = Object.values(imp).reduce((a,t)=>a+t.length,0);
console.log("importEdges expected", impCount);
