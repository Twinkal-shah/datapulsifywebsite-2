import React from 'react';
import { DashboardLayoutEnhanced } from '@/components/DashboardLayoutEnhanced';
import TopGainersContent from '@/components/dashboard/TopGainersContent';

export function TopGainersReport() {
  return (
    <DashboardLayoutEnhanced
      title="Top Gainers Report"
      comparisonText="Identify pages with significant click growth and optimization opportunities"
    >
      <TopGainersContent isActive={true} />
    </DashboardLayoutEnhanced>
  );
}

export default TopGainersReport; 