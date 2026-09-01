import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { gzipSync } from "node:zlib";

const html = await readFile(new URL("../public/lighttable.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1].replace(/\n  boot\(\);\s*$/, "");

function elementStub() {
  const attributes = new Map();
  const classes = new Set();
  const styleValues = new Map();
  return {
    textContent: "",
    innerHTML: "",
    className: "",
    attributes,
    style: { setProperty(name, value) { styleValues.set(name, value); }, getPropertyValue(name) { return styleValues.get(name) || ""; } },
    classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, toggle(name, force) { if (force === true) classes.add(name); else if (force === false) classes.delete(name); else if (classes.has(name)) classes.delete(name); else classes.add(name); }, contains(name) { return classes.has(name); } },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    getContext() { return { clearRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, fill() {}, stroke() {}, fillText() {}, strokeText() {}, translate() {}, rotate() {}, fillRect() {}, strokeRect() {}, arc() {}, ellipse() {}, setTransform() {}, drawImage() {}, setLineDash() {} }; },
    getBoundingClientRect() { return { width: 1000, height: 700, left: 0, top: 0 }; },
    addEventListener() {},
    append() {},
    appendChild() {},
    showModal() {},
    querySelectorAll() { return []; },
  };
}

function harness() {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, elementStub());
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    createElement: elementStub,
    documentElement: {},
    body: elementStub(),
  };
  class LocalFile extends Blob {
    constructor(parts, name, options = {}) {
      super(parts, options);
      this.name = name;
    }
  }
  const context = {
    console,
    document,
    window: { innerWidth: 1600, addEventListener() {}, DecompressionStream, CompressionStream },
    indexedDB: {},
    devicePixelRatio: 1,
    TextEncoder,
    TextDecoder,
    Blob,
    File: LocalFile,
    Response,
    DecompressionStream,
    CompressionStream,
    URL,
    localStorage: { values: new Map(), getItem(key) { return this.values.get(key) ?? null; }, setItem(key, value) { this.values.set(key, String(value)); } },
    requestAnimationFrame() { return 1; },
    setTimeout() {},
    clearTimeout() {},
    confirm() { return false; },
    getComputedStyle() { return { getPropertyValue() { return ""; } }; },
  };
  vm.createContext(context);
  return { context, elements };
}

function tarFile(entries) {
  const parts = [];
  for (const [name, value] of entries) {
    const data = Buffer.from(value);
    const header = Buffer.alloc(512);
    header.write(name, 0, 100, "utf8");
    header.write(data.length.toString(8).padStart(11, "0") + "\0", 124, 12, "ascii");
    header.fill(32, 148, 156);
    header[156] = 48;
    const checksum = [...header].reduce((sum, byte) => sum + byte, 0);
    header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "ascii");
    parts.push(header, data, Buffer.alloc((512 - data.length % 512) % 512));
  }
  parts.push(Buffer.alloc(1024));
  return Buffer.concat(parts);
}

function altiumCfbFixture() {
  const sectorSize = 512;
  const out = Buffer.alloc(sectorSize * 6);
  const header = out.subarray(0, sectorSize);
  Buffer.from("d0cf11e0a1b11ae1", "hex").copy(header);
  header.writeUInt16LE(0x003e, 24);
  header.writeUInt16LE(3, 26);
  header.writeUInt16LE(0xfffe, 28);
  header.writeUInt16LE(9, 30);
  header.writeUInt16LE(6, 32);
  header.writeUInt32LE(1, 44);
  header.writeUInt32LE(1, 48);
  header.writeUInt32LE(4096, 56);
  header.writeUInt32LE(4, 60);
  header.writeUInt32LE(1, 64);
  header.writeUInt32LE(0xfffffffe, 68);
  for (let index = 0; index < 109; index += 1) header.writeUInt32LE(index === 0 ? 0 : 0xffffffff, 76 + index * 4);

  const fat = out.subarray(sectorSize, sectorSize * 2);
  for (let index = 0; index < 128; index += 1) fat.writeUInt32LE(0xffffffff, index * 4);
  fat.writeUInt32LE(0xfffffffd, 0);
  fat.writeUInt32LE(2, 4);
  fat.writeUInt32LE(0xfffffffe, 8);
  fat.writeUInt32LE(0xfffffffe, 12);
  fat.writeUInt32LE(0xfffffffe, 16);

  const directory = out.subarray(sectorSize * 2, sectorSize * 4);
  const none = 0xffffffff;
  const entry = (id, name, type, left, right, child, start, size) => {
    const row = directory.subarray(id * 128, id * 128 + 128);
    Buffer.from(`${name}\0`, "utf16le").copy(row);
    row.writeUInt16LE((name.length + 1) * 2, 64);
    row[66] = type;
    row[67] = 1;
    row.writeUInt32LE(left, 68);
    row.writeUInt32LE(right, 72);
    row.writeUInt32LE(child, 76);
    row.writeUInt32LE(start, 116);
    row.writeUInt32LE(size, 120);
  };
  entry(0, "Root Entry", 5, none, none, 1, 3, 256);
  entry(1, "Board6", 1, none, 4, 2, none, 0);
  entry(2, "Data", 2, none, 3, none, 0, 0);
  entry(3, "Header", 2, none, none, none, 1, 4);
  entry(4, "Tracks6", 1, none, none, 5, none, 0);
  entry(5, "Data", 2, none, 6, none, 2, 0);
  entry(6, "Header", 2, none, none, none, 3, 4);

  const miniStream = out.subarray(sectorSize * 4, sectorSize * 5);
  const boardPayload = Buffer.from("|RECORD=Board|", "latin1");
  const boardData = Buffer.alloc(4 + boardPayload.length);
  boardData.writeUInt32LE(boardPayload.length);
  boardPayload.copy(boardData, 4);
  boardData.copy(miniStream, 0);
  directory.writeUInt32LE(boardData.length, 2 * 128 + 120);
  const headerCount = Buffer.alloc(4);
  headerCount.writeUInt32LE(1);
  headerCount.copy(miniStream, 64);

  const trackPayload = Buffer.alloc(33);
  trackPayload[0] = 1;
  trackPayload.writeInt32LE(3937008, 13);
  trackPayload.writeInt32LE(3937008, 17);
  trackPayload.writeInt32LE(7874016, 21);
  trackPayload.writeInt32LE(3937008, 25);
  trackPayload.writeInt32LE(98425, 29);
  const trackData = Buffer.alloc(5 + trackPayload.length);
  trackData[0] = 4;
  trackData.writeUInt32LE(trackPayload.length, 1);
  trackPayload.copy(trackData, 5);
  trackData.copy(miniStream, 128);
  directory.writeUInt32LE(trackData.length, 5 * 128 + 120);
  headerCount.copy(miniStream, 192);

  const miniFat = out.subarray(sectorSize * 5, sectorSize * 6);
  for (let index = 0; index < 128; index += 1) miniFat.writeUInt32LE(0xffffffff, index * 4);
  for (let index = 0; index < 4; index += 1) miniFat.writeUInt32LE(0xfffffffe, index * 4);
  return new Uint8Array(out);
}

test("ships the v1.5.0 standalone release marker", () => {
  assert.match(html, /LIGHTTABLE :: lighttable\.html :: v1\.5\.0/);
  assert.match(html, /instrument:'1\.5\.0'/);
  assert.match(html, /GEOMETRY_TOLERANCE_MM=\.01/);
  assert.match(html, /CONNECTIVITY_TOLERANCE_MM=\.025/);
});

test("ships a roomy, persistent, and accessible resizable board workspace", () => {
  assert.match(html, /--board-pane:clamp\(480px,46vw,900px\)/);
  assert.match(html, /id="boardSplitter"[^>]*role="separator"[^>]*aria-orientation="vertical"/);
  assert.match(html, /id="boardExpand"[^>]*aria-pressed="false"/);
  assert.match(html, /lighttable\.board-layout\.v1/);
  assert.match(html, /\['ArrowLeft','ArrowRight','Home','End'\]/);
  assert.match(html, /app\.board-expanded/);
});

test("applies, expands, and persists a desktop board layout", () => {
  assert.ok(script);
  const { context, elements } = harness();
  new vm.Script(script).runInContext(context);
  elements.get("appShell").getBoundingClientRect = () => ({ width: 1600, height: 900, left: 0, right: 1600, top: 0 });
  elements.set("leftRail", elementStub());
  elements.get("leftRail").getBoundingClientRect = () => ({ width: 184, height: 900, left: 0, right: 184, top: 0 });
  new vm.Script(`
    boardLayout.width=700;
    applyBoardLayout(false);
    persistBoardLayout();
    toggleBoardExpanded();
    globalThis.boardLayoutGate={
      width:boardLayout.width,
      expanded:appShell.classList.contains('board-expanded'),
      saved:JSON.parse(localStorage.getItem(BOARD_LAYOUT_KEY)),
      ariaNow:boardSplitter.getAttribute('aria-valuenow'),
      ariaMax:boardSplitter.getAttribute('aria-valuemax'),
      controlLabel:boardExpand.getAttribute('aria-label'),
    };
  `).runInContext(context);
  assert.equal(context.boardLayoutGate.width, 700);
  assert.equal(context.boardLayoutGate.expanded, true);
  assert.equal(context.boardLayoutGate.saved.width, 700);
  assert.equal(context.boardLayoutGate.saved.expanded, true);
  assert.equal(context.boardLayoutGate.ariaNow, "700");
  assert.equal(context.boardLayoutGate.ariaMax, "1086");
  assert.equal(context.boardLayoutGate.controlLabel, "Restore station panel");
});

test("builds a bounded interactive 3D review scene", () => {
  assert.match(html, /data-display="3d"/);
  assert.match(html, /data-three="thickness"/);
  assert.match(html, /MAX_3D_FEATURES=20000/);
  assert.match(html, /display:state\.display,scene3d:/);
  assert.match(html, /state\.display=saved\.display==='3d'/);
  const { context } = harness();
  new vm.Script(`${script}
    const board3d=newBoard('3D release gate');
    board3d.bounds={x:0,y:0,w:50,h:30};
    board3d.outline={points:[{x:0,y:0},{x:50,y:0},{x:50,y:30},{x:0,y:30},{x:0,y:0}]};
    board3d.layers=[
      {id:'top',name:'Top Copper',type:'Copper Top',visible:true,color:'#d6a631',opacity:.9,features:[{id:'pad',layer:'top',kind:'pad',shape:'circle',x:10,y:10,w:2}]},
      {id:'bottom',name:'Bottom Copper',type:'Copper Bottom',visible:true,color:'#63b9ff',opacity:.9,features:[{id:'track',layer:'bottom',kind:'track',x:5,y:5,x2:45,y2:5,width:.2}]},
    ];
    board3d.components=[{id:'u1',kind:'component',ref:'U1',x:25,y:15,w:8,h:5,rot:30,side:'Top'}];
    const plan3d=threeRenderPlan(board3d),scene3d={...state.scene3d,thickness:1.6,componentHeight:3,explode:2},projection3d=project3D({x:25,y:15,z:.8},scene3d,board3d.bounds,{width:1000,height:700}),faces3d=threeComponentFaces(board3d.components[0],scene3d);
    state.board=board3d;state.display='3d';state.scene3d=scene3d;draw3D();
    globalThis.threeGate={outline:plan3d.outline.length,entries:plan3d.entries.length,sampled:plan3d.sampled,topZ:threeLayerZ(board3d.layers[0],0,2,scene3d),bottomZ:threeLayerZ(board3d.layers[1],1,2,scene3d),projection:projection3d,sideFaces:faces3d.sides.length,topFaceZ:faces3d.top[0].z,status:document.getElementById('threeStatusText').textContent};
  `).runInContext(context);
  assert.equal(context.threeGate.outline, 4);
  assert.equal(context.threeGate.entries, 2);
  assert.equal(context.threeGate.sampled, false);
  assert.ok(context.threeGate.topZ > context.threeGate.bottomZ);
  assert.ok(Number.isFinite(context.threeGate.projection.x + context.threeGate.projection.y));
  assert.equal(context.threeGate.sideFaces, 4);
  assert.ok(context.threeGate.topFaceZ > 0);
  assert.match(context.threeGate.status, /2 features.*1 components/);
});

test("passes all parser, geometry, connectivity, KiCad, Altium, Eagle, DXF, and ODB++ conformance assertions", () => {
  assert.ok(script);
  const { context, elements } = harness();
  new vm.Script(`${script}\nstate.board=newBoard('test');selfTest();`).runInContext(context);
  assert.equal(elements.get("modalTitle").textContent, "SELF-TEST 139/139");
  assert.doesNotMatch(elements.get("modalBody").innerHTML, /test-fail/);
});

test("renders a binary Altium PcbDoc through bounded CFB and miniFAT intake", () => {
  assert.ok(script);
  const { context } = harness();
  context.altiumFixture = altiumCfbFixture();
  new vm.Script(`${script}
    const altiumBinaryBoard=newBoard('binary Altium fixture');
    parseAltium('fixture.PcbDoc',altiumFixture,new TextDecoder().decode(altiumFixture),altiumBinaryBoard);
    computeBounds(altiumBinaryBoard);
    const binaryTrack=altiumBinaryBoard.layers.flatMap(layer=>layer.features)[0];
    state.board=altiumBinaryBoard;
    globalThis.altiumBinaryGate={
      format:altiumBinaryBoard.originalAltium.format,
      cfbMajor:altiumBinaryBoard.originalAltium.cfbMajor,
      streamPaths:altiumBinaryBoard.originalAltium.streams.map(stream=>stream.path),
      features:altiumBinaryBoard.altium.features,
      track:{x:binaryTrack.x,x2:binaryTrack.x2,width:binaryTrack.width,readOnly:binaryTrack.nativeReadOnly},
      sourceLength:altiumBinaryBoard.originalAltium.data.length,
      fidelity:fidelityText(altiumBinaryBoard),
      exportPanel:panelExport(),
    };
  `).runInContext(context);
  assert.equal(context.altiumBinaryGate.format, "BINARY CFB");
  assert.equal(context.altiumBinaryGate.cfbMajor, 3);
  assert.deepEqual([...context.altiumBinaryGate.streamPaths], ["Board6/Data", "Board6/Header", "Tracks6/Data", "Tracks6/Header"]);
  assert.equal(context.altiumBinaryGate.features, 1);
  assert.ok(Math.abs(context.altiumBinaryGate.track.x - 10) < 0.000001);
  assert.ok(Math.abs(context.altiumBinaryGate.track.x2 - 20) < 0.000001);
  assert.ok(Math.abs(context.altiumBinaryGate.track.width - 0.25) < 0.000001);
  assert.equal(context.altiumBinaryGate.track.readOnly, true);
  assert.equal(context.altiumBinaryGate.sourceLength, altiumCfbFixture().length);
  assert.match(context.altiumBinaryGate.fidelity, /Altium write-back scope: Unavailable/);
  assert.match(context.altiumBinaryGate.exportPanel, /data-export="fab" disabled/);
  assert.match(context.altiumBinaryGate.exportPanel, /data-export="placement" disabled/);
  assert.match(context.altiumBinaryGate.exportPanel, /data-export="dxf" disabled/);
});

test("refuses a cyclic Altium compound-file allocation chain", () => {
  assert.ok(script);
  const { context } = harness();
  const corrupt = altiumCfbFixture();
  new DataView(corrupt.buffer, corrupt.byteOffset, corrupt.byteLength).setUint32(512 + 4, 1, true);
  context.corruptAltiumFixture = corrupt;
  new vm.Script(`${script}
    try{cfbRead('cyclic.PcbDoc',corruptAltiumFixture);globalThis.altiumCycleError=''}catch(error){globalThis.altiumCycleError=error.message}
  `).runInContext(context);
  assert.match(context.altiumCycleError, /cyclic directory chain/);
});

test("keeps legacy Eagle Gerber rendering exact and Inspect non-blocking", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const board=newBoard('legacy Eagle job');
    parseGerber('main.gko','%FSLAX24Y24*%%MOIN*%%ADD10C,0.0000*%D10*X001000Y001000D02*X002000Y001000D01*M02*',board);
    parseDrill('main.drd','M48\\nM72\\nT01C0.0236\\n%\\nT01\\nX2490Y5298\\nM30',board);
    computeBounds(board);
    state.board=board;
    const track=board.layers.find(layer=>layer.type==='Outline').features[0];
    const hole=board.layers.find(layer=>layer.type==='Drill').features[0];
    const panel=panelInspect();
    globalThis.legacyGerberGate={
      trackWidth:track.width,
      geometryRadius:featureGeometry(track)[0].r,
      drill:{x:hole.x,y:hole.y,d:hole.d},
      connectivity:board.connectivity,
      offersAnalysis:panel.includes('Analyze connectivity'),
      runsGlobalGap:panel.includes('Min geometry gap'),
    };
  `).runInContext(context);
  assert.equal(context.legacyGerberGate.trackWidth, 0);
  assert.equal(context.legacyGerberGate.geometryRadius, 0);
  assert.ok(Math.abs(context.legacyGerberGate.drill.x - 6.3246) < 1e-6);
  assert.ok(Math.abs(context.legacyGerberGate.drill.y - 13.45692) < 1e-6);
  assert.ok(Math.abs(context.legacyGerberGate.drill.d - 0.59944) < 1e-6);
  assert.equal(context.legacyGerberGate.connectivity, null);
  assert.equal(context.legacyGerberGate.offersAnalysis, true);
  assert.equal(context.legacyGerberGate.runsGlobalGap, false);
});

test("executes connectivity in the generated worker source with progress", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const workerBoard=newBoard('worker fixture');
    workerBoard.layers=[{id:'top',name:'Top Copper',type:'Copper Top',features:[
      {id:'track',layer:'top',kind:'track',x:0,y:0,x2:2,y2:0,width:.2,net:'SIG'},
      {id:'pad',layer:'top',kind:'pad',shape:'circle',x:2,y:0,w:1,net:'SIG'}
    ]}];
    globalThis.workerFixture={source:connectivityWorkerSource(),board:connectivityBoardSnapshot(workerBoard),direct:analyzeConnectivity(workerBoard)};
  `).runInContext(context);
  const messages = [];
  const workerContext = { console, performance, self: { postMessage(message) { messages.push(message); } } };
  vm.createContext(workerContext);
  new vm.Script(context.workerFixture.source).runInContext(workerContext);
  workerContext.self.onmessage({ data: { jobId: "gate", board: context.workerFixture.board } });
  const result = messages.find(message => message.type === "result")?.result;
  assert.ok(messages.some(message => message.type === "progress" && message.percent === 100));
  assert.equal(result.version, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(result.stats)), JSON.parse(JSON.stringify(context.workerFixture.direct.stats)));
});

test("keeps cached analysis through cosmetic saves and invalidates geometry edits", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    state.board=newBoard('cache fixture');
    state.board.layers=[{id:'top',name:'Top Copper',type:'Copper Top',features:[{id:'pad',layer:'top',kind:'pad',shape:'circle',x:0,y:0,w:1}]}];
    state.board.connectivity=analyzeConnectivity(state.board);
    const revision=state.board.analysisRevision;
    setDirty();
    const cosmeticCached=!!cachedConnectivity();
    setDirty(true);
    globalThis.cacheGate={revision,cosmeticCached,afterRevision:state.board.analysisRevision,afterGeometry:cachedConnectivity()};
  `).runInContext(context);
  assert.equal(context.cacheGate.cosmeticCached, true);
  assert.equal(context.cacheGate.afterRevision, context.cacheGate.revision + 1);
  assert.equal(context.cacheGate.afterGeometry, null);
});

test("does not start connectivity while creating fidelity reports", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    state.board=newBoard('fidelity fixture');
    state.board.layers=[{id:'top',name:'Top Copper',type:'Copper Top',features:[{id:'pad',layer:'top',kind:'pad',shape:'circle',x:0,y:0,w:1}]}];
    const report=fidelityText();
    globalThis.fidelityGate={report,connectivity:state.board.connectivity};
  `).runInContext(context);
  assert.equal(context.fidelityGate.connectivity, null);
  assert.match(context.fidelityGate.report, /Connectivity: Not run\. Use Inspect -> Analyze connectivity/);
});

test("cancels a background analysis without retaining a stale task", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    let terminated=false,rejection='';
    connectivityTask={worker:{terminate(){terminated=true}},url:'blob:gate',reject(error){rejection=error.name},board:null};
    const cancelled=cancelConnectivityAnalysis('Cancelled by test.',false);
    globalThis.cancelGate={cancelled,terminated,rejection,cleared:connectivityTask===null};
  `).runInContext(context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.cancelGate)), { cancelled: true, terminated: true, rejection: "AbortError", cleared: true });
});

test("preserves unknown KiCad source while reopening native object patches", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const board=newBoard('KiCad release gate');
    parseKiCad('release-gate.kicad_pcb',SAMPLE.kicad,board);
    const native=board.layers.flatMap(layer=>layer.features);
    const component=board.components[0];
    const pad=native.find(feature=>feature.sourceNode?.type==='pad');
    const segment=native.find(feature=>feature.sourceNode?.type==='segment');
    const boardText=native.find(feature=>feature.sourceNode?.type==='gr_text');
    applyGeometryEdit(component,'rotate',{},board);
    applyGeometryEdit(component,'mirror',{},board);
    applyGeometryEdit(pad,'nudge',{x:.5,y:.25},board);
    applyGeometryEdit(segment,'rotate',{},board);
    applyGeometryEdit(segment,'mirror',{},board);
    applyGeometryEdit(boardText,'nudge',{x:1,y:0},board);
    applyGeometryEdit(boardText,'mirror',{},board);
    const report=kiCadWritebackReport(board);
    globalThis.kiCadGate={
      pass:report.pass,
      reopened:report.reopened,
      countsMatch:report.countsMatch,
      labels:report.patches.map(patch=>patch.label),
      output:report.output,
    };
  `).runInContext(context);
  assert.equal(context.kiCadGate.pass, true);
  assert.equal(context.kiCadGate.reopened, true);
  assert.equal(context.kiCadGate.countsMatch, true);
  assert.match(context.kiCadGate.output, /\(future_board_token \(nested "keep me"\)\)/);
  assert.match(context.kiCadGate.output, /\(future_pad_token "preserve"\)/);
  assert.ok(context.kiCadGate.labels.some(label => /position/.test(label)));
  assert.ok(context.kiCadGate.labels.some(label => /layers/.test(label)));
  assert.ok(context.kiCadGate.labels.includes("segment start"));
  assert.ok(context.kiCadGate.labels.includes("segment end"));
  assert.ok(context.kiCadGate.labels.includes("segment layer"));
  assert.ok(context.kiCadGate.labels.includes("BOARD TEXT layer"));
});

test("preserves unknown Eagle XML while reopening element transforms", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const board=newBoard('Eagle release gate');
    parseEagle('release-gate.brd',SAMPLE.eagle,board);
    const component=board.components.find(item=>item.ref==='R1');
    const child=boardFeatureById(board,component.childIds[0]);
    const childStart={x:child.x,y:child.y};
    applyGeometryEdit(component,'nudge',{x:2,y:-1},board);
    applyGeometryEdit(component,'rotate',{},board);
    applyGeometryEdit(component,'mirror',{},board);
    const report=eagleWritebackReport(board);
    globalThis.eagleGate={
      pass:report.pass,
      reopened:report.reopened,
      countsMatch:report.countsMatch,
      transformsMatch:report.transformsMatch,
      labels:report.patches.map(patch=>patch.label),
      output:report.output,
      childMoved:child.x!==childStart.x||child.y!==childStart.y,
      childLayer:board.layers.find(layer=>layer.id===child.layer)?.eagleLayerNumber,
      derivedEditAccepted:applyGeometryEdit(child,'nudge',{x:1,y:0},board),
    };
  `).runInContext(context);
  assert.equal(context.eagleGate.pass, true);
  assert.equal(context.eagleGate.reopened, true);
  assert.equal(context.eagleGate.countsMatch, true);
  assert.equal(context.eagleGate.transformsMatch, true);
  assert.equal(context.eagleGate.childMoved, true);
  assert.equal(context.eagleGate.childLayer, "16");
  assert.equal(context.eagleGate.derivedEditAccepted, false);
  assert.match(context.eagleGate.output, /<future-board-node key="keep">unknown Eagle XML remains byte-for-byte intact<\/future-board-node>/);
  assert.match(context.eagleGate.output, /<future-package-node mode="retain">untouched<\/future-package-node>/);
  assert.ok(context.eagleGate.labels.includes("R1 X"));
  assert.ok(context.eagleGate.labels.includes("R1 Y"));
  assert.ok(context.eagleGate.labels.includes("R1 rotation and side"));
});

test("inserts a missing Eagle rotation attribute and refuses entity declarations", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const source=SAMPLE.eagle.replace(' rot="R0" future="preserve"',' future="preserve"');
    const board=newBoard('Eagle insertion gate');
    parseEagle('insertion.brd',source,board);
    const component=board.components.find(item=>item.ref==='R1');
    applyGeometryEdit(component,'rotate',{},board);
    const report=eagleWritebackReport(board);
    let entityRefused=false;
    try{parseEagle('entity.brd',SAMPLE.eagle.replace('<!DOCTYPE eagle SYSTEM "eagle.dtd">','<!DOCTYPE eagle [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>'),newBoard())}catch(error){entityRefused=/entity declarations were refused/.test(error.message)}
    globalThis.eagleInsertionGate={pass:report.pass,output:report.output,entityRefused};
  `).runInContext(context);
  assert.equal(context.eagleInsertionGate.pass, true);
  assert.match(context.eagleInsertionGate.output, /name="R1"[^>]* rot="R90"\/>/);
  assert.equal(context.eagleInsertionGate.entityRefused, true);
});

test("preserves unknown ASCII DXF records while reopening native shape edits", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const board=newBoard('DXF release gate');
    parseDxf('release-gate.dxf',SAMPLE.dxf,board);
    const native=board.layers.flatMap(layer=>layer.features);
    const line=native.find(feature=>feature.sourceNode?.entity==='LINE');
    const arc=native.find(feature=>feature.sourceNode?.entity==='ARC');
    const polyline=native.find(feature=>feature.sourceNode?.entity==='LWPOLYLINE');
    const text=native.find(feature=>feature.sourceNode?.entity==='TEXT');
    const circle=native.find(feature=>feature.sourceNode?.entity==='CIRCLE');
    applyGeometryEdit(line,'nudge',{x:2,y:-1},board);
    applyGeometryEdit(arc,'rotate',{},board);
    applyGeometryEdit(polyline,'mirror',{},board);
    applyGeometryEdit(text,'rotate',{},board);
    applyGeometryEdit(circle,'delete',{},board);
    const report=dxfWritebackReport(board);
    globalThis.dxfGate={
      pass:report.pass,
      reopened:report.reopened,
      countsMatch:report.countsMatch,
      geometryMatch:report.geometryMatch,
      before:report.before,
      after:report.after,
      labels:report.patches.map(patch=>patch.label),
      output:report.output,
    };
  `).runInContext(context);
  assert.equal(context.dxfGate.pass, true);
  assert.equal(context.dxfGate.reopened, true);
  assert.equal(context.dxfGate.countsMatch, true);
  assert.equal(context.dxfGate.geometryMatch, true);
  assert.equal(context.dxfGate.before.entities, 10);
  assert.equal(context.dxfGate.after.entities, 9);
  assert.match(context.dxfGate.output, /unknown xdata stays untouched/);
  assert.match(context.dxfGate.output, /unsupported spline remains byte-for-byte intact/);
  assert.ok(context.dxfGate.labels.includes("LINE 10 X1"));
  assert.ok(context.dxfGate.labels.includes("ARC 21 start angle"));
  assert.ok(context.dxfGate.labels.some(label => /LWPOLYLINE 22 vertex/.test(label)));
  assert.ok(context.dxfGate.labels.includes("TEXT 30 rotation"));
  assert.ok(context.dxfGate.labels.includes("Delete CIRCLE 20"));
});

test("certifies generated DXF through two re-imports", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const board=newBoard('DXF generated release gate');
    parseDxf('generated-release-gate.dxf',SAMPLE.dxf,board);
    const report=dxfGeneratedRoundTrip(board);
    globalThis.dxfGeneratedGate={
      pass:report.pass,
      geometryMatch:report.geometryMatch,
      entities:report.entities,
      reopened:report.reopened,
      identityReopened:report.identityReopened,
      tolerance:report.toleranceMm,
      errors:report.errors,
      output:report.output,
    };
  `).runInContext(context);
  assert.equal(context.dxfGeneratedGate.pass, true, JSON.stringify(context.dxfGeneratedGate.errors));
  assert.equal(context.dxfGeneratedGate.geometryMatch, true);
  assert.equal(context.dxfGeneratedGate.entities, 9);
  assert.equal(context.dxfGeneratedGate.reopened, 9);
  assert.equal(context.dxfGeneratedGate.identityReopened, 9);
  assert.equal(context.dxfGeneratedGate.tolerance, 0.01);
  assert.match(context.dxfGeneratedGate.output, /Generated by LIGHTTABLE v1\.5\.0/);
});

test("maps ODB++ matrix features, components, and EDA FID nets", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const board=newBoard('ODB++ release gate');
    const records=[
      ['job/matrix/matrix',SAMPLE.odb.matrix],
      ['job/steps/pcb/layers/top/features',SAMPLE.odb.top],
      ['job/steps/pcb/layers/bottom/features',SAMPLE.odb.bottom],
      ['job/steps/pcb/layers/comp_+_top/components',SAMPLE.odb.components],
      ['job/steps/pcb/eda/data',SAMPLE.odb.eda],
    ].map(([name,text])=>({file:new File([text],name),text,kind:'UNKNOWN'}));
    parseOdb(records,board);
    const features=board.layers.flatMap(layer=>layer.features);
    const ordinalBoard=newBoard('ODB++ barcode ordinal gate');
    const ordinalRows=[
      ['ordinal/matrix/matrix',SAMPLE.odb.matrix],
      ['ordinal/steps/pcb/layers/top/features','UNITS=MM\\n$0 r500\\nB 0 0 BARCODE\\nP 1 2 0 P 0 0'],
      ['ordinal/steps/pcb/eda/data','LYR top\\nNET PAD_NET\\nFID C 0 1'],
    ];
    const ordinalRecords=ordinalRows.map(([name,text])=>({file:new File([text],name),text,kind:'UNKNOWN'}));
    parseOdb(ordinalRecords,ordinalBoard);
    const ordinalFeature=ordinalBoard.layers.find(layer=>layer.odbLayerName==='top').features[0];
    const ordinalStructure=odbStructure(ordinalRecords);
    globalThis.odbGate={
      source:board.sourceType,
      step:board.odb.step,
      layers:board.layers.map(layer=>[layer.odbLayerName,layer.type]),
      kinds:[...new Set(features.map(feature=>feature.kind))],
      nets:board.odb.nets,
      vcc:features.filter(feature=>feature.net==='VCC').length,
      gnd:features.filter(feature=>feature.net==='GND').length,
      components:board.components.length,
      editable:features.filter(feature=>feature.sourceNode?.type==='odb_feature').length,
      readOnly:features.filter(feature=>feature.kind==='region').every(feature=>feature.nativeReadOnly),
      editableComponents:board.components.every(component=>component.sourceNode?.type==='odb_component'&&!component.nativeReadOnly),
      barcodeOrdinal:[ordinalFeature.odbFeatureNum,ordinalFeature.net,ordinalStructure.features['ordinal/steps/pcb/layers/top/features'].B],
      report:fidelityText(board),
    };
  `).runInContext(context);
  assert.equal(context.odbGate.source, "ODB++ NATIVE");
  assert.equal(context.odbGate.step, "pcb");
  assert.equal(JSON.stringify(context.odbGate.layers.slice(0, 2)), JSON.stringify([["top", "Copper Top"], ["bottom", "Copper Bottom"]]));
  assert.equal(context.odbGate.kinds.sort().join("|"), "arc|pad|region|track");
  assert.equal(context.odbGate.nets.join("|"), "VCC|GND");
  assert.equal(context.odbGate.vcc, 2);
  assert.equal(context.odbGate.gnd, 2);
  assert.equal(context.odbGate.components, 2);
  assert.equal(context.odbGate.editable, 5);
  assert.equal(context.odbGate.readOnly, true);
  assert.equal(context.odbGate.editableComponents, true);
  assert.equal(JSON.stringify(context.odbGate.barcodeOrdinal), JSON.stringify([1, "PAD_NET", 1]));
  assert.match(context.odbGate.report, /ODB\+\+ write-back scope/);
});

test("inherits ODB++ product units and enforces output format bounds", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const rows=[
      ['metric/misc/info','UNITS=MM'],
      ['metric/matrix/matrix',SAMPLE.odb.matrix],
      ['metric/steps/pcb/layers/top/features','$0 r500\\nP 1 2 0 P 0 0'],
      ['metric/steps/pcb/layers/bottom/features','UNITS=INCH\\n$0 r10\\nP 1 1 0 P 0 0'],
      ['metric/steps/pcb/layers/comp_+_top/components','CMP 0 3 4 0 N U1 VALUE'],
    ];
    const records=rows.map(([name,text])=>{const data=new TextEncoder().encode(text);return{file:new File([data],name),data,text,kind:'UNKNOWN'}});
    const board=newBoard('ODB++ unit inheritance gate');
    parseOdb(records,board);
    const top=board.layers.find(layer=>layer.odbLayerName==='top').features[0];
    const bottom=board.layers.find(layer=>layer.odbLayerName==='bottom').features[0];
    const component=board.components[0];
    applyGeometryEdit(top,'nudge',{x:1,y:0},board);
    applyGeometryEdit(bottom,'nudge',{x:.001,y:0},board);
    const inheritedReport=odbWritebackReport(board);
    const inchPatch=inheritedReport.patches.find(patch=>patch.fileName.includes('/bottom/')&&patch.label.endsWith(' X'));
    const qualifiedBoard=newBoard('ODB++ qualified symbol gate');
    const qualifiedLayer={id:'q',name:'qualified',type:'Copper Top',odbLayerName:'qualified',features:[]};
    parseOdbFeatures('metric/steps/pcb/layers/qualified/features','UNITS=MM\\n$0 rect3x5 I\\n$1 r10_future\\nP 1 2 0 P 0 0\\nP 3 4 1 P 0 0',qualifiedLayer,qualifiedBoard);
    const malformedBoard=newBoard('ODB++ malformed component gate');
    parseOdbComponents('metric/steps/pcb/layers/comp_+_top/components','UNITS=MM\\nCMP 0 3 4 WHAT N U2 BAD',malformedBoard,'Top');
    let intakeRefused=false;
    try{
      parseOdbFeatures('metric/steps/pcb/layers/top/features','UNITS=MM\\n$0 r500\\nP 2450.001 0 0 P 0 0',{id:'l',name:'top',type:'Copper Top',odbLayerName:'top',features:[]},newBoard());
    }catch(error){intakeRefused=error.message.includes('2450 mm')}
    let lineIntakeRefused=false;
    const longRows=[['long/matrix/matrix',SAMPLE.odb.matrix],['long/steps/pcb/layers/top/features','U'+'X'.repeat(1400)]];
    const longRecords=longRows.map(([name,text])=>({file:new File([text],name),text,kind:'UNKNOWN'}));
    try{parseOdb(longRecords,newBoard())}catch(error){lineIntakeRefused=error.message.includes('1400-character')}
    const coordinateBoard=newBoard('ODB++ coordinate gate');
    parseOdb(records,coordinateBoard);
    const far=coordinateBoard.layers.find(layer=>layer.odbLayerName==='top').features[0];
    applyGeometryEdit(far,'nudge',{x:2449.001,y:0},coordinateBoard);
    const coordinateReport=odbWritebackReport(coordinateBoard);
    const lineBoard=newBoard('ODB++ line gate');
    parseOdb(records,lineBoard);
    const pad=lineBoard.layers.find(layer=>layer.odbLayerName==='top').features[0];
    const member=lineBoard.originalOdb.members.find(item=>item.name===pad.sourceNode.fileName);
    const raw='P 1 2 0 P 0 0',line1400=raw+';'+'X'.repeat(1397-raw.length-1);
    member.text=member.text.replace(raw,line1400);
    member.data=new TextEncoder().encode(member.text);
    applyGeometryEdit(pad,'nudge',{x:2449,y:0},lineBoard);
    const boundaryReport=odbWritebackReport(lineBoard);
    member.text+='\\nU'+'X'.repeat(1400);
    member.data=new TextEncoder().encode(member.text);
    const overlongReport=odbWritebackReport(lineBoard);
    globalThis.odbFormatGate={
      inheritedPass:inheritedReport.pass,
      defaultUnits:board.odb.defaultUnits,
      top:[top.x,top.w,top.sourceNode.units],
      bottom:[bottom.x,bottom.sourceNode.units,inchPatch?.value,!/[eE]/.test(inchPatch?.value||'')],
      component:[component.x,component.y,component.sourceNode.units],
      qualifiedSymbol:[Math.abs(qualifiedLayer.features[0].w-.0762)<1e-9,Math.abs(qualifiedLayer.features[0].h-.127)<1e-9],
      customSymbolReadOnly:qualifiedLayer.features[1].nativeReadOnly&&!qualifiedLayer.features[1].sourceNode,
      malformedComponentReadOnly:malformedBoard.components[0].nativeReadOnly&&malformedBoard.components[0].nativeEditOps.length===0,
      fixedSmall:odbFormatNumber(.000001,25.4),
      intakeRefused,
      lineIntakeRefused,
      coordinateRefused:!coordinateReport.pass&&coordinateReport.errors.some(error=>error.includes('coordinate')),
      boundaryPass:boundaryReport.pass,
      overlongRefused:!overlongReport.pass&&overlongReport.errors.some(error=>error.includes('1400-character')),
    };
  `).runInContext(context);
  assert.equal(context.odbFormatGate.inheritedPass, true);
  assert.equal(context.odbFormatGate.defaultUnits, "MM");
  assert.equal(JSON.stringify(context.odbFormatGate.top), JSON.stringify([2, 0.5, "MM"]));
  assert.equal(JSON.stringify(context.odbFormatGate.bottom), JSON.stringify([25.401, "INCH", "1.00003937", true]));
  assert.equal(JSON.stringify(context.odbFormatGate.component), JSON.stringify([3, 4, "MM"]));
  assert.equal(JSON.stringify(context.odbFormatGate.qualifiedSymbol), JSON.stringify([true, true]));
  assert.equal(context.odbFormatGate.customSymbolReadOnly, true);
  assert.equal(context.odbFormatGate.malformedComponentReadOnly, true);
  assert.equal(context.odbFormatGate.fixedSmall, "0.000000039");
  assert.equal(context.odbFormatGate.intakeRefused, true);
  assert.equal(context.odbFormatGate.lineIntakeRefused, true);
  assert.equal(context.odbFormatGate.coordinateRefused, true);
  assert.equal(context.odbFormatGate.boundaryPass, true);
  assert.equal(context.odbFormatGate.overlongRefused, true);
});

test("preserves ODB++ member bytes while reopening staged token patches", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const board=newBoard('ODB++ write-back release gate');
    const top=SAMPLE.odb.top.replace('L 5 5 35 5 0 P 0','L 5 5 35 5 0 P 0;ID=77 FUTURE=keep');
    const rows=[
      ['job/matrix/matrix',SAMPLE.odb.matrix],
      ['job/steps/pcb/layers/top/features',top],
      ['job/steps/pcb/layers/bottom/features',SAMPLE.odb.bottom],
      ['job/steps/pcb/layers/comp_+_top/components',SAMPLE.odb.components],
      ['job/steps/pcb/eda/data',SAMPLE.odb.eda],
    ];
    const records=rows.map(([name,text])=>{const data=new TextEncoder().encode(text);return{file:new File([data],name),data,text,kind:'UNKNOWN'}});
    const opaque=new Uint8Array([0,1,2,127,128,255]);
    records.push({file:new File([opaque],'job/user/opaque.bin'),data:opaque,text:new TextDecoder().decode(opaque),kind:'UNKNOWN'});
    parseOdb(records,board);
    const features=board.layers.flatMap(layer=>layer.features);
    const line=features.find(feature=>feature.sourceNode?.record==='L');
    const pad=features.find(feature=>feature.sourceNode?.record==='P');
    const arc=features.find(feature=>feature.sourceNode?.record==='A');
    const component=board.components[0];
    applyGeometryEdit(line,'nudge',{x:1.25,y:-.5},board);
    applyGeometryEdit(pad,'nudge',{x:.25,y:.5},board);
    applyGeometryEdit(arc,'nudge',{x:-1,y:2},board);
    applyGeometryEdit(component,'nudge',{x:2,y:-1},board);
    applyGeometryEdit(component,'rotate',{},board);
    const report=odbWritebackReport(board);
    const entry=name=>report.entries.find(item=>item.name===name).data;
    const sidecarText='legacy checksum';
    board.originalOdb.members.push({name:'job/steps/pcb/layers/top/.features.sum',text:sidecarText,data:new TextEncoder().encode(sidecarText)});
    const sidecarReport=odbWritebackReport(board);
    globalThis.odbWritebackGate={
      pass:report.pass,
      reopened:report.reopened,
      structureMatch:report.structureMatch,
      transformsMatch:report.transformsMatch,
      netsMatch:report.netsMatch,
      patches:report.patches.map(patch=>patch.label),
      top:new TextDecoder().decode(entry('job/steps/pcb/layers/top/features')),
      eda:Array.from(entry('job/steps/pcb/eda/data')),
      originalEda:Array.from(new TextEncoder().encode(SAMPLE.odb.eda)),
      opaque:Array.from(entry('job/user/opaque.bin')),
      untouchedMembers:report.untouchedMembers,
      sidecarRefused:!sidecarReport.pass&&sidecarReport.errors.some(error=>error.includes('checksum sidecar')),
    };
  `).runInContext(context);
  assert.equal(context.odbWritebackGate.pass, true);
  assert.equal(context.odbWritebackGate.reopened, true);
  assert.equal(context.odbWritebackGate.structureMatch, true);
  assert.equal(context.odbWritebackGate.transformsMatch, true);
  assert.equal(context.odbWritebackGate.netsMatch, true);
  assert.match(context.odbWritebackGate.top, /;ID=77 FUTURE=keep/);
  assert.deepEqual(context.odbWritebackGate.eda, context.odbWritebackGate.originalEda);
  assert.equal(JSON.stringify(context.odbWritebackGate.opaque), JSON.stringify([0, 1, 2, 127, 128, 255]));
  assert.ok(context.odbWritebackGate.patches.some(label => label.endsWith("centre X")));
  assert.ok(context.odbWritebackGate.patches.some(label => label.endsWith("rotation")));
  assert.equal(context.odbWritebackGate.untouchedMembers, 4);
  assert.equal(context.odbWritebackGate.sidecarRefused, true);
});

test("re-extracts validated ODB++ ZIP and TGZ archives without payload drift", async () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    globalThis.odbArchiveGate={odbArchiveOutput,readZip,gunzipBytes,readTarBytes,makeTgz};
    globalThis.odbArchiveEntries=[
      {name:'wrapper/job/matrix/matrix',data:new TextEncoder().encode('STEP {\\n NAME=pcb\\n}')},
      {name:'wrapper/job/user/.matrix.sum',data:new Uint8Array([0,10,13,255])},
      {name:'wrapper/job/steps/pcb/layers/top/features',data:new TextEncoder().encode('UNITS=MM\\n$0 r500\\nP 1 2 0 P 0 0')},
      {name:'wrapper/job/user/repetitive.bin',data:new Uint8Array(100000).fill(65)},
    ];
  `).runInContext(context);
  const zip = await context.odbArchiveGate.odbArchiveOutput(context.odbArchiveEntries, "zip");
  const tgz = await context.odbArchiveGate.odbArchiveOutput(context.odbArchiveEntries, "tgz");
  const zipFiles = await context.odbArchiveGate.readZip(new context.File([zip], "out.zip"));
  const tar = await context.odbArchiveGate.gunzipBytes(new Uint8Array(await tgz.arrayBuffer()), "test TGZ", 32 * 1024 * 1024, Infinity);
  const tgzFiles = context.odbArchiveGate.readTarBytes(tar, "test TGZ");
  const corrupt = tar.slice();
  corrupt[0] ^= 1;
  assert.throws(() => context.odbArchiveGate.readTarBytes(corrupt, "corrupt TGZ"), /TAR header checksum mismatch/);
  await assert.rejects(
    () => context.odbArchiveGate.makeTgz([{ name: "job/large.bin", data: { byteLength: 32 * 1024 * 1024 } }]),
    /32 MiB.*validated ZIP/,
  );
  assert.deepEqual(zipFiles.map(file => file.name), context.odbArchiveEntries.map(entry => entry.name));
  assert.deepEqual(tgzFiles.map(file => file.name), context.odbArchiveEntries.map(entry => entry.name));
  for (let i = 0; i < context.odbArchiveEntries.length; i++) {
    const expected = Array.from(context.odbArchiveEntries[i].data);
    assert.deepEqual(Array.from(new Uint8Array(await zipFiles[i].arrayBuffer())), expected);
    assert.deepEqual(Array.from(new Uint8Array(await tgzFiles[i].arrayBuffer())), expected);
  }
});

test("expands bounded ODB++ TGZ trees", async () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}\nglobalThis.odbArchiveApi={expandInputFiles};`).runInContext(context);
  const tar = tarFile([
    ["job/matrix/matrix", "STEP {\n COL=1\n NAME=pcb\n}"],
    ["job/steps/pcb/layers/top/features", "UNITS=MM\n$0 r500\nP 1 1 0 P 0 0"],
  ]);
  const expanded = await context.odbArchiveApi.expandInputFiles([new context.File([gzipSync(tar)], "job.tgz")]);
  assert.equal(expanded.map(file => file.name).join("|"), "job/matrix/matrix|job/steps/pcb/layers/top/features");
});

test("certifies Gerber, drill, job, and layer-PDF manufacturing output", () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}
    const board=newBoard('Batch 5 release gate');
    parseGerber('top.gtl',SAMPLE.gerber,board);
    parseDrill('board-PTH.drl',SAMPLE.slotDrill,board);
    board.layers.find(layer=>layer.type==='Drill').features.push({id:'npth',kind:'hole',x:7,y:7,d:1,plated:false});
    computeBounds(board);
    const pkg=buildFabPackage(board);
    const pdf=layerPdf(board.layers.find(layer=>layer.type!=='Drill'),board);
    globalThis.batch5Gate={
      pass:pkg.report.pass,
      tolerance:pkg.report.toleranceMm,
      names:pkg.entries.map(entry=>entry.name),
      attributes:pkg.job.FilesAttributes,
      report:pkg.entries.find(entry=>entry.name==='ROUNDTRIP.txt').data,
      pdfText:new TextDecoder().decode(pdf.data),
    };
  `).runInContext(context);
  assert.equal(context.batch5Gate.pass, true);
  assert.equal(context.batch5Gate.tolerance, 0.01);
  assert.ok(context.batch5Gate.names.includes("board-PTH.drl"));
  assert.ok(context.batch5Gate.names.includes("board-NPTH.drl"));
  assert.ok(context.batch5Gate.names.includes("board.gbrjob"));
  assert.ok(context.batch5Gate.names.includes("ROUNDTRIP.json"));
  assert.match(context.batch5Gate.report, /Declared numerical tolerance: \+\/- 0\.010 mm/);
  assert.match(context.batch5Gate.pdfText, /PRINT CHECK: 50 mm PHYSICAL BAR/);
  assert.ok(context.batch5Gate.attributes.every(item => item.FilePolarity === "Positive"));
});

test("round-trips safe ZIP members and refuses traversal paths", async () => {
  assert.ok(script);
  const { context } = harness();
  new vm.Script(`${script}\nglobalThis.zipApi={makeZip,readZip};`).runInContext(context);

  const valid = context.zipApi.makeZip([{ name: "fab/top.gtl", data: "M02*" }]);
  const extracted = await context.zipApi.readZip(new context.File([valid], "job.zip"));
  assert.equal(extracted.length, 1);
  assert.equal(extracted[0].name, "fab/top.gtl");
  assert.equal(await extracted[0].text(), "M02*");

  const hostile = context.zipApi.makeZip([{ name: "../escape.gbr", data: "M02*" }]);
  await assert.rejects(
    context.zipApi.readZip(new context.File([hostile], "hostile.zip")),
    /Unsafe ZIP member path was refused/,
  );
});
