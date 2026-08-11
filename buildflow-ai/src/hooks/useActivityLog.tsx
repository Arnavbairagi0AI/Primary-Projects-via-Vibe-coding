import { useCallback, useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { ActivityLog } from '../types';

export function useActivityLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const logActivity = useCallback(async (action: string, details: string) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'activityLogs'), {
        companyId: user.companyId,
        userId: user.id,
        userName: user.displayName,
        role: user.role,
        action,
        details,
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        status: 'active'
      });
    } catch (error) {
      console.error("Failed to write audit activity log:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !user.companyId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch logs for the company and sort/limit client-side to avoid missing index errors
    const q = query(
      collection(db, 'activityLogs'),
      where('companyId', '==', user.companyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      // Sort descending and limit to 15 client-side
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setLogs(list.slice(0, 15));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activity logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return {
    logs,
    loading,
    logActivity
  };
}
