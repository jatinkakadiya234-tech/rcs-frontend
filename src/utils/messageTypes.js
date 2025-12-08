export const MESSAGE_TYPES = {
  'text': 'Text Message',
  'plain-text': 'Plain Text',
  'text-with-action': 'Text with Actions', 
  'rcs': 'RCS Rich Card',
  'carousel': 'Carousel',
 
  'location': 'Location Message',
  // 'contact': 'Contact Message',
  // 'sticker': 'Sticker Message',
  // 'button': 'Button Message',
  // 'list': 'List Message',
  // 'template': 'Template Message',
  // 'interactive': 'Interactive Message'
}

export const getMessageTypeLabel = (type) => {
  return MESSAGE_TYPES[type] || type
}