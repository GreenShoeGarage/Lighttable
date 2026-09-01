# LIGHTTABLE: Put PCB Manufacturing Data Under the Lamp

Printed circuit board review often starts with a file set that looks simple until it is not. A Gerber job arrives without useful filenames. The drill file leaves its zero convention ambiguous. A placement export uses a different set of column names. A fabrication note points at a location that takes five minutes to find in the design tool.

LIGHTTABLE is a Green Shoe Garage Field Instrument built for that moment.

The name comes from the backlit inspection surface used to compare films, drawings, and transparencies. The browser becomes that surface. Drop the local manufacturing files onto it, inspect the layer stack, trace a net, measure a clearance, add a review note, make a small correction, and hand the result to the next person.

The workflow stays deliberately narrow:

`INTAKE -> RENDER -> INSPECT -> MARK / EDIT -> OUTPUT`

## Fidelity is part of the interface

Manufacturing data tools can be dangerously confident. A parser may show something plausible while quietly skipping an aperture macro, assuming the drill units, or flattening native CAD content during export.

LIGHTTABLE uses three visible tiers instead:

- Full means there is no known loss in the recognized input.
- Partial means the board can still be useful, but every known approximation or assumption is named.
- Preview means the geometry is only an orientation aid. Measurement and fabrication export stay locked.

That report remains attached to the job. Generated Gerber packages include `FIDELITY.txt`; preserving native write-back keeps the report separately exportable so it does not alter the native source tree.

## Local by construction

The entire instrument lives in one HTML file. It can be opened directly from disk. There is no account, server, remote font, CDN, telemetry call, or runtime model download. Board data stays on the machine in front of the inspector.

Local-first also changes the implementation discipline. Native text source bytes stay untouched beside the parsed model, while archive inputs retain their expanded logical paths and payloads. Markup lives on a separate layer. Browser storage exposes a visible save state. Imports have hard member-count and expanded-size limits. Text from a board file is never treated as interface markup.

ODB++ support extends that rule to a structured manufacturing tree. LIGHTTABLE can open a selected folder, ZIP, or TGZ, use the matrix to choose and order layers, render common feature and symbol records, read component placements, and connect EDA net names back to numbered layer features. Batch 9 adds preserving output without introducing a general serializer: a bounded move or component rotation patches only the original numeric tokens, then the complete tree must reopen with the same matrix, paths, record counts, and FID net assignments. Unsupported symbols, uncommon records, additional steps, and font approximations are named in the Fidelity Report while every expanded source member remains available in the job.

Altium support follows a stricter read-only boundary. LIGHTTABLE can open line-oriented ASCII `.PcbDoc` files and binary Microsoft Compound File documents, inventory their native storage families, and render verified common tracks, arcs, pads, vias, fills, regions, text, components, layers, and nets. The original bytes stay unchanged. Unknown families are named instead of guessed, and no native or manufacturing write-back is offered from an Altium source.

The 3D view now lifts that same parsed geometry into an interactive review model. The board outline becomes an extruded substrate, visible manufacturing layers sit at ordered heights, drills open through the surface, and top or bottom placements become bounded component bodies. Orbit, pan, zoom, view presets, adjustable thickness, approximate package height, and exploded layer spacing make the stack easier to understand without adding a network dependency. The interface labels this honestly: it is a geometry-derived visualization, not a STEP assembly or a source-certified mechanical clearance model.

## Small edits without pretending to be a layout editor

LIGHTTABLE is not another PCB design environment. Its edit station is for the small change that a reviewer or fabricator may request. The most sensitive paths are native write-back. For KiCad, LIGHTTABLE keeps the original source and patches only the position, angle, endpoint, or layer fields changed on supported footprints, pads, segments, and silkscreen text. For Eagle, it reads native layers, signals, packages, and elements but permits edits only to element position, rotation, and side. For ASCII DXF, it supports common 2D lines, circles, arcs, lightweight polylines, text, and points, then patches only the group values or entity record required by a supported move, rotation, mirror, or deletion. For ODB++, it permits coordinate moves on supported line, pad, and arc records and move or 90-degree rotation on standalone component records. A diff shows the exact pending source fields, and export is refused unless the patched source reopens with matching structure and geometry.

That constraint is a feature. Unknown tokens, comments, ordering, and whitespace outside the edited nodes remain intact.

Manufacturing export uses the same skeptical posture. LIGHTTABLE preserves imported Gerber aperture and X2 metadata, separates plated and non-plated drilling, and reopens every generated Gerber with its production parser. Generated DXF goes through two re-imports before release. ODB++ ZIP and TGZ outputs are re-extracted, TAR headers are checksum-validated, and every payload is compared before download; archive and inner-gzip metadata may be normalized, while expanded logical member paths and unedited payload bytes stay fixed. TGZ generation has a lower in-memory ceiling than ZIP. Output is withheld if any required comparison fails. Per-layer vector PDFs carry their own scale declaration and physical print-check bar.

## What v1.5 can do

The instrument opens common Gerber and X2 data, Excellon drill files, KiCad boards, read-only Altium PcbDoc files, Eagle XML boards, ASCII DXF drawings, ODB++ folder or archive trees, placement CSV files, and ZIP jobs. It renders a layered 2D board with top and bottom conventions plus an interactive 3D review model, measures point distance and feature clearance, highlights named nets, searches components, collects statistics, and keeps annotations separate from board geometry.

Output includes Gerber, drill, job data, certified ASCII DXF, preserving ODB++ ZIP and TGZ trees, placement CSV, PNG, PDF, print views, and mergeable Markup Packages. An embedded sample board and browser self-test keep the instrument teachable and inspectable even when no real job is at hand.

IPC-D-356, IPC-2581, BoardView, DFM checks, and panelisation remain gated by hostile review. Binary DXF, 3D DXF entities, blocks, splines, hatches, dimensions, embedded STEP models, and package-accurate mechanical bodies also remain outside the current contract.

LIGHTTABLE is available under GPL-3.0.

Make. Hack. Learn. Share. Repeat.
