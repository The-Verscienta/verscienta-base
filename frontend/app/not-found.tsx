import Link from 'next/link';

export default function NotFound() {
  const herbPuns = [
    "Looks like this page has gone to seed...",
    "This remedy wasn't in our apothecary.",
    "Even our best herbalists couldn't find this one.",
    "This page has wilted away.",
    "404: Page not cultivated.",
  ];

  // Pick a random pun (will be consistent per build due to SSR)
  const randomPun = herbPuns[Math.floor(Math.random() * herbPuns.length)];

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* Decorative herbs */}
        <div className="text-8xl mb-6 animate-bounce">
          🌿
        </div>

        {/* Error code with style */}
        <h1 className="text-9xl font-bold text-earth-200 select-none">
          404
        </h1>

        {/* Fun message */}
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-800 -mt-4 mb-4">
          {randomPun}
        </h2>

        <p className="text-lg text-gray-600 mb-8">
          The page you&apos;re looking for seems to have wandered off into the wilderness.
          Perhaps it&apos;s out foraging for rare herbs?
        </p>

        {/* Helpful suggestions */}
        <div className="bg-sage-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>🧭</span> Maybe you were looking for:
          </h3>
          <ul className="space-y-2">
            <li>
              <Link href="/herbs" className="text-sage-700 hover:text-sage-900 hover:underline flex items-center gap-2">
                <span>🌱</span> Browse our Medicinal Herbs Database
              </Link>
            </li>
            <li>
              <Link href="/formulas" className="text-sage-700 hover:text-sage-900 hover:underline flex items-center gap-2">
                <span>📜</span> Explore Traditional Formulas
              </Link>
            </li>
            <li>
              <Link href="/conditions" className="text-sage-700 hover:text-sage-900 hover:underline flex items-center gap-2">
                <span>💊</span> Find Conditions & Treatments
              </Link>
            </li>
            <li>
              <Link href="/practitioners" className="text-sage-700 hover:text-sage-900 hover:underline flex items-center gap-2">
                <span>👨‍⚕️</span> Connect with Practitioners
              </Link>
            </li>
            <li>
              <Link href="/symptom-checker" className="text-sage-700 hover:text-sage-900 hover:underline flex items-center gap-2">
                <span>🔍</span> Try our Symptom Checker
              </Link>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-earth-600 text-white rounded-lg hover:bg-earth-700 transition font-medium flex items-center justify-center gap-2"
          >
            <span>🏠</span> Return Home
          </Link>
          <Link
            href="/search"
            className="px-6 py-3 border border-sage-600 text-sage-700 rounded-lg hover:bg-sage-50 transition font-medium flex items-center justify-center gap-2"
          >
            <span>🔎</span> Search the Site
          </Link>
        </div>

        {/* Fun fact */}
        <div className="mt-12 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Did you know?</span> In Traditional Chinese Medicine,
            getting lost is sometimes called &quot;losing your way&quot; (迷路), which can be treated
            with herbs that calm the spirit and clear the mind, like Suan Zao Ren (Sour Jujube Seed).
          </p>
        </div>
      </div>
    </div>
  );
}
