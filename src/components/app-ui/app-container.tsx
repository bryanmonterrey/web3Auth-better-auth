"use client";

interface ContainerProps {
    children: React.ReactNode;
};

export const AppContainer = ({
  children,
}: ContainerProps) => {
  return (
    <div className="flex-1 hidden-scrollbar h-[calc(100vh-52px)] mt-[52px]">
      {children}
    </div>
  );
};