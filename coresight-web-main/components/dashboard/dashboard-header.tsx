interface DashboardHeaderProps {
  heading: string;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  description,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-wide">{heading}</h1>
        {description && (
          <div className="text-muted-foreground">{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}
