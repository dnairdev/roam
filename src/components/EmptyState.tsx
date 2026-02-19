interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <span className="text-3xl mb-3">{icon}</span>}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-400 max-w-[240px]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
