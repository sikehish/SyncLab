const Loader: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin"></div>
        <div className="absolute top-2 left-2 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full animate-pulse"></div>
      </div>

    </div>
  );
};

export default Loader;