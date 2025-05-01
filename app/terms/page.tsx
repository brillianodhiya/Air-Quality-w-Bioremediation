import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose dark:prose-invert">
          <p className="mb-4">
            Welcome to our website. By accessing and using this website, you
            accept and agree to be bound by the terms and provision of this
            agreement.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">1. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily download one copy of the
            materials (information or software) on our website for personal,
            non-commercial transitory viewing only.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">2. Disclaimer</h2>
          <p className="mb-4">
            The materials on our website are provided on an &apos;as is&apos;
            basis. We make no warranties, expressed or implied, and hereby
            disclaim and negate all other warranties including, without
            limitation, implied warranties or conditions of merchantability,
            fitness for a particular purpose, or non-infringement of
            intellectual property or other violation of rights.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">3. Limitations</h2>
          <p className="mb-4">
            In no event shall we or our suppliers be liable for any damages
            (including, without limitation, damages for loss of data or profit,
            or due to business interruption) arising out of the use or inability
            to use the materials on our website.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
