import React, { useState } from "react";

const NotificationButton = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleClick = () => {
    if (!isSubscribed) {
      alert("✅ Successfully registered for alerts!");
    } else {
      alert("❌ Unregistered from alerts!");
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <button
      className={`notification-btn ${isSubscribed ? "subscribed" : ""}`}
      onClick={handleClick}
    >
      {isSubscribed ? "✔️ Registered for Alerts" : "🔔 Register for Alerts"}
    </button>
  );
};

export default NotificationButton;
