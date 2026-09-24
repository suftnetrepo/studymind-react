import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">📚</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          @studymind/react
        </h1>
        <p className="text-gray-600 mb-6">
          AI study tools for any learning platform
        </p>
        <Link
          href="/demo"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl
            font-semibold hover:bg-blue-700 transition-colors"
        >
          Open Demo →
        </Link>
      </div>
    </div>
  )
}
