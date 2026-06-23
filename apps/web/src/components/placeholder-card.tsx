type PlaceholderCardProps = {
  title: string;
  description: string;
};

export function PlaceholderCard({ title, description }: PlaceholderCardProps) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title h5">{title}</h2>
        <p className="card-text text-body-secondary">{description}</p>
        <span className="badge text-bg-secondary">Coming soon</span>
      </div>
    </div>
  );
}
