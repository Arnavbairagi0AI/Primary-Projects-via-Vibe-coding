import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SystemNotification } from '../types';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query notifications for the active user, sorted client-side to avoid index requirements
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SystemNotification[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SystemNotification);
      });
      // Sort client-side by date descending
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setNotifications(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications real-time:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, {
        read: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      const promises = unreadNotifications.map((n) => 
        updateDoc(doc(db, 'notifications', n.id), {
          read: true,
          updatedAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [user, notifications]);

  const triggerNotification = useCallback(async (
    title: string, 
    message: string, 
    type: 'tender_match' | 'project_update' | 'system' | 'team',
    targetUserId?: string
  ) => {
    const targetId = targetUserId || user?.id;
    if (!targetId) return;

    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'notifications'), {
        userId: targetId,
        companyId: user?.companyId || null,
        title,
        message,
        read: false,
        type,
        createdAt: now,
        updatedAt: now,
        createdBy: user?.id || 'system',
        status: 'active'
      });
    } catch (error) {
      console.error("Error triggering notification:", error);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    triggerNotification
  };
}
