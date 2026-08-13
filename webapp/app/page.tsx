import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <p className="home__kicker">NRF XR Concert 2027</p>
      <h1>One room, played from many hands.</h1>
      <nav aria-label="Device routes" className="home__routes">
        <Link href="/mobile">Audience mobile</Link>
        <Link href="/screen">Projection screen</Link>
        <Link href="/admin">Concert control</Link>
      </nav>
    </main>
  );
}
