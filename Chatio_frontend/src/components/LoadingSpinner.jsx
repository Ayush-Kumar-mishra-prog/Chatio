const LoadingSpinner = ({ size = "md", inline = false }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`}
    />
  );

  if (inline) {
    return spinner;
  }

  return <div className="flex items-center justify-center p-4">{spinner}</div>;
};

export default LoadingSpinner;
