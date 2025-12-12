import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const CustomModal = ({ show, onClose, type = 'success', title, message }) => {
  if (!show) return null;

  const icons = {
    success: <FaCheckCircle className="text-5xl text-green-500" />,
    error: <FaExclamationTriangle className="text-5xl text-red-500" />,
    warning: <FaExclamationTriangle className="text-5xl text-yellow-500" />,
    info: <FaInfoCircle className="text-5xl text-blue-500" />
  };

  const colors = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {icons[type]}
          </div>
          
          {title && <h2 className="text-xl font-bold mb-2">{title}</h2>}
          <p className="text-gray-600 mb-6">{message}</p>
          
          <button
            onClick={onClose}
            className={`w-full py-2 text-white rounded-lg transition-colors ${colors[type]}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
