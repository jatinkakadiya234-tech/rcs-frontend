import { useState } from 'react'
import { FaCopy, FaCheck, FaLink, FaServer, FaShieldAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'

export default function Webhook() {
  const [copied, setCopied] = useState(false)
  const webhookUrl = 'https://rcssender.com/api/jio/rcs/webhook'

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast.success('Webhook URL copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaServer className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Webhook Configuration</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your RCS webhook for message delivery updates</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaLink className="text-blue-600 text-xl mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Webhook URL</h3>
                <p className="text-sm text-gray-600">Use this URL to configure your RCS message delivery webhook</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaShieldAlt className="text-purple-600 text-xl mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Secure Connection</h3>
                <p className="text-sm text-gray-600">HTTPS encrypted for secure data transmission</p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook URL Display */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Webhook URL</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-4 flex items-center">
              <code className="text-sm text-gray-800 break-all font-mono">{webhookUrl}</code>
            </div>
            <button
              onClick={handleCopy}
              className={`px-6 py-4 rounded-lg font-medium transition-all flex items-center gap-2 ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <>
                  <FaCheck className="text-lg" />
                  Copied
                </>
              ) : (
                <>
                  <FaCopy className="text-lg" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Configure</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex-shrink-0">
                1
              </span>
              <div>
                <h4 className="font-medium text-gray-900">Copy the Webhook URL</h4>
                <p className="text-gray-600 text-sm mt-1">Click the "Copy" button above to copy the webhook URL to your clipboard</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex-shrink-0">
                2
              </span>
              <div>
                <h4 className="font-medium text-gray-900">Configure Your Service</h4>
                <p className="text-gray-600 text-sm mt-1">Paste the URL in your RCS service provider's webhook configuration settings</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex-shrink-0">
                3
              </span>
              <div>
                <h4 className="font-medium text-gray-900">Verify Connection</h4>
                <p className="text-gray-600 text-sm mt-1">Test the webhook connection to ensure delivery updates are being received</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex-shrink-0">
                4
              </span>
              <div>
                <h4 className="font-medium text-gray-900">Monitor Events</h4>
                <p className="text-gray-600 text-sm mt-1">Your webhook will now receive real-time delivery status updates</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Webhook Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Protocol</p>
              <p className="text-gray-900 font-semibold mt-1">HTTPS</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Request Method</p>
              <p className="text-gray-900 font-semibold mt-1">POST</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Content-Type</p>
              <p className="text-gray-900 font-semibold mt-1">application/json</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Response Expected</p>
              <p className="text-gray-900 font-semibold mt-1">200 OK</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">⚠️ Important:</span> Keep this webhook URL secure. Do not share it publicly. Only use this URL in your official RCS service provider settings.
          </p>
        </div>
      </div>
    </div>
  )
}
