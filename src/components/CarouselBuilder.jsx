import React from 'react'

export default function CarouselBuilder({ carouselCards, setCarouselCards }) {
  const addCarouselCard = () => {
    setCarouselCards([...carouselCards, {
      id: Date.now(),
      title: '',
      description: '',
      image: null,
      buttons: []
    }])
  }

  const updateCarouselCard = (id, field, value) => {
    setCarouselCards(carouselCards.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    ))
  }

  const removeCarouselCard = (id) => {
    setCarouselCards(carouselCards.filter(card => card.id !== id))
  }

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🎠</span>
            Carousel Cards
          </h3>
          <button
            onClick={addCarouselCard}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Card
          </button>
        </div>
        
        {/* Carousel Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carouselCards.map((card, index) => (
            <div key={card.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-200 hover:border-purple-400 transition-all">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">Card {index + 1}</span>
                <button
                  onClick={() => removeCarouselCard(card.id)}
                  className="text-white hover:text-red-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => updateCarouselCard(card.id, 'title', e.target.value)}
                  placeholder="Card Title"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <textarea
                  value={card.description}
                  onChange={(e) => updateCarouselCard(card.id, 'description', e.target.value)}
                  placeholder="Card Description"
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <label className="block">
                  <span className="text-xs text-gray-600 mb-1 block">Card Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        updateCarouselCard(card.id, 'image', {
                          name: file.name,
                          file: file
                        })
                      }
                    }}
                    className="w-full text-xs"
                  />
                </label>
              </div>
            </div>
          ))}
          
          {/* Add Card Placeholder */}
          {carouselCards.length === 0 && (
            <div 
              onClick={addCarouselCard}
              className="bg-white rounded-xl border-2 border-dashed border-purple-300 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <span className="text-6xl mb-2">+</span>
              <p className="text-gray-600 font-medium">Add Your First Card</p>
              <p className="text-gray-400 text-sm">Click to create a carousel card</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
