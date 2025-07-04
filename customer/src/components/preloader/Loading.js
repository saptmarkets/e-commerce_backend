import React from "react";
import NeonSpinner from "./NeonSpinner";

const Loading = ({ loading, size = "lg" }) => {
  return (
    <div className="flex justify-center items-center py-6">
      <NeonSpinner size={size} />
    </div>
  );
};

export default Loading;
