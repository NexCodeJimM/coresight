"use client";

import React, { createContext, useContext, useState } from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).slice(2, 11);
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "flex items-start gap-2 rounded-lg p-4 text-white shadow-lg transition-all",
              notification.type === "success" && "bg-green-600",
              notification.type === "error" && "bg-red-600",
              notification.type === "warning" && "bg-yellow-600"
            )}
          >
            {notification.type === "success" && (
              <CheckCircle className="h-5 w-5" />
            )}
            {notification.type === "error" && <XCircle className="h-5 w-5" />}
            {notification.type === "warning" && (
              <AlertCircle className="h-5 w-5" />
            )}
            <div>
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-sm">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
