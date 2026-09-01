import { performance } from "node:perf_hooks";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import vm from "node:vm";

const root = resolve(new URL("..", import.meta.url).pathname);
const htmlPath = join(root, "public", "lighttable.html");
const html = await readFile(htmlPath, "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1].replace(/\n  boot\(\);\s*$/, "");
if (!script) throw new Error("LIGHTTABLE application script was not found.");

function elementStub() {
  return {
    textContent: "", innerHTML: "", className: "", style: { setProperty() {}, getPropertyValue() { return ""; } },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, getAttribute() { return null; },
    getContext() { return { clearRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, clip() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, translate() {}, rotate() {}, fillRect() {}, strokeRect() {}, arc() {}, ellipse() {}, setTransform() {}, drawImage() {}, setLineDash() {} }; }, getBoundingClientRect() { return { width: 1600, height: 900, left: 0, top: 0 }; },
    addEventListener() {}, append() {}, appendChild() {}, showModal() {}, querySelectorAll() { return []; },
  };
}

const elements = new Map();
const document = {
  getElementById(id) { if (!elements.has(id)) elements.set(id, elementStub()); return elements.get(id); },
  querySelectorAll() { return []; }, addEventListener() {}, createElement: elementStub, documentElement: {}, body: elementStub(),
};
class LocalFile extends Blob { constructor(parts, name, options = {}) { super(parts, options); this.name = name; } }
const context = {
  console, document, window: { innerWidth: 1600, addEventListener() {}, DecompressionStream, CompressionStream }, indexedDB: {},
  devicePixelRatio: 1, TextEncoder, TextDecoder, Blob, File: LocalFile, Response, DecompressionStream, CompressionStream, URL, performance,
  localStorage: { getItem() { return null; }, setItem() {} }, requestAnimationFrame() { return 1; }, setTimeout() {}, clearTimeout() {},
  confirm() { return false; }, getComputedStyle() { return { getPropertyValue() { return ""; } }; },
};
vm.createContext(context);
new vm.Script(script).runInContext(context);

const syntheticCount = 6000;
new vm.Script(`
  const benchmarkBoard=newBoard('large synthetic benchmark');
  benchmarkBoard.layers=[{id:'top',name:'Top Copper',type:'Copper Top',features:Array.from({length:${syntheticCount}},(_,i)=>({
    id:'pad_'+i,layer:'top',kind:'pad',shape:'circle',x:(i%100)*2,y:Math.floor(i/100)*2,w:.6
  }))}];
  state.board=benchmarkBoard;
`).runInContext(context);

const inspectStarted = performance.now();
const inspectPanel = new vm.Script("panelInspect()").runInContext(context);
const inspectMs = performance.now() - inspectStarted;
if (!inspectPanel.includes("Analyze connectivity")) throw new Error("Inspect benchmark unexpectedly ran or hid explicit connectivity analysis.");
if (new vm.Script("state.board.connectivity").runInContext(context)) throw new Error("Inspect benchmark populated connectivity synchronously.");

const connectivityStarted = performance.now();
const syntheticStats = new vm.Script("analyzeConnectivity(state.board).stats").runInContext(context);
const connectivityMs = performance.now() - connectivityStarted;

const altiumSyntheticCount = 10000;
const altiumResult = new vm.Script(`
  const altiumSource=Array.from({length:${altiumSyntheticCount}},(_,index)=>{
    const x=index%200,y=Math.floor(index/200);
    return '|RECORD=Track|LAYER=TOP|X1='+x+'mm|Y1='+y+'mm|X2='+(x+0.8)+'mm|Y2='+y+'mm|WIDTH=0.2mm|';
  }).join('\\n');
  const altiumData=new TextEncoder().encode(altiumSource),altiumBoard=newBoard('synthetic Altium benchmark'),started=performance.now();
  parseAltium('synthetic.PcbDoc',altiumData,altiumSource,altiumBoard);
  ({features:altiumBoard.altium.features,parseMs:performance.now()-started})
`).runInContext(context);

const threeResult = new vm.Script(`
  threePlanCache={board:null,stamp:'',plan:null};
  state.display='3d';const threeStarted=performance.now(),plan=threeRenderPlan(state.board);draw3D();
  ({features:plan.entries.length,sampled:plan.sampled,sceneMs:performance.now()-threeStarted})
`).runInContext(context);

const result = {
  standaloneBytes: Buffer.byteLength(html),
  syntheticFeatures: syntheticCount,
  inspectMs: Number(inspectMs.toFixed(2)),
  connectivityCoreMs: Number(connectivityMs.toFixed(2)),
  syntheticNetworks: syntheticStats.networks,
  altiumAsciiFeatures: altiumResult.features,
  altiumAsciiParseMs: Number(altiumResult.parseMs.toFixed(2)),
  threeSceneFeatures: threeResult.features,
  threeSceneRenderMs: Number(threeResult.sceneMs.toFixed(2)),
};

const gerberFlag = process.argv.indexOf("--gerber-dir");
if (gerberFlag >= 0) {
  const directory = resolve(process.argv[gerberFlag + 1] || "");
  const names = (await readdir(directory)).sort();
  const entries = [];
  for (const name of names) {
    const extension = extname(name).toLowerCase();
    if (![".gbr", ".ger", ".gtl", ".gbl", ".gts", ".gbs", ".gto", ".gbo", ".gm1", ".gko", ".drl", ".xnc", ".drd", ".dri", ".gpi"].includes(extension)) continue;
    const data = await readFile(join(directory, name));
    entries.push({ name, text: data.toString("utf8") });
  }
  context.benchmarkEntries = entries;
  const parsed = new vm.Script(`
    const suppliedBoard=newBoard('supplied Gerber benchmark');
    const parseStarted=performance.now();
    for(const entry of benchmarkEntries){const kind=classify(entry.name,entry.text);if(kind==='GERBER')parseGerber(entry.name,entry.text,suppliedBoard);else if(kind==='DRILL')parseDrill(entry.name,entry.text,suppliedBoard)}
    computeBounds(suppliedBoard);state.board=suppliedBoard;
    const parseMs=performance.now()-parseStarted,inspectStarted=performance.now();panelInspect();const inspectMs=performance.now()-inspectStarted;
    const connectivityStarted=performance.now(),connectivity=analyzeConnectivity(suppliedBoard),connectivityMs=performance.now()-connectivityStarted;
    ({files:benchmarkEntries.length,features:suppliedBoard.layers.flatMap(layer=>layer.features).length,copper:conductiveFeatures(suppliedBoard).length,width:suppliedBoard.bounds.w,height:suppliedBoard.bounds.h,parseMs,inspectMs,connectivityMs,networks:connectivity.stats.networks})
  `).runInContext(context);
  result.suppliedGerbers = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, typeof value === "number" ? Number(value.toFixed(3)) : value]));
}

if (result.standaloneBytes > 358400) throw new Error(`Standalone file exceeds the 350 KiB gate: ${result.standaloneBytes} bytes.`);
if (inspectMs > 100) throw new Error(`Inspect exceeded the 100 ms large-job gate: ${inspectMs.toFixed(2)} ms.`);
if (connectivityMs > 10000) throw new Error(`Connectivity core exceeded the 10 s large-job gate: ${connectivityMs.toFixed(2)} ms.`);
if (altiumResult.parseMs > 1000) throw new Error(`Altium ASCII intake exceeded the 1 s, 10,000-record gate: ${altiumResult.parseMs.toFixed(2)} ms.`);
if (threeResult.sceneMs > 250) throw new Error(`3D scene rendering exceeded the 250 ms, 6,000-feature gate: ${threeResult.sceneMs.toFixed(2)} ms.`);
console.log(JSON.stringify(result, null, 2));
