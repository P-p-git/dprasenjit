const DashboardCard = ({ title, value, icon, color = '#6366f1' }) => {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="dashboard-card-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
