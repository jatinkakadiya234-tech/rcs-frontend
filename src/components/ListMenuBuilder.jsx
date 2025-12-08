import React from 'react'

export default function ListMenuBuilder({ 
  listMenuItems, 
  setListMenuItems,
  menuTitle,
  setMenuTitle,
  buttonText,
  setButtonText
}) {
  const addListMenuItem = () => {
    setListMenuItems([...listMenuItems, {
      id: Date.now(),
      title: '',
      description: ''
    }])
  }

  const updateListMenuItem = (id, field, value) => {
    setListMenuItems(listMenuItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeListMenuItem = (id) => {
    setListMenuItems(listMenuItems.filter(item => item.id !== id))
  }

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <span className="text-2xl">📋</span>
          List Menu Configuration
        </h3>
        
        {/* Menu Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Menu Title</label>
            <input
              type="text"
              value={menuTitle}
              onChange={(e) => setMenuTitle(e.target.value)}
              placeholder="e.g., Our Services"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="e.g., View Menu"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-700">Menu Items</h4>
          <button
            onClick={addListMenuItem}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all shadow-md flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Item
          </button>
        </div>
        
        <div className="space-y-3">
          {listMenuItems.map((item, index) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateListMenuItem(item.id, 'title', e.target.value)}
                    placeholder="Item Title"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateListMenuItem(item.id, 'description', e.target.value)}
                    placeholder="Item Description (Optional)"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={() => removeListMenuItem(item.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          
          {listMenuItems.length === 0 && (
            <div 
              onClick={addListMenuItem}
              className="bg-white rounded-lg border-2 border-dashed border-green-300 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <span className="text-6xl mb-2">+</span>
              <p className="text-gray-600 font-medium">Add Your First Menu Item</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
