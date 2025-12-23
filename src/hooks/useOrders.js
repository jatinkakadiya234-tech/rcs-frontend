import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

// Orders list query
export const useOrders = (userId, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['orders', userId, page, limit],
    queryFn: () => api.getMessageReportsall(userId, page, limit),
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    enabled: !!userId,
  })
}

// Order details query
export const useOrderDetails = (orderId, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['orderDetails', orderId, page, limit],
    queryFn: () => api.getMessageDetails(orderId, page, limit),
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    enabled: !!orderId,
  })
}

// Delete order mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (orderId) => api.deleteMessageReport(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete order')
    }
  })
}

// Message stats query
export const useMessageStats = (userId) => {
  return useQuery({
    queryKey: ['messageStats', userId],
    queryFn: () => api.getMessageStats(userId),
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    enabled: !!userId,
  })
}