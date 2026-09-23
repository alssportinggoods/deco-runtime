const fs = require('fs');

const graphPath = process.argv[2];
const layersPath = process.argv[3];
const outPath = process.argv[4];

try {
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const layers = JSON.parse(fs.readFileSync(layersPath, 'utf8'));

  // Only file-level nodes (exclude function/class/symbol nodes)
  const fileTypes = new Set(['file', 'config', 'document', 'service', 'pipeline', 'schema', 'table', 'endpoint', 'resource']);
  const allNodes = graph.nodes || [];
  const nodes = allNodes.filter(n => fileTypes.has(n.type));
  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = (graph.edges || []).filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  const byId = {};
  nodes.forEach(n => byId[n.id] = n);

  // Fan-in / fan-out
  const fanIn = {}, fanOut = {};
  nodes.forEach(n => { fanIn[n.id] = 0; fanOut[n.id] = 0; });
  edges.forEach(e => { fanOut[e.source]++; fanIn[e.target]++; });

  const fanInRanking = nodes.map(n => ({ id: n.id, fanIn: fanIn[n.id], name: n.name }))
    .sort((a, b) => b.fanIn - a.fanIn).slice(0, 20);
  const fanOutRanking = nodes.map(n => ({ id: n.id, fanOut: fanOut[n.id], name: n.name }))
    .sort((a, b) => b.fanOut - a.fanOut).slice(0, 20);

  // Entry point scoring
  const entryNames = new Set(['index.ts','index.js','main.ts','main.js','app.ts','app.js','server.ts','server.js','mod.rs','main.go','main.py','main.rs','mod.ts','live.ts']);
  const foutVals = nodes.map(n => fanOut[n.id]).sort((a,b)=>b-a);
  const top10pct = foutVals[Math.floor(foutVals.length*0.1)] || 0;
  const finVals = nodes.map(n => fanIn[n.id]).sort((a,b)=>a-b);
  const bottom25 = finVals[Math.floor(finVals.length*0.25)] || 0;

  const epScores = nodes.map(n => {
    let s = 0;
    const fp = n.filePath || '';
    const depth = fp.split('/').length;
    if (n.type === 'document') {
      if (n.name === 'README.md' && depth === 1) s += 5;
      else if (n.name && n.name.endsWith('.md') && depth === 1) s += 2;
    } else {
      if (entryNames.has(n.name)) s += 3;
      if (depth <= 2) s += 1;
      if (fanOut[n.id] >= top10pct) s += 1;
      if (fanIn[n.id] <= bottom25) s += 1;
    }
    return { id: n.id, score: s, name: n.name, summary: n.summary };
  }).sort((a,b)=>b.score-a.score);
  const entryPointCandidates = epScores.slice(0, 6);

  // BFS from top code entry point
  const adj = {};
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => {
    if (e.type === 'imports' || e.type === 'calls') adj[e.source].push(e.target);
  });
  const codeEP = epScores.find(c => byId[c.id].type === 'file') || epScores[0];
  const start = codeEP.id;
  const depthMap = {}; const order = [];
  const queue = [[start, 0]]; depthMap[start] = 0;
  while (queue.length) {
    const [cur, d] = queue.shift();
    order.push(cur);
    for (const nx of adj[cur]) {
      if (depthMap[nx] === undefined) { depthMap[nx] = d + 1; queue.push([nx, d + 1]); }
    }
  }
  const byDepth = {};
  for (const id of order) {
    const d = depthMap[id];
    (byDepth[d] = byDepth[d] || []).push(id);
  }

  // Non-code inventory
  const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
  nodes.forEach(n => {
    const o = { id: n.id, name: n.name, type: n.type, summary: n.summary };
    if (n.type === 'document') nonCodeFiles.documentation.push(o);
    else if (['service','pipeline','resource'].includes(n.type)) nonCodeFiles.infrastructure.push(o);
    else if (['table','schema','endpoint'].includes(n.type)) nonCodeFiles.data.push(o);
    else if (n.type === 'config') nonCodeFiles.config.push(o);
  });

  // Clusters: bidirectional pairs
  const edgeSet = new Set(edges.map(e => e.source + '|' + e.target));
  const clusters = [];
  const seen = new Set();
  nodes.forEach(a => {
    adj[a.id].forEach(b => {
      if (a.id < b && edgeSet.has(b + '|' + a.id)) {
        const key = a.id + '|' + b;
        if (!seen.has(key)) { seen.add(key); clusters.push({ nodes: [a.id, b], edgeCount: 2 }); }
      }
    });
  });
  clusters.slice(0, 10);

  // Node summary index
  const nodeSummaryIndex = {};
  nodes.forEach(n => nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary });

  const out = {
    scriptCompleted: true,
    entryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal: { startNode: start, order, depthMap, byDepth },
    nonCodeFiles,
    clusters: clusters.slice(0, 10),
    layers: { count: layers.length, list: layers.map(l => ({ id: l.id, name: l.name, description: l.description })) },
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length
  };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('done nodes=' + nodes.length + ' edges=' + edges.length + ' start=' + start);
} catch (e) {
  console.error(e.stack || e.message);
  process.exit(1);
}
