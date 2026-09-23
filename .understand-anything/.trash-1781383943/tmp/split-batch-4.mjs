import fs from "node:fs";
const g = JSON.parse(fs.readFileSync(".understand-anything/tmp/ua-batch4-graph.json","utf8"));
const inp = JSON.parse(fs.readFileSync(".understand-anything/tmp/batch-input-4.json","utf8"));
const files = inp.files.map(f=>f.path).sort();
const parts = 2;
const sz = Math.ceil(files.length/parts);
const groups = [];
for (let i=0;i<parts;i++) groups.push(new Set(files.slice(i*sz,(i+1)*sz)));

function pathOf(node){ return node.filePath || node.id.split(":")[1]; }
function nodePath(id){
  // file:path, function:path:name, class:path:name
  const parts = id.split(":");
  return parts[1];
}

for (let i=0;i<parts;i++){
  const grp = groups[i];
  const ns = g.nodes.filter(n => grp.has(pathOf(n)));
  const nodeIds = new Set(ns.map(n=>n.id));
  const es = g.edges.filter(e => nodeIds.has(e.source));
  const out = {nodes:ns, edges:es};
  fs.writeFileSync(`.understand-anything/intermediate/batch-4-part-${i+1}.json`, JSON.stringify(out,null,1));
  console.log(`part ${i+1}: ${ns.length} nodes, ${es.length} edges`);
}
