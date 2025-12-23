import React from 'react'

export default function ModernTemplatePreview({ 
  selectedTemplate, 
  message, 
  messageType, 
  templateMedia, 
  templateButtons, 
  templateFooter,
  carouselCards,
  listMenuItems 
}) {
console.log(message,"======================");
  return (
    <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">👁️</span>
          Live Preview
        </h3>
        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
          {selectedTemplate?.name || messageType || 'Preview'}
        </span>
      </div>
      
      {/* WhatsApp Style Preview Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-auto overflow-hidden">
        {/* WhatsApp Header */}
        <div className="bg-gradient-to-r from-teal-500 to-green-500 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-xl">💬</span>
          </div>
          <div>
            <p className="text-white font-semibold">Your Business</p>
            <p className="text-white text-xs opacity-90">Online</p>
          </div>
        </div>
        
        {/* Message Bubble */}
        <div className="p-4 bg-gray-50">
          <div className="bg-white rounded-lg shadow-md p-4 max-w-sm">
            {/* Message Text */}
            <p className="text-gray-800 text-sm mb-3 whitespace-pre-wrap">
              {message || 'Type your message here...'}
            </p>
            
            {/* Media Preview */}
            {templateMedia && ['RCS Rich Card', 'Carousel', 'List With Media'].includes(messageType) && (
              <div className="mb-3 rounded-lg overflow-hidden">
                {templateMedia.type === 'url' ? (
                  <img 
                    src={templateMedia.url} 
                    alt="Media" 
                    className="w-full h-48 object-cover" 
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E'
                    }} 
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl mb-2 block">🖼️</span>
                      <p className="text-sm text-gray-600">{templateMedia.name}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Carousel Cards Preview */}
            {messageType === 'Carousel' && carouselCards && carouselCards.length > 0 && (
              <div className="mb-3 overflow-x-auto flex gap-2 pb-2">
                {carouselCards.map((card, index) => (
                  <div key={index} className="min-w-[200px] border border-gray-200 rounded-lg overflow-hidden">
                    {card.image ? (
                      <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <span className="text-2xl">🖼️</span>
                      </div>
                    ) : (
                      <div className="h-32 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="font-semibold text-xs">{card.title || 'Card Title'}</p>
                      <p className="text-xs text-gray-600">{card.description || 'Description'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* List Menu Preview */}
            {messageType === 'List With Media' && listMenuItems && listMenuItems.length > 0 && (
              <div className="mb-3">
                <button className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-left flex items-center justify-between">
                  <span>📋 View Menu</span>
                  <span>›</span>
                </button>
              </div>
            )}
            
            {/* Buttons Preview */}
            {templateButtons && templateButtons.length > 0 && ['Text with Actions', 'RCS Rich Card'].includes(messageType) && (
              <div className="space-y-2 mt-3">
                {templateButtons.map((button, index) => (
                  <button
                    key={index}
                    className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {button.type === 'URL Button' && '🔗'}
                    {button.type === 'Call Button' && '📞'}
                    {button.type === 'Quick Reply Button' && '💬'}
                    {button.title || 'Button'}
                  </button>
                ))}
              </div>
            )}
            
            {/* Footer */}
            {templateFooter && ['RCS Rich Card', 'Carousel', 'List With Media'].includes(messageType) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">{templateFooter}</p>
              </div>
            )}
            
            {/* Timestamp */}
            <div className="flex justify-end mt-2">
              <span className="text-xs text-gray-400">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
