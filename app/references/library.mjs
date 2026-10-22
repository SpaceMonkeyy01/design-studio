// Construction reference library: the Estimator Side Views cross-sections, one entry per drawing set.
// Imported from "Estimator Side Views.zip" (109 drawings, 2026-10-22). Drawings are provided data: replace a file, never redraw it.
// id        library anchor (reference.html#<id>)
// build     construction (BUILDS in registry.mjs)
// ink       'white' = white line art drawn for a dark background (the 8 found in "add -replace cross sections")
// parts     key into PARTS in registry.mjs, when the cross-section has been read into it
// drawings  mounting: MOUNTING_SETS id of that build (null = one section for the whole sign); thickness: flat-cut letters;
//           file: under app/references/; source: path inside the original folder tree
export const LIBRARY = [
 {"id":"halo-lit","title":"Halo-lit channel letters","build":"channel-letter","parts":"halo-lit","source":"Halo Lit Channel Letters","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/halo-lit/backboard-cabinet-2.png","source":"Halo Lit Channel Letters/Backboard Cabinet (2_)/halo lit with backboard cabinet (2 inch).png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/halo-lit/backer-acm-4.png","source":"Halo Lit Channel Letters/Flat ACM Backer (4mm)/HALO LIT WITH 4MM ACM BACKER.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/halo-lit/backer-acrylic-8.png","source":"Halo Lit Channel Letters/Flat Acrylic Backer (8mm)/HALO LIT WITH 8MM ACrylic BACKER.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/halo-lit/backer-aluminum-25.png","source":"Halo Lit Channel Letters/Flat Aluminum Backer (2.5 mm)/halo lit with aluminum backer (.5mm).png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/halo-lit/flush.png","source":"Halo Lit Channel Letters/Flush Mount/image (56).png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/halo-lit/raceway-2.png","source":"Halo Lit Channel Letters/Raceway Mount (2_)/Halo lit with raceway- Exposed back acrylic.png"}]},
 {"id":"metal-backlit-backboard","title":"Metal backlit letters with backboard","build":"channel-letter","ink":"white","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"channel-letter/metal-backlit-backboard/section.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections /Metal Backlit with Backboard - White.png"}]},
 {"id":"face-lit","title":"Face-lit channel letters, with trim","build":"channel-letter","parts":"face-lit","source":"Face Lit Channel Letters/WITH TRIM","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/face-lit/backboard-cabinet-2.png","source":"Face Lit Channel Letters/WITH TRIM/Backboard Cabinet (2_)/face lit with aluminum cabinet 2 inch.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/face-lit/backer-acm-4.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/face lit with flat ACM backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/face-lit/backer-acrylic-8.png","source":"Face Lit Channel Letters/WITH TRIM/Flat Acrylic Backer (8mm)/facelit with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/face-lit/backer-aluminum-25.png","source":"Face Lit Channel Letters/WITH TRIM/Flat Aluminum Backer 2.5mm/face lit with flat aluminum backer.png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/face-lit/flush.png","source":"Face Lit Channel Letters/WITH TRIM/Flush Mount/facelit flush mount.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/face-lit/raceway-2.png","source":"Face Lit Channel Letters/WITH TRIM/Raceway Mount (2_)/Face lit with raceway.png"}]},
 {"id":"face-lit-trimless","title":"Face-lit channel letters, trimless","build":"channel-letter","parts":"face-lit-trimless","source":"Face Lit Channel Letters/TRIMLESS","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/face-lit-trimless/backboard-cabinet-2.png","source":"Face Lit Channel Letters/TRIMLESS/Backboard Cabinet 2 inch/trimless face lit with backboard cabinet 2 inches deep.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/face-lit-trimless/backer-acm-4.png","source":"Face Lit Channel Letters/TRIMLESS/Flat ACM Backer (4mm)/trimless face lit with flat acm backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/face-lit-trimless/backer-acrylic-8.png","source":"Face Lit Channel Letters/TRIMLESS/Flat Acrylic Backer/trimless face lit with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/face-lit-trimless/backer-aluminum-25.png","source":"Face Lit Channel Letters/TRIMLESS/Flat Aluminum Backer 2.5mm/trimless with flat aluminum backer.png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/face-lit-trimless/flush.png","source":"Face Lit Channel Letters/TRIMLESS/Flush Mount/trimless face lit flush mount.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/face-lit-trimless/raceway-2.png","source":"Face Lit Channel Letters/TRIMLESS/Raceway Mount (2 inch)/trimless face lit with raceway.png"}]},
 {"id":"front-lit-elevation","title":"Front-lit letters: elevation + section A-A","build":"channel-letter","ink":"white","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections","drawings":[
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/front-lit-elevation/flush.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections /Front-lit Flush Mount - White.png"}]},
 {"id":"front-lit-backboard","title":"Front-lit letters with 2D backboard","build":"channel-letter","ink":"white","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections","drawings":[
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/front-lit-backboard/backer-acm-4.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections /Front-lit with 2D Backboard - White.png"}]},
 {"id":"side-lit","title":"Side-lit channel letters","build":"channel-letter","parts":"side-lit","source":"Side Lit Channel Letters","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/side-lit/backboard-cabinet-2.png","source":"Side Lit Channel Letters/Backboard Cabinet (2_)/Side Lit with aluminum cabinet 2 inch.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/side-lit/backer-acm-4.png","source":"Side Lit Channel Letters/Flat ACM Backer (4mm)/Side Lit with flat acm backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/side-lit/backer-acrylic-8.png","source":"Side Lit Channel Letters/Flat Acrylic Backer (8mm)/Side Lit with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/side-lit/backer-aluminum-25.png","source":"Side Lit Channel Letters/Flat Aluminum Backer 2.5mm/Side Lit with flat aluminum backer.png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/side-lit/flush.png","source":"Side Lit Channel Letters/Flush Mount/Side Lit flush mount.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/side-lit/raceway-2.png","source":"Side Lit Channel Letters/Raceway Mount (2_)/Side Lit with raceway.png"}]},
 {"id":"face-halo-lit","title":"Face & halo-lit channel letters","build":"channel-letter","parts":"face-halo-lit","source":"Face & Halo Lit Channel Letters","drawings":[
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/face-halo-lit/flush.png","source":"Face & Halo Lit Channel Letters/Flush Mount/face and halo lit flush mount.png"},
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/face-halo-lit/backboard-cabinet-2.png","source":"Face & Halo Lit Channel Letters/backboard cabinet 2 inch/face and halo lit with aluminum backer.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/face-halo-lit/backer-acm-4.png","source":"Face & Halo Lit Channel Letters/flat acm backer 4mm/face and halo lit with flat acm backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/face-halo-lit/backer-acrylic-8.png","source":"Face & Halo Lit Channel Letters/flat acrylic backer 8mm/face and halo lit with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/face-halo-lit/backer-aluminum-25.png","source":"Face & Halo Lit Channel Letters/flat aluminum backer 2.5mm/face and halo lit with flat aluminum backer.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/face-halo-lit/raceway-2.png","source":"Face & Halo Lit Channel Letters/raceway ,mount 2 inch /face and halo lit with raceway.png"}]},
 {"id":"face-side-lit","title":"Face & side-lit channel letters","build":"channel-letter","parts":"face-side-lit","source":"Face & Side Lit Channel Letters","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/face-side-lit/backboard-cabinet-2.png","source":"Face & Side Lit Channel Letters/Backboard Cabinet (2_)/Face & Side Lit with aluminum cabinet 2 inch.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/face-side-lit/backer-acm-4.png","source":"Face & Side Lit Channel Letters/Flat ACM Backer (4mm)/Face & Side Lit with flat acm backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/face-side-lit/backer-acrylic-8.png","source":"Face & Side Lit Channel Letters/Flat Acrylic Backer (8mm)/Face & Side Lit with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/face-side-lit/backer-aluminum-25.png","source":"Face & Side Lit Channel Letters/Flat Aluminum Backer 2.5mm/Face & Side Lit with flat aluminum backer.png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/face-side-lit/flush.png","source":"Face & Side Lit Channel Letters/Flush Mount/Face & Side Lit flush mount.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/face-side-lit/raceway-2.png","source":"Face & Side Lit Channel Letters/Raceway Mount (2_)/Face & Side Lit with raceway.png"}]},
 {"id":"fabricated-nonlit","title":"Fabricated channel letters (non-illuminated)","build":"channel-letter","parts":"fabricated-nonlit","source":"Fabricated Channel Letters","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/fabricated-nonlit/backboard-cabinet-2.png","source":"Fabricated Channel Letters/Backboard Cabinet (2_)/metal fabricated with aluminum cabinet 2 inch.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/fabricated-nonlit/backer-acm-4.png","source":"Fabricated Channel Letters/Flat ACM Backer (4mm)/metal fabricated with flat acm backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/fabricated-nonlit/backer-acrylic-8.png","source":"Fabricated Channel Letters/Flat Acrylic Backer (8mm)/metal fabricated with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/fabricated-nonlit/backer-aluminum-25.png","source":"Fabricated Channel Letters/Flat Aluminum Backer 2.5mm/metal fabricated with flat aluminum backer.png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/fabricated-nonlit/flush.png","source":"Fabricated Channel Letters/Flush Mount/metal fabricated flush mount.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/fabricated-nonlit/raceway-2.png","source":"Fabricated Channel Letters/Raceway Mount (2_)/metal fabricated with raceway.png"}]},
 {"id":"marquee","title":"Marquee channel letters","build":"channel-letter","parts":"marquee","source":"Marquee Channel Letters","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/marquee/backboard-cabinet-2.png","source":"Marquee Channel Letters/Backboard Cabinet (2_)/marquee letters with aluminum cabinet 2 inch.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/marquee/backer-acm-4.png","source":"Marquee Channel Letters/Flat ACM Backer (4mm)/marquee letters with flat ACM backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/marquee/backer-acrylic-8.png","source":"Marquee Channel Letters/Flat Acrylic Backer (8mm)/marquee letters with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/marquee/backer-aluminum-25.png","source":"Marquee Channel Letters/Flat Aluminum Backer 2.5mm/marquee letters with flat aluminum backer.png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/marquee/flush.png","source":"Marquee Channel Letters/Flush Mount/marquee letters flush mount.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/marquee/raceway-2.png","source":"Marquee Channel Letters/Raceway Mount (2_)/marquee letters with raceway.png"}]},
 {"id":"open-face-neon","title":"Open-face faux neon channel letters","build":"channel-letter","source":"OPEN FACE FAUX NEON CHANNEL LETTER","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/open-face-neon/backboard-cabinet-2.png","source":"OPEN FACE FAUX NEON CHANNEL LETTER/Backboard Cabinet (2_)/open face neon with aluminum cabinet 2 inch.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/open-face-neon/backer-acm-4.png","source":"OPEN FACE FAUX NEON CHANNEL LETTER/Flat ACM Backer (4mm)/open face neon with flat acm backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/open-face-neon/backer-acrylic-8.png","source":"OPEN FACE FAUX NEON CHANNEL LETTER/Flat Acrylic Backer (8mm)/open face neon with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/open-face-neon/backer-aluminum-25.png","source":"OPEN FACE FAUX NEON CHANNEL LETTER/Flat Aluminum Backer 2.5mm/open face neon with flat aluminum backer.png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/open-face-neon/flush.png","source":"OPEN FACE FAUX NEON CHANNEL LETTER/Flush Mount/open face neon flush mount.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/open-face-neon/raceway-2.png","source":"OPEN FACE FAUX NEON CHANNEL LETTER/Raceway Mount (2_)/open face neon with raceway.png"}]},
 {"id":"vacuum-formed","title":"Vacuum-formed channel letters","build":"channel-letter","source":"Vacuum Formed Channel Letters","drawings":[
  {"mounting":"backboard-cabinet-2","thickness":null,"label":null,"file":"channel-letter/vacuum-formed/backboard-cabinet-2.png","source":"Vacuum Formed Channel Letters/Backboard Cabinet (2_)/Vacuum Formed with aluminum cabinet 2 inch.png"},
  {"mounting":"backer-acm-4","thickness":null,"label":null,"file":"channel-letter/vacuum-formed/backer-acm-4.png","source":"Vacuum Formed Channel Letters/Flat ACM Backer (4mm)/Vacuum Formed with flat acm backer.png"},
  {"mounting":"backer-acrylic-8","thickness":null,"label":null,"file":"channel-letter/vacuum-formed/backer-acrylic-8.png","source":"Vacuum Formed Channel Letters/Flat Acrylic Backer (8mm)/Vacuum Formed with flat acrylic backer.png"},
  {"mounting":"backer-aluminum-25","thickness":null,"label":null,"file":"channel-letter/vacuum-formed/backer-aluminum-25.png","source":"Vacuum Formed Channel Letters/Flat Aluminum Backer 2.5mm/Vacuum Formed with flat aluminum backer.png"},
  {"mounting":"flush","thickness":null,"label":null,"file":"channel-letter/vacuum-formed/flush.png","source":"Vacuum Formed Channel Letters/Flush Mount/Vacuum Formed flush mount.png"},
  {"mounting":"raceway-2","thickness":null,"label":null,"file":"channel-letter/vacuum-formed/raceway-2.png","source":"Vacuum Formed Channel Letters/Raceway Mount (2_)/Vacuum Formed with raceway.png"}]},
 {"id":"flat-cut-acrylic","title":"Flat-cut acrylic letters","build":"flat","parts":"flat-cut-acrylic","source":"Flat Cut Acrylic Letters","drawings":[
  {"mounting":"flush","thickness":"1/2″","label":null,"file":"flat/flat-cut-acrylic/1-2in-flush.png","source":"Flat Cut Acrylic Letters/1-2_ thick/Flush Mount/flatcut acrylic 0.5 inch flush.png"},
  {"mounting":"stud","thickness":"1/2″","label":null,"file":"flat/flat-cut-acrylic/1-2in-stud.png","source":"Flat Cut Acrylic Letters/1-2_ thick/Stud Mount/flatcut acrylic 0.5 inch stud.png"},
  {"mounting":"vhb","thickness":"1/2″","label":null,"file":"flat/flat-cut-acrylic/1-2in-vhb.png","source":"Flat Cut Acrylic Letters/1-2_ thick/VHB/flatcut acrylic 0.5 inch VHB.png"},
  {"mounting":"flush","thickness":"1/4″","label":null,"file":"flat/flat-cut-acrylic/1-4in-flush.png","source":"Flat Cut Acrylic Letters/1-4_ thick/Flush Mount/0.25 flat cut acrylic flush mount.png"},
  {"mounting":"stud","thickness":"1/4″","label":null,"file":"flat/flat-cut-acrylic/1-4in-stud.png","source":"Flat Cut Acrylic Letters/1-4_ thick/Stud Mount/0.25 flat cut acrylic studmount.png"},
  {"mounting":"vhb","thickness":"1/4″","label":null,"file":"flat/flat-cut-acrylic/1-4in-vhb.png","source":"Flat Cut Acrylic Letters/1-4_ thick/VHB/0.25 flat cut acrylic vhb.png"},
  {"mounting":"flush","thickness":"1″","label":null,"file":"flat/flat-cut-acrylic/1in-flush.png","source":"Flat Cut Acrylic Letters/1_ thick/flush mount/1 inch acrylic flush mount.png"},
  {"mounting":"stud","thickness":"1″","label":null,"file":"flat/flat-cut-acrylic/1in-stud.png","source":"Flat Cut Acrylic Letters/1_ thick/stud mount/1 inch acrylic stud mount.png"},
  {"mounting":"vhb","thickness":"1″","label":null,"file":"flat/flat-cut-acrylic/1in-vhb.png","source":"Flat Cut Acrylic Letters/1_ thick/vhb/1 inch acrylic vhb mount.png"},
  {"mounting":"flush","thickness":"3/4″","label":null,"file":"flat/flat-cut-acrylic/3-4in-flush.png","source":"Flat Cut Acrylic Letters/3-4_ thick/Flush Mount/0.75 inch acrylic flush moumt.png"},
  {"mounting":"stud","thickness":"3/4″","label":null,"file":"flat/flat-cut-acrylic/3-4in-stud.png","source":"Flat Cut Acrylic Letters/3-4_ thick/Stud Mount/0.75 inch acrylic stud moumt.png"},
  {"mounting":"vhb","thickness":"3/4″","label":null,"file":"flat/flat-cut-acrylic/3-4in-vhb.png","source":"Flat Cut Acrylic Letters/3-4_ thick/VHB/0.75 inch thick acrylic vhb.png"}]},
 {"id":"flat-cut-aluminum","title":"Flat-cut aluminum letters","build":"flat","parts":"flat-cut-aluminum","source":"Flat Cut Aluminum Letters","drawings":[
  {"mounting":"flush","thickness":"1/2″","label":null,"file":"flat/flat-cut-aluminum/1-2in-flush.png","source":"Flat Cut Aluminum Letters/1-2_ thick/Flush Mount/flatcut aluminum 0.5 inch flush.png"},
  {"mounting":"stud","thickness":"1/2″","label":null,"file":"flat/flat-cut-aluminum/1-2in-stud.png","source":"Flat Cut Aluminum Letters/1-2_ thick/Stud Mount/flatcut aluminum 0.5 inch stud.png"},
  {"mounting":"vhb","thickness":"1/2″","label":null,"file":"flat/flat-cut-aluminum/1-2in-vhb.png","source":"Flat Cut Aluminum Letters/1-2_ thick/VHB/flatcut aluminum 0.5 inch VHB.png"},
  {"mounting":"flush","thickness":"1/4″","label":null,"file":"flat/flat-cut-aluminum/1-4in-flush.png","source":"Flat Cut Aluminum Letters/1-4_ thick/Flush Mount/0.25 flat cut aluminum flush mount.png"},
  {"mounting":"stud","thickness":"1/4″","label":null,"file":"flat/flat-cut-aluminum/1-4in-stud.png","source":"Flat Cut Aluminum Letters/1-4_ thick/Stud Mount/0.25 flat cut aluminum studmount.png"},
  {"mounting":"vhb","thickness":"1/4″","label":null,"file":"flat/flat-cut-aluminum/1-4in-vhb.png","source":"Flat Cut Aluminum Letters/1-4_ thick/VHB/0.25 flat cut aluminum vhb.png"},
  {"mounting":"flush","thickness":"1/8″","label":null,"file":"flat/flat-cut-aluminum/1-8in-flush.png","source":"Flat Cut Aluminum Letters/1-8_ thick/Flush Mount/flatcut aluminum 0.125 inch flush.png"},
  {"mounting":"stud","thickness":"1/8″","label":null,"file":"flat/flat-cut-aluminum/1-8in-stud.png","source":"Flat Cut Aluminum Letters/1-8_ thick/Stud Mount/flatcut aluminum 0.125 inch stud.png"},
  {"mounting":"vhb","thickness":"1/8″","label":null,"file":"flat/flat-cut-aluminum/1-8in-vhb.png","source":"Flat Cut Aluminum Letters/1-8_ thick/VHB/flatcut aluminum 0.125 inch VHB.png"},
  {"mounting":"flush","thickness":"3/8″","label":null,"file":"flat/flat-cut-aluminum/3-8in-flush.png","source":"Flat Cut Aluminum Letters/3-8_ thick/Flush Mount/flatcut aluminum 0.375 inch flush.png"},
  {"mounting":"stud","thickness":"3/8″","label":null,"file":"flat/flat-cut-aluminum/3-8in-stud.png","source":"Flat Cut Aluminum Letters/3-8_ thick/Stud Mount/flatcut aluminum 0.375 inch stud.png"},
  {"mounting":"vhb","thickness":"3/8″","label":null,"file":"flat/flat-cut-aluminum/3-8in-vhb.png","source":"Flat Cut Aluminum Letters/3-8_ thick/VHB/flatcut aluminum 0.375 inch VHB.png"}]},
 {"id":"flat-metal-5mm","title":"5mm metal flat-cut letters","build":"flat","ink":"white","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections","drawings":[
  {"mounting":"flush","thickness":null,"label":null,"file":"flat/flat-metal-5mm/flush.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections /5mm Metal Flush Mount  - White.png"}]},
 {"id":"cabinet-face-lit","title":"Single-sided face-lit cabinet","build":"cabinet","parts":"cabinet-face-lit","source":"ILLUMINATED CABINETS/Single Sided Face Lit Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/cabinet-face-lit/section.png","source":"ILLUMINATED CABINETS/Single Sided Face Lit Cabinet /single sided lightbox.png"}]},
 {"id":"cabinet-double-lit","title":"Double-sided illuminated cabinet","build":"cabinet","source":"ILLUMINATED CABINETS/Double Sided Illuminated Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/cabinet-double-lit/section.png","source":"ILLUMINATED CABINETS/Double Sided Illuminated Cabinet/Fabricated Blade Sign - Illuminated Double Sided.png"}]},
 {"id":"cabinet-face-halo","title":"Single-sided face & halo-lit cabinet","build":"cabinet","source":"ILLUMINATED CABINETS/Single Sided Face & Halo Lit Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/cabinet-face-halo/section.png","source":"ILLUMINATED CABINETS/Single Sided Face & Halo Lit Cabinet/face and halo lit cabinet.png"}]},
 {"id":"push-thru","title":"Single-sided push-through cabinet","build":"cabinet","source":"ILLUMINATED CABINETS/Single Sided Push Thru Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/push-thru/section.png","source":"ILLUMINATED CABINETS/Single Sided Push Thru Cabinet/single sided push thru cabinet.png"}]},
 {"id":"push-thru-face-halo","title":"Single-sided face & halo-lit push-through cabinet","build":"cabinet","source":"ILLUMINATED CABINETS/Single Sided Face & Halo lit Push Thru Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/push-thru-face-halo/section.png","source":"ILLUMINATED CABINETS/Single Sided Face & Halo lit Push Thru Cabinet/single sided [pushj thur and halo lit.png"}]},
 {"id":"push-thru-double","title":"Double-sided push-through cabinet","build":"cabinet","source":"ILLUMINATED CABINETS/Double Sided Push Thru Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/push-thru-double/section.png","source":"ILLUMINATED CABINETS/Double Sided Push Thru Cabinet/DOUBLE SIDED PUSH THRU.png"}]},
 {"id":"routed-backed-acrylic","title":"Single-sided routed & backed-up acrylic cabinet","build":"cabinet","source":"ILLUMINATED CABINETS/Single Sided Routed & Backed up Acrylic Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/routed-backed-acrylic/section.png","source":"ILLUMINATED CABINETS/Single Sided Routed & Backed up Acrylic Cabinet/single sided routed and backed up acrylic.png"}]},
 {"id":"routed-backed-acrylic-double","title":"Double-sided routed & backed-up acrylic cabinet","build":"cabinet","source":"ILLUMINATED CABINETS/Double Sided Routed & Backed up Acrylic Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/routed-backed-acrylic-double/section.png","source":"ILLUMINATED CABINETS/Double Sided Routed & Backed up Acrylic Cabinet/double sided backed up acrylic.png"}]},
 {"id":"cabinet-nonlit","title":"Single-sided non-illuminated cabinet","build":"cabinet","source":"NON ILLUMINATED CABINETS/Single Sided Non Illuminated Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/cabinet-nonlit/section.png","source":"NON ILLUMINATED CABINETS/Single Sided Non Illuminated Cabinet /single sided cabinet  non illuminated.png"}]},
 {"id":"cabinet-nonlit-double","title":"Double-sided non-illuminated cabinet","build":"cabinet","source":"NON ILLUMINATED CABINETS/Double Sided Non Illuminated Cabinet","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/cabinet-nonlit-double/section.png","source":"NON ILLUMINATED CABINETS/Double Sided Non Illuminated Cabinet /double sided cabinet  non illuminated.png"}]},
 {"id":"blade-flat","title":"Flat blade sign","build":"cabinet","source":"BLADE SIGNS/Flat Blade Sign","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/blade-flat/section.png","source":"BLADE SIGNS/Flat Blade Sign/Flat Blade Sign.png"}]},
 {"id":"blade-nonlit","title":"Fabricated non-illuminated blade sign","build":"cabinet","source":"BLADE SIGNS/Fabricated Non Illuminated Blade Sign","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/blade-nonlit/section.png","source":"BLADE SIGNS/Fabricated Non Illuminated Blade Sign/fabricated non illuminated blade sign.png"}]},
 {"id":"blade-lit","title":"Fabricated illuminated blade sign (double-sided)","build":"cabinet","source":"BLADE SIGNS/Fabricated Illumimated Blade Sign","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/blade-lit/section.png","source":"BLADE SIGNS/Fabricated Illumimated Blade Sign/Fabricated Blade Sign - Illuminated Double Sided.png"}]},
 {"id":"blade-2d","title":"2D blade sign","build":"cabinet","ink":"white","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/blade-2d/section.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections /2D Blade sign - White.png"}]},
 {"id":"blade-3d-double","title":"3D blade sign, double-sided","build":"cabinet","ink":"white","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections","drawings":[
  {"mounting":null,"thickness":null,"label":null,"file":"cabinet/blade-3d-double/section.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections /3D Blade Sign Double Sided - White.png"}]},
 {"id":"neon-faux","title":"Faux LED neon sign","build":"tube","source":"ILLUMINATED CABINETS/LED Neon Signs/Faux LED Neon Sign","drawings":[
  {"mounting":"ceiling","thickness":null,"label":null,"file":"tube/neon-faux/ceiling.png","source":"ILLUMINATED CABINETS/LED Neon Signs/Faux LED Neon Sign/ceiling mount/neon sign ceiling mount.png"},
  {"mounting":"wall","thickness":null,"label":null,"file":"tube/neon-faux/wall.png","source":"ILLUMINATED CABINETS/LED Neon Signs/Faux LED Neon Sign/wall mount/faux neon wall mount.png"}]},
 {"id":"neon-acrylic","title":"Acrylic neon sign","build":"tube","source":"ILLUMINATED CABINETS/LED Neon Signs/Acrylic Neon Sign","drawings":[
  {"mounting":"ceiling","thickness":null,"label":null,"file":"tube/neon-acrylic/ceiling.png","source":"ILLUMINATED CABINETS/LED Neon Signs/Acrylic Neon Sign/ceiling mouny/acrylic neon sign ceiling mount.png"},
  {"mounting":"wall","thickness":null,"label":null,"file":"tube/neon-acrylic/wall.png","source":"ILLUMINATED CABINETS/LED Neon Signs/Acrylic Neon Sign/wall mount/acrylic neon sign wall mouny.png"}]},
 {"id":"neon-white","title":"LED neon sign","build":"tube","ink":"white","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections","drawings":[
  {"mounting":"wall","thickness":null,"label":null,"file":"tube/neon-white/wall.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections /Neon Sign - White.png"}]},
 {"id":"neon-acrylic-white","title":"Acrylic neon sign (white-line set)","build":"tube","ink":"white","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections","drawings":[
  {"mounting":"wall","thickness":null,"label":null,"file":"tube/neon-acrylic-white/wall.png","source":"Face Lit Channel Letters/WITH TRIM/Flat ACM Backer (4mm)/add -replace cross sections /Neon Acrylic Sign - White.png"}]},
];
