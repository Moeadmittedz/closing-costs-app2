import Head from 'next/head';
import ClosingCostsCalculator from '../components/ClosingCostsCalculator';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Exilex Legal Professional Corporation — Closing Costs Estimator</title>
        <meta name="description" content="Estimate your real estate closing costs quickly and easily." />
      </Head>

      <header className="bg-gray-900/95 border-b border-gray-800">
        <div className="max-w-6xl mx-auto py-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo-white.svg" alt="Exilex logo" className="h-10 w-10" />
            <div>
              <div className="text-lg font-semibold">Exilex Legal Professional Corporation</div>
              <div className="text-sm text-gray-400">Fast. Clear. Trusted.</div>
            </div>
          </div>
          <nav className="text-sm text-gray-400">
            <a href="#calculator" className="mr-6 hover:underline">Calculator</a>
            <a href="mailto:info@exilex.com" className="hover:underline">Contact</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <section className="lg:col-span-1">
            <h1 className="text-4xl font-extrabold mb-3">Estimate closing costs in seconds</h1>
            <p className="text-gray-400 mb-4">Transparent, easy-to-understand estimates for buyers, sellers and refinancers — tailored for Ontario.</p>

            <ul className="text-sm text-gray-400 space-y-2">
              <li>Quick estimate — no account required</li>
              <li>Privacy-first: no tracking</li>
              <li>PDF summary sent to you and Exilex</li>
            </ul>
          </section>

          <section id="calculator" className="lg:col-span-2">
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
              <ClosingCostsCalculator />
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-black mt-12 py-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Exilex Legal Professional Corporation — All rights reserved.
        </div>
      </footer>
    </div>
  );
}