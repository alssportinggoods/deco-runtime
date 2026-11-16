import { cyan } from "@std/fmt/colors";
import { walk } from "@std/fs";
import { join, relative, SEPARATOR, toFileUrl } from "@std/path";
import autoprefixer from "npm:autoprefixer@10.4.14";
import cssnano from "npm:cssnano@6.0.1";
import postcssImport from "npm:postcss-import@14.1.0";
import postcss, { type AcceptedPlugin } from "npm:postcss@8.4.27";
import tailwindcss, { type Config } from "npm:tailwindcss@3.4.1";
import { resolveDeps } from "./deno.ts";

export { type Config } from "npm:tailwindcss@3.4.1";

const DEFAULT_CONFIG: Config = {
  content: ["./**/*.tsx"],
  theme: {},
};

const DEFAULT_TAILWIND_CSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

// Try to recover config from default file, a.k.a tailwind.config.ts
export const loadTailwindConfig = (root: string): Promise<Config> =>
  import(toFileUrl(join(root, "tailwind.config.ts")).href)
    .then((mod) => mod.default)
    .catch((err) => {
      console.warn(
        "could not load tailwind config from tailwind.config.ts",
        err,
      );
      return DEFAULT_CONFIG;
    });

const bundle = async (
  { from, mode, config }: {
    from: string;
    mode: "dev" | "prod";
    config: Config;
  },
) => {
  const start = performance.now();

  const plugins: AcceptedPlugin[] = [
    postcssImport(),
    tailwindcss(config),
    autoprefixer(),
  ];

  if (mode === "prod") {
    plugins.push(
      cssnano({ preset: ["default", { cssDeclarationSorter: false }] }),
    );
  }

  const processor = postcss(plugins);

  const content = await processor.process(
    await Deno.readTextFile(from).catch((_) => DEFAULT_TAILWIND_CSS),
    { from: undefined },
  );

  console.info(
    ` 🎨 TailwindCSS ready in ${
      cyan(`${((performance.now() - start) / 1e3).toFixed(1)}s`)
    }`,
  );

  return `/* mode:${mode} */\n${content.css}`;
};

const TAILWIND_FILE = "tailwind.css";

const isDev = Deno.env.get("DECO_PREVIEW") === "true" ||
  Deno.env.get("TAILWIND_DEV_MODE") === "true";

interface BuildOptions {
  exclude?: string[];
}

const withReleaseContent = async (
  config: Config,
  options: BuildOptions = {},
): Promise<Config> => {
  const allTsxFiles = new Map<string, string>();

  const excludes = [...new Set(
    options.exclude?.map((exclude) =>
      exclude.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\//, "")
    ) ?? [],
  ).values()];

  const isExcluded = (path: string): boolean => {
    return excludes.some((exclude) =>
      path === exclude ||
      path.startsWith(`${exclude}/`) ||
      path.endsWith(`/${exclude}`) ||
      path.includes(`/${exclude}/`)
    );
  };

  // init search graph with local FS
  const roots = new Set<string>();

  for await (
    const entry of walk(Deno.cwd(), {
      includeDirs: false,
      includeFiles: true,
    })
  ) {
    const path = entry.path.replaceAll(SEPARATOR, "/");
    // Exclusions are tested against the path relative to cwd, so that an
    // exclude like ".worktrees" only skips files under cwd/.worktrees and
    // doesn't leak when cwd itself is inside a worktree.
    const relativePath = relative(Deno.cwd(), entry.path).replaceAll(
      SEPARATOR,
      "/",
    );
    if (isExcluded(relativePath)) {
      continue;
    }

    if (path.endsWith(".tsx") || path.includes("/apps/")) {
      roots.add(toFileUrl(entry.path).href);
    }
  }

  const start = performance.now();
  await resolveDeps([...roots.values()], allTsxFiles);
  const duration = (performance.now() - start).toFixed(0);

  console.log(
    ` 🔍 TailwindCSS resolved ${allTsxFiles.size} dependencies in ${duration}ms`,
  );

  const dynamicContent = [
    ...allTsxFiles.values().map((content) => ({
      raw: content,
      extension: "tsx" as const,
    })),
  ];

  if (Array.isArray(config.content)) {
    return {
      ...config,
      content: [...config.content, ...dynamicContent],
    };
  }

  if (config.content && "files" in config.content) {
    return {
      ...config,
      content: {
        ...config.content,
        files: [...config.content.files, ...dynamicContent],
      },
    };
  }

  return {
    ...config,
    content: dynamicContent,
  };
};

const getCSS = async (
  config: Config,
  options: BuildOptions = {},
): Promise<string> => {
  return await bundle({
    from: TAILWIND_FILE,
    mode: isDev ? "dev" : "prod",
    config: await withReleaseContent(config, options),
  });
};

const TO: string = join(Deno.cwd(), "static", TAILWIND_FILE);

let buildOptions: BuildOptions;
let tailwindConfig: null | Config = null;

export const build = async (options: BuildOptions = {}): Promise<void> => {
  await getCSS(
    tailwindConfig ??= await loadTailwindConfig(Deno.cwd()),
    buildOptions ??= options,
  ).then((txt) => Deno.writeTextFile(TO, txt));
};

addEventListener("hmr", async () => {
  await build(buildOptions);
});
