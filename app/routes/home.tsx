import type { MetaFunction } from "react-router";
import { ChapterSection } from "../components/ChapterSection";
import { MediaSlot } from "../components/MediaSlot";
import { VideoFigure } from "../components/VideoFigure";
import { chapters } from "../content/chapters";

const TITLE = "HyparHuts — temporary structures that set up in five minutes";
const DESCRIPTION =
  "A set of techniques for durable, fast-deploying panel shelters: fabric hinges, reinforced edges, house wrap, an accordion fold, and a twisted hypar roof.";

export const meta: MetaFunction = () => [
  { title: TITLE },
  { name: "description", content: DESCRIPTION },
  { property: "og:type", content: "website" },
  { property: "og:title", content: TITLE },
  { property: "og:description", content: DESCRIPTION },
  { property: "og:url", content: "https://hyparhuts.org/" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: TITLE },
  { name: "twitter:description", content: DESCRIPTION },
];

const MATERIALS = [
  ["4'×8'×1.5\" rigid foam board", "10 sheets"],
  ["Contact cement", "4–5 gal"],
  ["House wrap (Tyvek or generic)", "~75 ft"],
  ["Wood trim", "1 sheet plywood, ripped"],
  ["Ground frame", "lumber + stakes"],
  ["Roof tarp", "1"],
];

const VERSIONS = [
  ["V1", "Shown at Maker Faire. Four years running on the playa."],
  ["V2", "The zig-zag fold. Design files are lost."],
  ["V3", "Current. Taller, and thinner when folded."],
];

export default function Home() {
  return (
    <>
      <header className="hero" data-fb="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">Temporary structures</p>
          <h1>HyparHuts</h1>
          <p className="hero-sub">
            Panel shelters that go up in under five minutes, fold flat, and
            survive being moved. Descended from the hexayurt — with the tape
            taken out.
          </p>
          <a className="hero-scroll" href="#premise">
            How it works
          </a>
        </div>
      </header>

      <main>
        <section className="premise" id="premise" data-fb="premise">
          <div className="premise-inner">
            <p className="lede">
              HyparHuts start from the same rigid insulation foam as most
              hexayurts. The difference is that there is no tape anywhere in the
              structure.
            </p>
            <p>
              The hexayurt community worked out that cheap foam board makes a
              genuinely good shelter. What it did not solve is what happens on
              the second deployment, and the third — seams cut apart and
              re-taped every time, edges crumbling in transit, hours of setup
              that all have to happen before the weather turns.
            </p>
            <p>
              What follows is seven ideas that fix those problems. They were
              designed to work together, and together they get you a structure
              that stays assembled between deployments. But none of them depend
              on the others, so any one is worth taking on its own.
            </p>
          </div>
        </section>

        <section className="watch" id="watch" data-fb="watch">
          <div className="watch-inner">
            <h2>Watch one get built</h2>
            <p>
              Three days in the shop, September 2014 — bare floor to walls
              standing. Foam arrives, gets cut and wrapped, and goes up.
            </p>
            <VideoFigure
              name="build-d09"
              caption="Day one: delivery, layout, wrapping, and the first panels standing."
              meta="0:46 · silent"
            />
          </div>
        </section>

        <nav
          className="idea-index"
          data-fb="idea-index"
          aria-label="The seven ideas"
        >
          <ol>
            {chapters.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>
                  <span className="idea-index-n">
                    {String(c.n).padStart(2, "0")}
                  </span>
                  <span className="idea-index-title">{c.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {chapters.map((chapter) => (
          <ChapterSection key={chapter.id} chapter={chapter} />
        ))}

        <section className="roof-tarp" id="tarp" data-fb="tarp">
          <div className="roof-tarp-inner">
            <h2>And a tarp over the whole thing</h2>
            <p>
              A fitted roof tarp ties the structure together. Bungees pull it
              down to the ground frame, which tensions the whole roof and stops
              it fluttering. The tarp is the main waterproofing layer, and it
              holds the walls in, which in turn holds the roof panels in place.
            </p>
            <MediaSlot
              media={{
                slot: "tarp-fitted",
                kind: "photo",
                caption: "Fitted tarp, bungeed down to the frame",
              }}
            />
          </div>
        </section>

        <section className="build" id="build" data-fb="build">
          <div className="build-inner">
            <h2>Build one</h2>
            <p>
              A rough bill of materials for a single hut. These are old numbers
              — treat the quantities as a starting point and the prices as
              historical.
            </p>
            <table className="materials">
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {MATERIALS.map(([material, quantity]) => (
                  <tr key={material}>
                    <td>{material}</td>
                    <td>{quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="build-note">
              Cut patterns and edging calculations live in the design repo as
              parameterized SolidWorks sketches, so you can change dimensions
              and see what it does to the layout.
            </p>
            <a
              className="button"
              href="https://github.com/cinderblock/HyparHut"
            >
              Design files on GitHub
            </a>
          </div>
        </section>

        <section className="versions" id="versions" data-fb="versions">
          <div className="versions-inner">
            <h2>Versions</h2>
            <dl>
              {VERSIONS.map(([name, note]) => (
                <div className="version" key={name}>
                  <dt>{name}</dt>
                  <dd>{note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="site-footer" data-fb="footer">
        <div className="site-footer-inner">
          <p>
            HyparHuts is an open project. Inspired by the hexayurt community,
            built to solve the problems that showed up after the first
            deployment.
          </p>
          <ul className="footer-links">
            <li>
              <a href="https://github.com/cinderblock/HyparHut">Design files</a>
            </li>
            <li>
              <a href="https://www.facebook.com/hyparhuts/">Facebook</a>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}
