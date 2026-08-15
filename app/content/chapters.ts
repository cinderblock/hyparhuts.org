/**
 * The seven ideas.
 *
 * Order follows Cameron's list. Each chapter carries a `standalone` note
 * because the whole pitch is that these combine into one solution but any of
 * them can be lifted on its own by someone already building hexayurts.
 *
 * `media.slot` names the asset we want in that position. Nothing is wired to
 * real files yet — the placeholder renders the slot name so it's obvious
 * what's still missing.
 */

export type Media = {
  slot: string;
  kind: "photo" | "clip" | "diagram";
  caption: string;
  /**
   * The real asset, once one exists — expects `<name>.webp` with a `<name>.png`
   * fallback under `/media`. Absent means the slot renders as a labelled
   * placeholder, so what is missing stays visible.
   *
   * Intrinsic dimensions are required, not optional. Without them the `<img>`
   * collapses to a line box, which both causes a large layout shift on load
   * and stops `loading="lazy"` from ever firing — there is no box for the
   * intersection observer to hit.
   */
  asset?: { name: string; width: number; height: number };
};

export type Chapter = {
  id: string;
  n: number;
  title: string;
  hook: string;
  body: string[];
  standalone: string;
  media: Media;
};

export const chapters: Chapter[] = [
  {
    id: "hinges",
    n: 1,
    title: "Hinges that can't peel",
    hook: "Crossed fabric strapping, woven like a Jacob's ladder, so every load lands as shear on the glue.",
    body: [
      "Tape hinges fail because tape gets peeled. Wind lifts a corner, someone leans on a wall, and the glue line is loaded in exactly the direction it is weakest. Once a peel starts it keeps going.",
      "Strapping crossed over the joint — the same weave as the Jacob's ladder toy — routes every load into the plane of the glue instead. Nothing pulls perpendicular to the bond, ever. Glue joints held purely in shear last effectively forever.",
      "The strips wrap tightly around the panel edges and cross at the joint, which also means the hinge has a defined axis. It folds where you want it to fold, not wherever the material happens to give.",
    ],
    standalone:
      "Works on any tape-hinged panel structure. If you already have a hexayurt, this is the single highest-value change you can make to it.",
    media: {
      slot: "hinge-assembly",
      kind: "clip",
      caption:
        "Weaving the strapping across a joint — from the iOS live-photo sequence",
    },
  },
  {
    id: "edges",
    n: 2,
    title: "Reinforced edges",
    hook: "Wood trim around every panel, hidden under the wrap.",
    body: [
      "Rigid foam board is strong in the middle and hopeless at the edges. Edges are also exactly what takes the abuse in transit — every corner clipped on a doorway, every panel dragged across a warehouse floor.",
      "Trim around each panel's perimeter gives the foam an impact-resistant border and gives the hinges a rigid thing to pull against, which takes the slop out of the joint. The bottom edge gets thicker stock, because that is where the worst impacts land.",
      "With real wood on the bottom edge, rubber feet are just a couple of screws. Panels then slide instead of crumble, and the feet later become the thing that locates the hut on its frame.",
    ],
    standalone:
      "A durability retrofit on its own. Even without hinges or wrap, trimmed edges roughly decide whether panels survive their second deployment.",
    media: {
      slot: "edge-trim",
      kind: "photo",
      caption: "Trim run around a panel perimeter, before wrapping",
    },
  },
  {
    id: "wrap",
    n: 3,
    title: "House wrap over everything",
    hook: "Tyvek — or any generic house wrap — contact-cemented tight to every panel.",
    body: [
      "Each panel gets wrapped before anything is assembled. The wrap is the substrate the hinges bond to, so it has to be tight and it has to be bonded across the whole face, not just at the edges.",
      "One material solves an unreasonable number of problems at once: it is a liquid barrier, a puncture-resistant layer, a container for any foam debris that does break loose, and an opaque skin that hides every blemish and every thing you deliberately buried under it.",
      "It also sets a constraint on panel shape. Panels have to be convex near the hinges, or the wrap bridges the corner instead of following it and the bond fails where it matters most.",
    ],
    standalone:
      "Wrapping alone turns bare foam board into something you can handle without gloves and store without shedding.",
    media: {
      slot: "wrap-panel",
      kind: "photo",
      caption: "Contact cement and a wrapped panel face",
    },
  },
  {
    id: "folding",
    n: 4,
    title: "It folds like an accordion",
    hook: "Hinge it once, then never take a seam apart again.",
    body: [
      "The reason setup normally takes hours is that a taped structure is genuinely disassembled between deployments — every seam gets cut and re-taped, every time. The accordion fold means the structure stays hinged together permanently and simply collapses flat.",
      "The fold line on the side walls is not the obvious midpoint. It sits slightly off center, so that when the stack is folded flat all the edges actually meet instead of fighting each other for the same space.",
      "A zig-zag variant is possible too, reversing alternate hinges so the walls unwrap rather than concertina. Setup takes a little longer, but it packs differently, which sometimes matters more.",
    ],
    standalone:
      "The folding pattern is geometry, not hardware. It is worth stealing even if you hinge your panels some other way.",
    media: {
      slot: "fold-sequence",
      kind: "clip",
      caption: "Folding flat — full structure to stack",
    },
  },
  {
    id: "hypar",
    n: 5,
    title: "The twisted roof",
    hook: "A hyperbolic paraboloid. This is the part we named the thing after.",
    body: [
      "It is not obvious from a photo, but the roof is deliberately twisted. The surface approximates a hyperbolic paraboloid — a hypar — rather than sitting as a set of flat planes.",
      "A flat panel in wind is a drum head. It oscillates, it flutters, and everything attached to it works itself loose over a few days. A doubly-curved surface is under tension in two directions at once and simply does not have that mode available to it.",
      "The practical effect is a structure that stays quiet and stays rigid in wind, which is most of what you actually want from a temporary shelter at three in the morning.",
    ],
    standalone:
      "The twist is applicable to any panel roof. It costs nothing but a change in how the roof edges are cut.",
    media: {
      slot: "hypar-roof",
      kind: "diagram",
      caption:
        "The V3 geometry. The blue curves are the roof surface — straight edges, doubly-curved middle.",
      asset: { name: "hypar-geometry", width: 1200, height: 866 },
    },
  },
  {
    id: "frame",
    n: 6,
    title: "Anchor the ground first",
    hook: "A staked frame goes down before the hut does. No guy wires anywhere.",
    body: [
      "Staking and roping is usually the last job, done badly, in the dark, by people who want to be finished. Doing it first inverts the whole problem: you stake a bare wooden frame, which you can hit as hard as you like with a large hammer without worrying about damaging delicate foam.",
      "The frame gives you a level base regardless of what the ground is doing, and it can carry a ground cover and a puddle barrier at the same time. It is notched to match the rubber feet on the panel bottoms, so the hut drops in with positive lateral engagement rather than just sitting there.",
      "Because the frame carries the anchoring, there are no guy wires. Nothing to trip over in the dark, nothing to re-tension, nothing radiating out into space you wanted to use.",
    ],
    standalone:
      "A staked ground frame is useful under almost any temporary structure, hexayurt or otherwise.",
    media: {
      slot: "ground-frame",
      kind: "photo",
      caption: "Frame staked down, notches waiting for the panel feet",
    },
  },
  {
    id: "power",
    n: 7,
    title: "Power and light, built in",
    hook: "LED strips under the wrap, battery in the foam, solar on the outside.",
    body: [
      "LED strip is thin enough to go on the foam before wrapping, and white house wrap diffuses it beautifully — the wall itself becomes the light fixture, with nothing to hang and nothing to knock down.",
      "The foam board is thick enough to pocket a rechargeable battery, and a panel on the outer face can charge it. Setting up the hut then sets up the power system, with interior and exterior lights, switches, and accessories already wired and already aimed.",
      "The same trick hides structural reinforcement wherever you want to hang something real later: an AC unit, a swamp cooler, or just a clothing rod that will hold.",
    ],
    standalone:
      "Anything you can fit under the wrap comes along for free. This is less a technique than a consequence of having a wrap step at all.",
    media: {
      slot: "lit-interior",
      kind: "photo",
      caption: "Interior at night, lit through the wrap",
    },
  },
];
