export const staticOrders = [
  { id: 1, campaignName: 'Summer Sale 2024', type: 'RCS', numbers: 150, status: 'Sent', date: '2024-01-15', sent: 150, failed: 0 },
  { id: 2, campaignName: 'New Product Launch', type: 'Simple', numbers: 200, status: 'Pending', date: '2024-01-16', sent: 0, failed: 0 },
  { id: 3, campaignName: 'Customer Feedback', type: 'RCS', numbers: 80, status: 'Failed', date: '2024-01-14', sent: 45, failed: 35 },
  { id: 4, campaignName: 'Holiday Greetings', type: 'Simple', numbers: 300, status: 'Sent', date: '2024-01-13', sent: 300, failed: 0 },
  { id: 5, campaignName: 'Flash Sale Alert', type: 'RCS', numbers: 120, status: 'Sent', date: '2024-01-12', sent: 118, failed: 2 }
]

export const addOrder = (orderData) => {
  staticOrders.unshift(orderData)
  return staticOrders
}
