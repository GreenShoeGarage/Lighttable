# Changelog

## v1.5.1 - 2026-09-01

- Reworked the default 3D view from a translucent all-layer stack into an assembled, camera-facing PCB surface.
- Added fabrication roles for substrate, board edge, top and bottom copper, soldermask openings, silkscreen, paste, drills, and component packages.
- Hid reverse-side and internal artwork at zero layer separation. A nonzero separation now intentionally switches to the diagnostic exploded fabrication stack.
- Clipped assembled surface artwork to the detected board profile so Gerber features cannot float beyond the substrate.
- Rebalanced materials around soldermask green, muted exposed copper, off-white silkscreen, tan board edges, and dark component packages.
- Verified the supplied 5,175-feature legacy Gerber job against its 16.4973 x 37.9451 mm outline. Top shows GTL, GTO, GTS, and drill geometry; bottom shows GBL, GBO, GBS, and drill geometry.
- Expanded the in-app conformance harness to 143 assertions. The project release suite remains at 29 tests.

## v1.5.0 - 2026-09-01

- Added an interactive, dependency-free 3D review mode derived from the parsed board outline, manufacturing layers, drills, pads, tracks, regions, text, and component placements.
- Added orbit, Shift-drag pan, wheel zoom, isometric, top, bottom, and reset-camera controls with device-local recovery of the selected display mode and camera state.
- Added adjustable board thickness, approximate component height, component visibility, and exploded layer separation without changing the calibrated manufacturing geometry.
- Added top and bottom component extrusion, layer-aware surface ordering, projected drill openings, selection of component and pad geometry, and an on-canvas XYZ orientation triad.
- Added a 20,000-feature and 2,000-component scene budget, deterministic sampling disclosure, cached scene plans, viewport reuse, and animation-frame coalescing for responsive large-job interaction.
- Kept precise measurement, clearance, markup placement, editing, and 1:1 printing in the calibrated 2D view. Fidelity evidence now names every mechanical approximation in the 3D model.
- Added 3D projection, outline, layer-order, exploded-stack, component-extrusion, scene-budget, full render-path, persistence, and 6,000-feature performance gates.
- Expanded the in-app conformance harness to 139 assertions and the project release suite to 29 tests.

## v1.4.0 - 2026-09-01

- Added read-only Altium `.PcbDoc` intake for ASCII property records and binary Microsoft Compound File documents.
- Implemented bounded CFB v3 and v4 parsing with validated header fields, FAT, DIFAT, miniFAT, directory trees, stream sizes, sector ranges, and cycle detection.
- Added binary primitive decoding for common Altium tracks, arcs, pads, vias, fills, regions, board regions, component bodies, and text, plus property decoding for board, component, net, polygon, and version families.
- Added native Altium layer mapping, millimetre and mil conversion, net-name mapping, component references, outline detection, and curve-tessellated arc rendering without the scale inflation seen in malformed previews.
- Preserved original ASCII or binary source bytes unchanged, inventoried compound storage families, and named undecoded or unsupported records in the Fidelity Report.
- Kept all Altium-derived objects read-only and locked manufacturing, placement, native, and certified DXF output for Altium sources. PNG, PDF, print, markup, fidelity, and connectivity review evidence remain available.
- Added generated ASCII and binary miniFAT fixtures, malformed record-length refusal, cyclic allocation-chain refusal, a 10,000-record Altium intake benchmark, and source-retention assertions.
- Expanded the in-app conformance harness to 131 assertions and the project release suite to 28 tests.

## v1.3.0 - 2026-09-01

- Moved geometry-derived connectivity into an inline Blob-backed Web Worker so explicit analysis no longer freezes rendering, pan, zoom, selection, search, or station navigation.
- Added native progress reporting, phase details, cancellation, worker cleanup, and stale-result rejection when board geometry changes during a job.
- Replaced the board-wide dangling-endpoint peer scan with per-layer spatial-index queries, reducing supplied-job connectivity time from about 2.5 s to under 0.9 s in the release benchmark.
- Added geometry revisions so completed connectivity survives cosmetic view, palette, layer, measurement, and annotation saves while real board edits invalidate it safely.
- Removed implicit connectivity execution from Fidelity Report and connectivity exports; network evidence must now come from an explicit completed analysis.
- Added a repeatable large-job benchmark with a 6,000-feature corpus, a 100 ms Inspect gate, a 10 s connectivity-core gate, and a 350 KiB standalone-file gate.
- Verified the supplied 5,175-feature Gerber set at 16.4973 x 37.9451 mm with 1.46 ms Inspect entry and 845 ms optimized connectivity-core time in the release environment.
- Expanded the in-app conformance harness to 123 assertions and the project release suite to 26 tests, including generated-worker execution, cache revision, cancellation, and no-implicit-analysis gates.

## v1.2.3 - 2026-09-01

- Preserved valid zero-width Gerber apertures as display hairlines instead of replacing them with a 0.25 inch fallback that inflated legacy Eagle outline and legend geometry to 6.35 mm.
- Added Excellon M71 and M72 unit detection and leading-zero decoding for legacy Eagle drill files, keeping hole positions and tool diameters aligned with the Gerber layers.
- Made Inspect immediate by removing automatic whole-board minimum-gap and connectivity scans; connectivity now runs only from the explicit Analyze connectivity control.
- Prevented search, net tracing, and ordinary highlighting from starting connectivity analysis implicitly.
- Cached feature geometry and bounds, retained oversized features in a bounded spatial-index overflow path, and removed the empty-query fallback that scanned every board feature.
- Verified the supplied 5,175-feature Gerber job at 16.4973 x 37.9451 mm, with zero-width outline geometry preserved and its first M72 drill hit decoded to 6.3246 x 13.4569 mm at 0.59944 mm diameter.
- Expanded the in-app conformance harness to 120 assertions and the project release suite to 22 tests.

## v1.2.2 - 2026-09-01

- Enlarged the board workspace from a fixed 292 px rail to a roomy 46 percent viewport default with responsive minimums.
- Added a clearly visible draggable divider between the station panel and board, plus Arrow, Home, End, and Shift-modified keyboard resizing.
- Added a one-click board expansion mode that hides the station panel while keeping the restore control available.
- Persisted the preferred board width and expansion state on the device and redraw the canvas throughout layout changes.
- Preserved the single-column mobile board and overlay panel behavior below 760 px.

## v1.2.1 - 2026-08-31

- Added preserving ODB++ write-back as source-span patches for coordinate moves on supported `L`, `P`, and `A` feature records and move or 90-degree rotation on standalone `CMP` records.
- Corrected ODB++ component mirror handling so the `CMP` mirror flag no longer changes the matrix-defined board side, and kept components with linked `TOP` or `PIN` data read-only.
- Retained expanded logical source payloads and refused changed non-canonical text so unedited member bytes, unknown files, record tails, attributes, IDs, comments, whitespace, ordering, and feature ordinals remain provably fixed.
- Added mandatory comparison of member paths, matrix and step records, feature and component counts, EDA records, reopened transforms, and rendered FID net assignments before output.
- Added validated ODB++ ZIP and deterministic USTAR plus gzip TGZ output, with TAR header-checksum validation, automatic re-extraction, and byte-for-byte payload comparison before download.
- Added `misc/info` product-unit inheritance, member-local unit overrides, the ODB++ +/- 2450 mm coordinate range, and the 1,400-character parsed-record limit to both intake and output validation.
- Honored per-symbol `I` and `M` unit qualifiers, emitted high-precision fixed-decimal inch patches, tightened reopen comparison to 0.000001 mm, retained read-only barcode records in FID feature ordinals, and kept malformed symbols or component rotations out of the edit plan.
- Limited TGZ generation to a 32 MiB expanded TAR with streaming decompression bounds; larger accepted product trees retain validated ZIP output.
- Kept profiles, surfaces, approximate text, custom symbols, mirrors, side changes, deletion, reordering, FID changes, and unknown records read-only, and refused edits that would leave a legacy checksum sidecar stale.
- Disclosed that archive timestamps, permissions, compression, directory entries, inner gzip suffixes, and outer envelopes may be normalized while expanded logical member paths and payload bytes are preserved.
- Expanded the live conformance harness to 117 assertions and the project release suite to 19 tests, including ODB++ unit inheritance, barcode ordinal retention, format-bound, token-patch reopen, and ZIP plus TGZ payload-identity gates.

## v1.2.0 - 2026-08-31

- Added bounded ODB++ folder, ZIP, TGZ, TAR.GZ, and individually gzip-compressed member intake with path, duplicate, member-count, file-size, expanded-size, and record-count limits.
- Added product-root discovery, matrix parsing, primary-step selection, matrix layer order, and common board layer-type mapping.
- Added ODB++ standard round, square, rectangle, oval, and oblong symbols plus line, pad, arc, polygon-surface, and approximate text rendering.
- Added ODB++ component-record intake and EDA `NET`, `LYR`, and `FID` parsing so native net names attach to their numbered rendered features.
- Kept ODB++ objects read-only, retained every expanded source member, and made unsupported symbols, records, extra steps, approximations, and the intake-only output boundary explicit in the Fidelity Report.
- Expanded the live conformance harness to 99 assertions and added project-level ODB++ model and TGZ release gates.

## v1.1.1 - 2026-08-31

- Added bounded ASCII DXF intake with declared units, native layer-table mapping, and common 2D `LINE`, `CIRCLE`, `ARC`, `LWPOLYLINE`, `TEXT`, and `POINT` entities.
- Added native move, rotate, mirror, and delete transforms for supported DXF shapes.
- Added minimal coordinate, angle, bulge, and entity-record patches with a native group diff while preserving unknown records, XDATA, ordering, and unedited source bytes.
- Refused native DXF export unless syntax remains balanced, entity counts match the staged edit plan, and supported geometry matches after reopen.
- Added generated ASCII AC1015 DXF output in millimetres with two automatic re-imports and geometry identity comparison at the declared 0.01 mm tolerance.
- Added explicit Partial-fidelity reporting for unitless input, non-zero Z projection, polyline bulge chords, and unsupported DXF entities, plus binary and malformed-input refusal.
- Expanded the live conformance harness to 89 assertions and added project-level native preservation and generated double re-import release gates.

## v1.1.0 - 2026-08-31

- Added Eagle XML board intake for declared layers, signals, contact references, libraries, packages, elements, common pads, wires, text, and vias.
- Added native Eagle element move, rotate, and mirror transforms with synchronized instantiated package geometry and paired top or bottom layer mapping.
- Enforced read-only behavior for Eagle package geometry and routing to keep the editor contract intentionally narrow.
- Added minimal Eagle `x`, `y`, and `rot` attribute patches with native diff preview while preserving all other XML bytes, attributes, comments, ordering, and unknown elements.
- Refused Eagle export unless XML remains balanced, object counts remain unchanged, the patched board reopens, and every staged element transform matches.
- Added Eagle fidelity evidence to the interface and exported report, plus XML entity-declaration refusal and explicit curved-wire chord reporting.
- Expanded the live conformance harness to 77 assertions and added a project-level Eagle preservation and reopen release gate.

## v1.0.5 - 2026-08-31

- Preserved imported Gerber aperture definitions and X2 file, aperture, and object attributes during export.
- Added automatic Gerber export and production-parser re-import comparison with a declared 0.01 mm tolerance and refusal on failure.
- Added human-readable and machine-readable round-trip reports to certified fabrication packages.
- Split plated and non-plated drill output and added preserve-source, G85, and routed-slot strategies.
- Strengthened Gerber job manifests with dimensions, units, file functions, polarity, software identity, and round-trip tolerance.
- Added per-layer vector PDF packages with title blocks, declared drawing scale, board dimensions, and 50 mm physical print-check bars.
- Added Gerber and Excellon resource ceilings and hostile-input refusals for NUL data, malformed blocks, excessive repeats, tools, coordinates, and features.
- Expanded the live conformance harness to 65 assertions and added a full manufacturing-package release gate.

## v1.0.4 - 2026-08-31

- Added preserving KiCad parsing for footprints, pads, segments, footprint text, and board silkscreen text with native layer partitioning.
- Added move, rotate, and mirror transforms for footprints and individual supported native objects, including footprint child synchronization.
- Replaced footprint-only write-back with minimal original-field patches for supported positions, angles, endpoints, and layers.
- Added a stronger write-back diff with changed-node, preserved-slice, structure-match, and reopen-validation evidence.
- Preserved unknown and newer-version KiCad tokens verbatim while keeping fidelity at Partial with named coverage limits.
- Refused KiCad export unless balanced syntax, unchanged object counts, source ranges, and structural reopen validation all pass.
- Added native-edit undo and redo validation and expanded the live conformance harness to 51 assertions.

## v1.0.3 - 2026-08-31

- Added geometry-derived connected networks from same-layer copper contact at an explicit 0.025 mm tolerance.
- Added cross-layer network bridges through parsed plated holes, slots, and aligned drilled pads.
- Reconciled source-net names with deterministic `DNET-###` names for unnamed copper islands.
- Added open named-net, conflicting source-net, and dangling trace-endpoint detection.
- Added network highlighting, connectivity search, board statistics, and focused inspection rows.
- Added JSON and CSV connectivity evidence exports plus connectivity details in `FIDELITY.txt`.
- Expanded the live conformance harness to 41 parser, archive, geometry, connectivity, snapping, outline, and export assertions.

## v1.0.2 - 2026-08-31

- Replaced bounding-box gap estimates with feature-boundary clearance for circular pads, rectangular and polygonal geometry, tracks, slots, regions, and tessellated arcs.
- Added richer center, vertex, edge-projection, and path-projection snap targets.
- Added explicit 0.01 mm curve tolerance reporting to measurements, statistics, and fidelity exports.
- Added explicit and connected-geometry board outline detection.
- Added isolated layer compositing so clear-polarity flashes and regions remove copper from their own layer.
- Added spatial indexing, viewport culling, and cached layer canvases for larger board rendering and inspection.
- Expanded the live conformance harness to 31 parser, archive, geometry, snapping, outline, and export assertions.

## v1.0.1 - 2026-08-31

- Added Gerber circular interpolation, regions, common aperture macros, step and repeat, and clear or dark polarity.
- Strengthened X2 net and file-function handling and Gerber job-file ordering.
- Added Excellon zero-suppression handling, G85 slots, routed slots, and mixed-unit refusal with per-file recovery.
- Hardened ZIP extraction with path normalization, duplicate detection, CRC checks, expansion limits, compression-ratio checks, and nested-archive refusal.
- Added hostile parser corpus coverage for the new Gerber and drill constructs.

## v1.0.0 - 2026-08-31

- Added local Gerber, Excellon, KiCad, placement CSV, and ZIP intake.
- Added 2D layer rendering, top and bottom views, palettes, pan, zoom, and fit controls.
- Added point distance, edge clearance, net highlighting, component search, and board statistics.
- Added separate annotation and measurement layers with mergeable Markup Packages.
- Added preserving KiCad footprint transform write-back with diff preview.
- Added Gerber, drill, job, placement, PNG, PDF, print, markup, and fidelity exports.
- Added IndexedDB autosave, Easy Mode, responsive controls, and a browser self-test.
- Added explicit Full, Partial, and Preview fidelity handling.
