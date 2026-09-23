import fs from "fs";
const root = "C:/Users/vitoo/code/als/deco";
const inp = JSON.parse(fs.readFileSync(root + "/.understand-anything/tmp/batch-input-3.json", "utf8"));
const bid = inp.batchImportData;

const fileMeta = {
"blocks/account.ts": { summary: "Defines the Account block type, registering accounts as a serializable, configurable block in the Deco engine.", tags: ["data-model", "block-definition", "engine"], complexity: "simple" },
"blocks/action.ts": { summary: "Defines the Action block type for server-side mutations, wiring it into the engine block registry with preview support.", tags: ["block-definition", "action", "engine"], complexity: "simple" },
"blocks/app.ts": { summary: "Implements the App block: merges app manifests and runtimes, injects app state into loaders and resolvers, and builds composed app runtimes from dependencies.", tags: ["block-definition", "app", "manifest", "runtime"], complexity: "complex", languageNotes: "Heavy use of generics and manifest-merging type gymnastics over DecoManifest." },
"blocks/appsUtil.ts": { summary: "Utility helpers for building app runtimes: resolves blocks into resolvers, handles local module references, and composes manifests with import maps.", tags: ["utility", "app", "manifest", "resolver"], complexity: "moderate" },
"blocks/flag.ts": { summary: "Defines the Flag block for feature toggles, supporting multivariate variants matched by device and user-agent criteria.", tags: ["block-definition", "flag", "feature-toggle"], complexity: "moderate" },
"blocks/function.ts": { summary: "Legacy Function block definition, aliasing handler and loader behavior for backward-compatible block resolution.", tags: ["block-definition", "legacy", "engine"], complexity: "simple" },
"blocks/handler.ts": { summary: "Defines the Handler block type for custom HTTP endpoints, integrating resolver context and request handling.", tags: ["block-definition", "handler", "http"], complexity: "simple" },
"blocks/index.ts": { summary: "Barrel module aggregating all built-in block definitions and exposing defineBlock for registering user-defined blocks.", tags: ["barrel", "entry-point", "block-definition"], complexity: "simple" },
"blocks/loader.ts": { summary: "Implements the Loader block: async data fetchers with caching, stale-while-revalidate, single-flight dedup, error wrapping, and observability.", tags: ["block-definition", "loader", "caching", "swr", "observability"], complexity: "complex" },
"blocks/matcher.ts": { summary: "Defines the Matcher block for route and audience matching, supporting sticky sessions and cookie-based segment persistence.", tags: ["block-definition", "matcher", "routing"], complexity: "complex" },
"blocks/propsLoader.ts": { summary: "Resolves props for blocks by detecting loader functions versus object loaders and awaiting nested loader keys.", tags: ["loader", "props", "resolver", "utility"], complexity: "moderate" },
"blocks/section.ts": { summary: "Defines the Section block factory, wrapping Preact components with prop loading, error boundaries, and preview rendering.", tags: ["block-definition", "section", "component", "preact"], complexity: "complex" },
"blocks/utils.tsx": { summary: "Shared block utilities: applying props and config, building FnContext from HTTP context, single-flight groups, import-map building, and visibility gatekeeping.", tags: ["utility", "block-helpers", "context", "import-map"], complexity: "complex" },
"blocks/workflow.ts": { summary: "Defines the Workflow block and WorkflowContext, enabling durable invocation of loaders and actions within workflow execution.", tags: ["block-definition", "workflow", "durable"], complexity: "moderate" },
"clients/formdata.ts": { summary: "Bidirectional conversion between block props objects and FormData, with dot-escaping for nested keys and file handling.", tags: ["serialization", "formdata", "utility"], complexity: "moderate" },
"clients/proxy.ts": { summary: "Builds typed proxy invokers via InvokeAwaiter, deferring invocation until awaited and routing through the manifest invoke handler.", tags: ["client", "proxy", "invoke"], complexity: "moderate" },
"clients/withManifest.ts": { summary: "Typed manifest client: invokes loaders and actions over HTTP with prop serialization, streaming detection, batch invoke, and proxy generation.", tags: ["client", "invoke", "manifest", "http"], complexity: "complex" },
"components/JsonViewer.tsx": { summary: "Preact component rendering a collapsible JSON tree using jQuery JSONView loaded from CDN, used for block previews.", tags: ["component", "preact", "debug", "preview"], complexity: "simple" },
"components/PreviewNotAvailable.tsx": { summary: "Fallback Preact component shown when a block has no preview implementation.", tags: ["component", "preact", "preview"], complexity: "simple" },
"components/StubSection.tsx": { summary: "Minimal stub section components used as placeholders during section rendering.", tags: ["component", "preact", "section", "stub"], complexity: "simple" },
"components/section.tsx": { summary: "Core section rendering wrapper: provides SectionContext, error boundary, device detection, preview handling, and lazy section hydration.", tags: ["component", "section", "preact", "error-boundary", "rendering"], complexity: "complex" },
"engine/block.ts": { summary: "Engine block type definitions and introspection: type guards, resolver wiring, and schema transform integration for all block kinds.", tags: ["engine", "block-definition", "type-definition", "introspection"], complexity: "complex" },
"engine/core/hints.ts": { summary: "Generates resolve hints by traversing resolvable maps to pre-compute paths of nested resolvables for faster resolution.", tags: ["engine", "resolver", "optimization", "traversal"], complexity: "moderate" },
"engine/core/mod.ts": { summary: "Defines ReleaseResolver, the core engine resolver that manages resolvables, resolver overrides, hints, and per-release caching.", tags: ["engine", "resolver", "core", "caching"], complexity: "complex" },
};

const results = JSON.parse(fs.readFileSync(root + "/.understand-anything/tmp/ua-file-extract-results-3.json", "utf8")).results;

const nodes = [];
const edges = [];
const nodeIds = new Set();
function addNode(n) { if (!nodeIds.has(n.id)) { nodeIds.add(n.id); nodes.push(n); } }

for (const r of results) {
  const p = r.path;
  const meta = fileMeta[p] || { summary: "Source file " + p + ".", tags: ["code"], complexity: "moderate" };
  const fnode = { id: "file:" + p, type: "file", name: p.split("/").pop(), filePath: p, summary: meta.summary, tags: meta.tags, complexity: meta.complexity };
  if (meta.languageNotes) fnode.languageNotes = meta.languageNotes;
  addNode(fnode);
  const exportedNames = new Set((r.exports || []).map(e => e.name));
  for (const fn of (r.functions || [])) {
    const len = fn.endLine - fn.startLine + 1;
    const exported = exportedNames.has(fn.name);
    if (len >= 10 || exported) {
      const id = "function:" + p + ":" + fn.name;
      addNode({ id, type: "function", name: fn.name, filePath: p, lineRange: [fn.startLine, fn.endLine], summary: "Function " + fn.name + " in " + p.split("/").pop() + ".", tags: ["function"], complexity: len > 60 ? "complex" : (len >= 20 ? "moderate" : "simple") });
      edges.push({ source: "file:" + p, target: id, type: "contains", direction: "forward", weight: 1.0 });
      if (exported) edges.push({ source: "file:" + p, target: id, type: "exports", direction: "forward", weight: 0.8 });
    }
  }
  for (const cl of (r.classes || [])) {
    const len = cl.endLine - cl.startLine + 1;
    if ((cl.methods && cl.methods.length >= 2) || len >= 20) {
      const id = "class:" + p + ":" + cl.name;
      const exported = exportedNames.has(cl.name);
      addNode({ id, type: "class", name: cl.name, filePath: p, lineRange: [cl.startLine, cl.endLine], summary: "Class " + cl.name + " defined in " + p.split("/").pop() + ".", tags: ["class"], complexity: len > 120 ? "complex" : (len >= 40 ? "moderate" : "simple") });
      edges.push({ source: "file:" + p, target: id, type: "contains", direction: "forward", weight: 1.0 });
      if (exported) edges.push({ source: "file:" + p, target: id, type: "exports", direction: "forward", weight: 0.8 });
    }
  }
  for (const imp of (bid[p] || [])) {
    edges.push({ source: "file:" + p, target: "file:" + imp, type: "imports", direction: "forward", weight: 0.7 });
  }
}

const importCount = edges.filter(e => e.type === "imports").length;
console.log("nodes", nodes.length, "edges", edges.length, "imports", importCount);

// Partition into parts. nodeCount/60, edgeCount/120
const parts = Math.ceil(Math.max(nodes.length / 60, edges.length / 120));
console.log("parts", parts);

const files = inp.files.map(f => f.path).sort();
const chunkSize = Math.ceil(files.length / parts);
const outDir = root + "/.understand-anything/intermediate";
fs.mkdirSync(outDir, { recursive: true });

function fileOfNode(id) {
  // file:path | function:path:name | class:path:name
  const rest = id.substring(id.indexOf(":") + 1);
  if (id.startsWith("file:")) return rest;
  // strip trailing :name
  return rest.substring(0, rest.lastIndexOf(":"));
}

let written = [];
for (let k = 0; k < parts; k++) {
  const groupFiles = new Set(files.slice(k * chunkSize, (k + 1) * chunkSize));
  const pNodes = nodes.filter(n => groupFiles.has(n.filePath));
  const pNodeIds = new Set(pNodes.map(n => n.id));
  const pEdges = edges.filter(e => pNodeIds.has(e.source));
  const fname = parts === 1 ? `batch-3.json` : `batch-3-part-${k + 1}.json`;
  fs.writeFileSync(outDir + "/" + fname, JSON.stringify({ nodes: pNodes, edges: pEdges }, null, 2));
  written.push({ fname, nodes: pNodes.length, edges: pEdges.length });
}
console.log(JSON.stringify(written, null, 2));
