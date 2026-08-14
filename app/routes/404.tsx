import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Not found — HyparHuts" },
  { name: "description", content: "That page doesn't exist." },
  { name: "robots", content: "noindex" },
];

export default function NotFound() {
  return (
    <main className="hero" data-fb="notfound">
      <div className="hero-inner">
        <p className="hero-eyebrow">404</p>
        <h1>Folded flat</h1>
        <p className="hero-sub">That page doesn't exist, or it moved.</p>
        <Link to="/" className="hero-scroll">
          Back to HyparHuts
        </Link>
      </div>
    </main>
  );
}
