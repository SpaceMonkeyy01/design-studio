// The studio's four mountings, shared by every construction. A construction draws the hardware for the mountings it
// supports (its `signs` entry lists them); the rest stay declared but unselectable until the shop sends real inches.
// Flat Backer and Backerboard Cabinet are different products: a flat panel behind the letters vs a shallow box cabinet.
export const MOUNTINGS=[
 {id:'flush',name:'Flush/Stud mounted',built:true,note:'Threaded studs into the wall (halo-lit adds spacers across its wall gap). Nothing else is drawn behind the letters.'},
 {id:'raceway',name:'Standard Raceway',built:false,note:'Slim horizontal duct holding power and wiring, shorter than the letter run; letters centred on its front face, wall visible above and below. Dimensions: ASK.'},
 {id:'flat-backer',name:'Flat Backer',built:false,note:'Flat panel behind the letters, with padding, sharp or rounded corners, metal or acrylic, optionally edge-lit. Dimensions: ASK.'},
 {id:'backerboard-cabinet',name:'Backerboard Cabinet',built:false,note:'Shallow box cabinet the letters mount onto (not a flat panel). Dimensions: ASK.'},
];
// Look up by id or studio name; null when unknown.
export const mounting=key=>MOUNTINGS.find(m=>m.id===key||m.name===key)||null;
