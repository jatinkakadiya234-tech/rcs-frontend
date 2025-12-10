// Disable localStorage completely
const disableLocalStorage = () => {
  if (typeof Storage !== "undefined") {
    // Override localStorage methods
    Storage.prototype.setItem = function() {
      console.warn('localStorage is disabled. Use cookies instead.')
    }
    
    Storage.prototype.getItem = function() {
      console.warn('localStorage is disabled. Use cookies instead.')
      return null
    }
    
    Storage.prototype.removeItem = function() {
      console.warn('localStorage is disabled. Use cookies instead.')
    }
    
    Storage.prototype.clear = function() {
      console.warn('localStorage is disabled. Use cookies instead.')
    }
  }
}

export default disableLocalStorage