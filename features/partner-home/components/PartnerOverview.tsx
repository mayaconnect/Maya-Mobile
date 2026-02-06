import React, { useMemo } from 'react';
import { PartnerDailyActivity } from './PartnerDailyActivity';
import { PartnerKPICards } from './PartnerKPICards';
import { PartnerQuickActions } from './PartnerQuickActions';
import { PartnerRecentScans } from './PartnerRecentScans';

interface PartnerOverviewProps {
  totalRevenue: number;
  todayRevenue: number;
  todayDiscounts?: number;
  scans: any[];
  scansLoading: boolean;
  scansError: string | null;
  transactions: any[];
  clients: any[];
  clientsLoading: boolean;
  clientsError: string | null;
  filteredClients: any[];
  onExportData: () => void;
  onScanQR?: () => void;
  onViewStats?: () => void;
  onViewAllTransactions?: () => void;
  validatingQR?: boolean;
}

export function PartnerOverview({
  totalRevenue,
  todayRevenue,
  todayDiscounts = 0,
  scans,
  scansLoading,
  scansError,
  transactions = [],
  clients,
  clientsLoading,
  clientsError,
  filteredClients,
  onExportData,
  onScanQR,
  onViewStats,
  onViewAllTransactions,
  validatingQR = false,
}: PartnerOverviewProps) {
  // Calculer les statistiques du mois
  const monthStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const monthTransactions = transactions.filter((t: any) => {
      const date = new Date(t.createdAt || t.date || t.transactionDate);
      return date >= startOfMonth;
    });

    const lastMonthTransactions = transactions.filter((t: any) => {
      const date = new Date(t.createdAt || t.date || t.transactionDate);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });

    const monthRevenue = monthTransactions.reduce((sum: number, t: any) => sum + (t.amountGross || t.amount || 0), 0);
    const lastMonthRevenue = lastMonthTransactions.reduce((sum: number, t: any) => sum + (t.amountGross || t.amount || 0), 0);
    
    const revenueChange = lastMonthRevenue > 0 
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : undefined;

    // Scans aujourd'hui
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayScans = scans.filter((s: any) => {
      const date = new Date(s.createdAt || s.date || s.scanDate);
      return date >= todayStart;
    }).length;

    // Scans hier
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    const yesterdayScans = scans.filter((s: any) => {
      const date = new Date(s.createdAt || s.date || s.scanDate);
      return date >= yesterdayStart && date < yesterdayEnd;
    }).length;

    const scansChange = todayScans - yesterdayScans;

    // Clients uniques
    const uniqueClients = new Set(
      transactions.map((t: any) => {
        const customer = t.customer || t.client || {};
        return customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      }).filter(Boolean)
    ).size;

    // Nouveaux clients ce mois
    const monthClients = new Set(
      monthTransactions.map((t: any) => {
        const customer = t.customer || t.client || {};
        return customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      }).filter(Boolean)
    );
    const lastMonthClients = new Set(
      lastMonthTransactions.map((t: any) => {
        const customer = t.customer || t.client || {};
        return customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      }).filter(Boolean)
    );
    const newClients = Array.from(monthClients).filter((id) => !lastMonthClients.has(id)).length;

    return {
      monthRevenue,
      revenueChange,
      todayScans,
      scansChange,
      uniqueClients,
      newClients,
    };
  }, [transactions, scans]);

  return (
    <>
      {/* 3 Cartes KPI */}
      <PartnerKPICards
        monthRevenue={monthStats.monthRevenue}
        monthRevenueChange={monthStats.revenueChange}
        todayScans={monthStats.todayScans}
        todayScansChange={monthStats.scansChange}
        uniqueClients={monthStats.uniqueClients}
        newClients={monthStats.newClients}
      />

      {/* Activité du jour */}
      <PartnerDailyActivity transactions={transactions} />

      {/* Actions rapides */}
      <PartnerQuickActions
        onScanClient={onScanQR}
        onViewStats={onViewStats}
      />

     

      {/* Scans récents */}
      <PartnerRecentScans
        scans={scans}
        scansLoading={scansLoading}
        scansError={scansError}
        onScanQR={onScanQR}
      />
    </>
  );
}
