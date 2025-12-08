export function applyInitialTheme() {
  try {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = saved === 'light' || saved === 'dark' ? saved : (prefersDark ? 'dark' : 'light')
    setHtmlClass(theme)
  } catch {}
}

export function setThemePreference(theme) {
  try {
    if (theme === 'light' || theme === 'dark') {
      localStorage.setItem('theme', theme)
      setHtmlClass(theme)
    } else {
      localStorage.removeItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setHtmlClass(prefersDark ? 'dark' : 'light')
    }
  } catch {}
}

function setHtmlClass(theme) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}


