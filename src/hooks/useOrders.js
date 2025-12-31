import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { _get, _delete } from '../helper/apiClient.jsx'
import { getRealTimeCampaignStats } from '../services/realtimeApi'
import toast from 'react-hot-toast'

// Campaign reports query using helper functions
export const useCampaignReports = (userId, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['campaignReports', userId, page, limit],
    queryFn: () => _get(`v1/campaign-reports/user/${userId}?page=${page}&limit=${limit}`, {}, {}, localStorage.getItem('token')),
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    enabled: !!userId,
  })
}

// Real-time campaign stats query
export const useRealTimeStats = (campaignId, token) => {
  return useQuery({
    queryKey: ['realTimeStats', campaignId],
    queryFn: () => getRealTimeCampaignStats(campaignId, token),
    staleTime: 10000, // 10 seconds for real-time data
    cacheTime: 60000, // 1 minute
    enabled: !!campaignId && !!token,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Delete campaign report mutation
export const useDeleteCampaignReport = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (reportId) => _delete(`v1/campaign-reports/${reportId}`, {}, {}, localStorage.getItem('token')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignReports'] })
      toast.success('Campaign report deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete campaign report')
    }
  })
}

// User stats query using helper functions
export const useUserStats = (userId) => {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => _get(`realtime/user/${userId}/stats`, {}, {}, localStorage.getItem('token')),
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    enabled: !!userId,
  })
}