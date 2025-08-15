export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
            <span className="text-white font-bold text-3xl">🏠</span>
          </div>
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl opacity-20 animate-pulse"></div>
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-200"></div>
        </div>
        <p className="text-xl font-semibold text-gray-700 mb-2">{message}</p>
        <p className="text-gray-500">Please wait a moment...</p>
      </div>
    </div>
  )
}