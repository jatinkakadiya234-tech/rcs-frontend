import { useSelector, useDispatch } from 'react-redux';
import { updateWalletBalance } from '../redux/slices/authSlice';

export const useWallet = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const walletBalance = user?.wallet?.balance || 0;
  const currency = user?.wallet?.currency || 'INR';
  
  const updateBalance = (newBalance) => {
    dispatch(updateWalletBalance(newBalance));
  };
  
  return {
    balance: walletBalance,
    currency,
    updateBalance,
    formattedBalance: `₹${walletBalance.toLocaleString()}`
  };
};