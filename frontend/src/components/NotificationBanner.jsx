import { useState } from 'react';

function NotificationBanner({ notifications }) {
  const [dismissed, setDismissed] = useState([]);

  const activeNotifications = notifications.filter(
    (notif) => !dismissed.includes(notif.id)
  );

  const handleDismiss = (id) => {
    setDismissed([...dismissed, id]);
  };

  if (activeNotifications.length === 0) return null;

  return (
    <div className="notification-container">
      {activeNotifications.map((notif) => (
        <div
          key={notif.id}
          className={`notification notification-${notif.type}`}
        >
          <div className="notification-icon">{notif.icon}</div>
          <div className="notification-content">
            <div className="notification-title">{notif.title}</div>
            {notif.message && (
              <div className="notification-message">{notif.message}</div>
            )}
          </div>
          <button
            className="notification-close"
            onClick={() => handleDismiss(notif.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationBanner;
