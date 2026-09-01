# LIGHTTABLE Testing Notes

## In-app self-test

Open ABOUT and select **Run self-test**. The 139-test harness covers:

1. Gerber fixed-point coordinates, parameter tokenization, layer identification, arcs, regions, step and repeat, polarity, common aperture macros, and exact zero-width hairline apertures
2. Excellon G85 and routed slots, M71 and M72 legacy unit commands, leading-zero decoding, and contradictory-unit refusal
3. Gerber job-file ordering
4. ZIP path traversal refusal and CRC-32 output
5. Placement CSV quoted fields
6. Circle, stroke, pad, polygon, and arc boundary clearance
7. Projected snapping, connected outline detection, and spatial-index queries
8. Same-layer copper contact, deterministic derived networks, source-net reconciliation, opens, conflicts, and clear-polarity conductor exclusion
9. Plated-hole cross-layer bridges, non-plated isolation, dangling endpoints, and connectivity report serialization
10. Markup fingerprints, Gerber export structure, and the KiCad preserving write-back engine
11. KiCad object coverage, native layer partitioning, footprint child transforms, and individual pad, segment, and silkscreen text patches
12. Unknown-token retention, object-count comparison, structural reopen validation, and native edit snapshot restoration
13. Gerber aperture and X2 metadata preservation, automatic re-import, numerical tolerance reporting, and stronger job manifests
14. PTH and NPTH drill separation, plating-attribute detection, G85 and routed-slot output, per-layer PDF scale blocks, and hostile Gerber refusal
15. Eagle file classification, XML structure accounting, native layer mapping, signals, contact references, packages, elements, and derived package geometry
16. Eagle element move, rotation, side mirroring, child synchronization, read-only derived geometry, minimal XML attributes, unknown-element retention, reopen validation, and native edit snapshot restoration
17. ASCII DXF classification, bounded syntax, units, layer mapping, common 2D entities, outline derivation, and hostile binary or NUL refusal
18. DXF move, rotation, mirror, deletion, minimal group patches, unknown entity and XDATA retention, structural reopen validation, native edit snapshot restoration, and generated double re-import identity
19. ODB++ matrix arrays, product-root and primary-step discovery, native layer mapping, standard symbols, lines, pads, arcs, and polygon surfaces
20. ODB++ component records, EDA net names, FID links to rendered features, read-only barcode ordinal retention, product-default, member-local, and per-symbol units, fixed-decimal inch patches, orientation semantics, source-token ranges, and operation-specific edit enforcement
21. ODB++ minimal coordinate and rotation patches, 2450 mm coordinate bounds, 1,400-character parsed-record limits, unknown-tail retention, expanded-payload identity, stale-range refusal, undo and redo snapshots, structural reopen, transform comparison, net-link comparison, and USTAR path plus checksum handling
22. Generated connectivity-worker isolation, geometry-revision cache rejection, and confirmation that Fidelity Report generation never starts a whole-board analysis
23. Altium PcbDoc classification, ASCII primitive coverage, mil and millimetre scaling, native layer and net mapping, read-only enforcement, binary primitive framing, and malformed-record refusal
24. 3D outline normalization, perspective projection, top and bottom layer ordering, exploded spacing, top and bottom component extrusion, deterministic scene budgeting, and fidelity disclosure

## Manual release checks

- Load the embedded sample and verify the Fidelity Report reads Full.
- Toggle every layer and palette.
- Switch top and bottom views and verify reference geometry mirrors with the board.
- Open 3D from the canvas control and verify the same outline, visible layers, holes, pads, tracks, and top or bottom components appear in the review model.
- Drag to orbit, Shift-drag to pan, use the wheel to zoom, and verify Isometric, Top, Bottom, and Reset camera controls return stable views.
- Adjust board thickness, component height, and layer separation. Verify the board extrusion, component bodies, and exploded layer positions update without changing manufacturing geometry.
- Hide components, toggle individual layers, and verify those choices are reflected immediately in 3D. Reload and verify the 2D or 3D mode plus 3D camera settings recover from local autosave.
- Click a component and pad in 3D and verify the Inspect panel reports the selected reference, layer, coordinates, and net when available.
- Load more than 20,000 visible features and verify the 3D status badge discloses bounded sampling while orbit, pan, and zoom remain responsive.
- Verify precise measurement, clearance, markup placement, editing, and 1:1 printing direct the user back to 2D. PNG and composite PDF may capture the current 3D review view.
- Measure between the two large flashed pads and verify the measurement lists the 0.01 mm geometry tolerance.
- Measure a pad-to-track clearance and verify the witness line touches both feature boundaries.
- In Inspect, select **Analyze connectivity**, then trace `SIG_CLK` and verify only its geometry-connected track and two pads highlight.
- While connectivity is running, pan, zoom, select geometry, switch stations, and cancel the task. Verify the viewer remains responsive and no partial result is retained.
- After analysis completes, change a palette, view, layer color, annotation, or measurement and verify the result stays available. Move board geometry and verify the result is invalidated.
- Search for `U1`, `10k`, `SIG_CLK`, and a derived `DNET-###` name.
- Load touching unnamed copper and verify it appears as one derived network.
- Load one named net split into two copper islands and verify it is reported open.
- Load touching copper with two different source-net names and verify a conflict is reported.
- Load matching top and bottom pads with a plated drill hit and verify one cross-layer network; repeat with a non-plated hole and verify two networks.
- Export connectivity JSON and CSV and verify network status, source names, layer membership, opens, conflicts, and dangling endpoints.
- Add a pin, box, and arrow annotation. Export and re-import the Markup Package.
- Export PNG, PDF, placement CSV, and the fab ZIP.
- Confirm the fab ZIP contains `FIDELITY.txt`, `ROUNDTRIP.txt`, and `ROUNDTRIP.json`, and reports v1.5.0 plus every declared numerical tolerance.
- Confirm imported Gerber aperture definitions and X2 file, aperture, and object attributes remain in the exported layer.
- Confirm the fabrication export refuses download when a generated Gerber fails its automatic re-import comparison.
- Load drill data with plated and non-plated tools and verify separate `board-PTH.drl` and `board-NPTH.drl` outputs.
- Export the same slot set in preserve-source, G85, and routed-path modes and verify the selected commands.
- Export the layer PDF package. Confirm every PDF has a title block, declared drawing scale, layer identity, board dimensions, and a 50 mm physical print-check bar.
- Load a board with clear-polarity copper and verify the cleared region affects only its own layer.
- Load an outline layer made from connected lines and arcs and verify board dimensions follow the closed profile.
- Load the supplied legacy Eagle Gerber job and verify its 16.4973 x 37.9451 mm outline is not inflated, all `%ADD...C,0.0000*%` features render as hairlines, and the M72 drill file aligns with the copper.
- Open Inspect on a job with at least 5,000 features and verify statistics appear immediately, connectivity remains NOT RUN, and search does not trigger connectivity analysis.
- Run `npm run benchmark:lighttable` and verify the 6,000-feature synthetic job stays below the 100 ms Inspect gate, below the 10 s connectivity-core gate, below the 250 ms 3D scene-rendering gate, the 10,000-record Altium ASCII job stays below the 1 s intake gate, and the standalone file stays below 350 KiB.
- Pan and zoom a board with more than 10,000 features and verify offscreen features are culled without changing hit-test results.
- Load a KiCad board and move, rotate, and mirror one footprint. Verify its pads and footprint text follow the parent and switch native layers when mirrored.
- Independently transform a pad, segment, and silkscreen text item. Verify the diff names only their changed position, angle, endpoint, or layer fields.
- Verify a KiCad file with unknown top-level and nested tokens retains those exact tokens after write-back.
- Validate and export a changed KiCad board. Verify the report shows matching structure and a successful reopen before the download is enabled.
- Undo and redo each native edit. Verify the rendered geometry and pending source patch plan return to the corresponding snapshot.
- Confirm native Delete is unavailable and does not stage or regenerate KiCad source.
- Load an Eagle XML board and verify declared Top, Bottom, Dimension, tPlace, and bPlace layers partition correctly.
- Verify Eagle signal wires carry source net names and contact references assign those names to the matching instantiated package pads.
- Move, rotate, and mirror an Eagle element. Verify all instantiated package pads, wires, and text follow the parent and switch paired top or bottom layers on mirror.
- Select Eagle package geometry and routing. Verify move, rotate, mirror, and delete controls remain unavailable.
- Preview Eagle write-back and verify only the changed element `x`, `y`, and `rot` attribute values appear in the diff.
- Verify unknown Eagle XML elements and attributes remain byte-for-byte intact after element write-back.
- Validate and export a changed Eagle board. Verify matching XML structure, a successful reopen, and exact transform comparison before download.
- Undo and redo each Eagle element transform and verify geometry plus the pending XML attribute plan return to the matching snapshot.
- Load an ASCII DXF with declared units and a layer table. Verify `LINE`, `CIRCLE`, `ARC`, `LWPOLYLINE`, `TEXT`, and `POINT` geometry is partitioned by native layer.
- Move a line, rotate an arc and text item, mirror a polyline, and delete a circle. Verify the diff names only the required group values or removed entity record.
- Verify unsupported DXF entities, XDATA, ordering, and unedited group records remain byte-for-byte intact after native write-back.
- Validate and export the changed DXF. Verify the entity-count plan and reopened geometry both pass before download.
- Export Profile DXF and verify the generated file reopens, exports again, and reopens a second time with geometry identity at 0.01 mm.
- Load a unitless file and a polyline with bulges. Verify both are marked Partial with named assumptions while original groups remain retained.
- Verify binary DXF and malformed group-code pairs are clearly refused without changing the active board.
- Load the same ODB++ job as a selected folder, ZIP, and TGZ. Verify the matrix layer order, selected step, geometry, components, native nets, and board bounds match.
- Verify ODB++ EDA `FID` records assign the active `NET` name to the expected numbered feature on the expected `LYR` entry.
- Select supported ODB++ `L`, `P`, and `A` records and verify Move is available while Rotate, Mirror, and Delete remain unavailable.
- Select a standalone ODB++ `CMP` record and verify Move and Rotate are available while Mirror, side changes, and Delete remain unavailable. Repeat with a components file containing `TOP` or `PIN` records and verify the component stays read-only.
- Move a line, pad, and arc. Move and rotate a standalone component. Preview write-back and verify only the expected numeric tokens appear, including the arc centre and component rotation.
- Verify ODB++ attributes, IDs, comments, line endings, symbol tables, unknown records, matrix data, component ordering, and EDA `NET`, `LYR`, and `FID` lines remain unchanged outside the displayed token spans.
- Validate and export both ODB++ ZIP and TGZ. Verify each archive contains the same logical member paths in the same order and that every unpatched payload is byte-identical.
- Load an ODB++ product whose `misc/info` declares millimetres while feature and component members omit `UNITS`. Verify display, numeric patches, and reopen validation inherit millimetres, while a member-local declaration still overrides the product default.
- Put a read-only `B` barcode record before a rendered pad and verify EDA FID numbering still assigns the pad's native net. Verify `$` symbol-table `I` and `M` qualifiers override the member unit, and small inch patches use fixed decimal notation with at least eight fractional digits.
- Verify standard-symbol names with suffixes, malformed numeric dimensions, zero dimensions, and components with non-numeric rotation tokens remain read-only and cannot enter the token patch plan.
- Verify ODB++ input and edited output reject coordinates outside +/- 2450 mm, accept a touched record that becomes exactly 1,400 characters, and reject any parsed non-comment record at 1,401 characters even when that record was not edited.
- Reopen both exported archives in LIGHTTABLE and verify matrix order, selected step, feature and component counts, edited geometry, native nets, FID links, and board bounds match the staged model.
- Add a matching legacy checksum sidecar for a member, edit that member, and verify output is refused rather than emitting a stale checksum.
- Confirm the Fidelity Report discloses that ZIP and TGZ container timestamps, permissions, compression, directory entries, and envelope metadata are normalized.
- Load ODB++ with a user-defined symbol, surface circle, text, and an additional step. Verify each unsupported or approximated item is named Partial while all source members remain listed.
- Verify unsafe TAR paths, duplicate members, nested archives, excessive member counts, oversized expansion, malformed TAR bounds, NUL records, and excessive ODB++ record counts are refused without changing the active board.
- Load an ASCII Altium `.PcbDoc` containing tracks, arcs, pads, vias, fills, regions, text, components, and nets. Verify millimetre and mil values produce plausible board dimensions, native layers partition correctly, and the Fidelity Report identifies read-only Altium intake.
- Load a binary Altium `.PcbDoc`. Verify the report inventories CFB storage families, common primitives render at the same physical scale as the ASCII fixture, and undecoded families are named without hiding successfully decoded geometry.
- Select Altium geometry and verify Move, Rotate, Mirror, Delete, fabrication ZIP, placement CSV, certified DXF, and native output remain unavailable. Verify PNG, PDF, print, markup, fidelity, and connectivity review evidence remain available.
- Reload after Altium intake and verify the untouched original source bytes remain available to the recovered local session.
- Reload the page and verify autosave recovery.
- At a desktop viewport, verify the board starts near 46 percent of the viewport width, the divider resizes it with drag and keyboard controls, expansion hides and restores the station panel, and the chosen layout survives reload.
- Repeat the primary path at a 390 px viewport.

## Hostile review gate

The hostile corpus includes or requires the following inputs before further v1.x work:

- Malformed Gerber with incomplete coordinate commands
- Nested ZIP with resource forks and more than 200 members
- ODB++ ZIP and TGZ trees with traversal paths, duplicate members, nested archives, gzip bombs, malformed TAR sizes, bad TAR header checksums, more than 200 members, and more than 300,000 line records
- ODB++ write-back with stale token ranges, overlapping ranges, non-canonical changed text, non-finite or oversized coordinates, linked component data, profile records, unknown symbols, legacy checksum sidecars, and edited records carrying long unknown attribute tails
- ODB++ output trees with opaque binary members, dot-prefixed legacy members, long USTAR wrapper paths, mixed line endings, empty members, and the maximum accepted member and expanded-byte counts, including TGZ output above the 32 MiB expanded TAR limit
- ZIP whose expanded size exceeds 80 MiB
- KiCad file from a newer version with unknown tokens
- Eagle XML with unknown elements and attributes, malformed nesting, entity declarations, missing package references, mirrored rotations, and curved plain wires
- ASCII DXF with unknown entities, XDATA, malformed group pairs, missing section terminators, absent units, non-zero Z values, polyline bulges, excessive entities, NUL bytes, and a binary DXF header
- Drill file with mixed or missing units, G85 slots, and routed slots
- Placement CSV with ambiguous headers and quoted commas
- Gerber with NUL bytes, unterminated parameter blocks, excessive tokens, out-of-range coordinates, excessive step-and-repeat expansion, and feature-count expansion
- Excellon with excessive tools, lines, features, or out-of-range coordinates
- Altium CFB with invalid header values, partial sectors, out-of-range FAT entries, duplicate FAT sectors, cyclic FAT, DIFAT, miniFAT, and directory trees, oversized stream totals, truncated property or primitive frames, excessive contour vertices, missing `Board6` streams, and unknown storage families

Expected behavior is Full for the covered common constructs, Partial or Preview with a named reason, or a clear per-file refusal. The rest of a multi-file job must remain recoverable after one file is refused.

## Release criterion

Do not claim Full fidelity when an input contains a recognized unsupported construct. Do not unlock manufacturing export for Preview input. Do not release ODB++ output unless source-range, tree-structure, transform, FID-net, expanded-payload, TAR-checksum, archive re-extraction, and payload-identity checks all pass.
