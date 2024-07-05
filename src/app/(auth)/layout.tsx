import React, { type ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="place-item-center grid h-screen p-4">
      <div>{children}</div>
    </div>
  );
};

export default layout;
